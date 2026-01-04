import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConfetti } from "@/hooks/useConfetti";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, Trophy, Gamepad2, CheckCircle, XCircle, Loader2, AlertTriangle, User, Swords, Bell } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, differenceInHours, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MyMatches() {
  const { user, loading: authLoading } = useAuth();
  const { fireConfetti, fireEmoji } = useConfetti();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reportDialog, setReportDialog] = useState<{ open: boolean; match: any }>({ open: false, match: null });
  const [myScore, setMyScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Real-time subscription for match updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('my-matches-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my-matches", user.id] });
          queryClient.invalidateQueries({ queryKey: ["pending-confirmations", user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_requests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my-matches", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Fetch matched requests where user is involved
  const { data: matchedRequests, isLoading } = useQuery({
    queryKey: ["my-matches", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("partner_requests")
        .select("*, court:courts(id, court_name)")
        .or(`created_by_user.eq.${user.id},matched_user.eq.${user.id}`)
        .in("status", ["matched", "arrived", "completed"] as any)
        .order("date", { ascending: true });
      
      if (error) throw error;
      
      // Get profile info for partners
      const userIds = [...new Set(data.flatMap(r => [r.created_by_user, r.matched_user].filter(Boolean)))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, level, profile_photo")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(request => ({
        ...request,
        creator: profileMap.get(request.created_by_user),
        partner: profileMap.get(request.matched_user),
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch challenges (sent and received)
  const { data: challenges } = useQuery({
    queryKey: ["my-challenges", user?.id],
    queryFn: async () => {
      if (!user?.id) return { sent: [], received: [] };
      
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Get all user IDs involved
      const userIds = [...new Set(data.flatMap(c => [c.challenger_id, c.challenged_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, level, profile_photo")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Get court info
      const courtIds = data.filter(c => c.court_id).map(c => c.court_id);
      const { data: courts } = await supabase
        .from("courts")
        .select("id, court_name")
        .in("id", courtIds);
      
      const courtMap = new Map(courts?.map(c => [c.id, c]) || []);
      
      const enriched = data.map(challenge => ({
        ...challenge,
        challenger: profileMap.get(challenge.challenger_id),
        challenged: profileMap.get(challenge.challenged_id),
        court: challenge.court_id ? courtMap.get(challenge.court_id) : null,
      }));
      
      return {
        sent: enriched.filter(c => c.challenger_id === user.id),
        received: enriched.filter(c => c.challenged_id === user.id),
      };
    },
    enabled: !!user?.id,
  });

  // Fetch pending match confirmations
  const { data: pendingConfirmations } = useQuery({
    queryKey: ["pending-confirmations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("matches")
        .select("*, request:partner_requests(id, mode, court:courts(court_name), date, time)")
        .or(`player1.eq.${user.id},player2.eq.${user.id}`)
        .eq("player1_confirmed", true)
        .eq("player2_confirmed", false);
      
      if (error) throw error;
      
      // Get profile info for opponent
      const opponentIds = data.map(m => m.player1 === user.id ? m.player2 : m.player1);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, level")
        .in("id", opponentIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(match => ({
        ...match,
        opponent: profileMap.get(match.player1 === user.id ? match.player2 : match.player1),
        isReporter: match.player1 === user.id,
      }));
    },
    enabled: !!user?.id,
  });

  // Upcoming match notifications
  const notifiedMatches = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!matchedRequests || matchedRequests.length === 0) return;
    
    matchedRequests.forEach(request => {
      if (request.status !== "matched") return;
      if (notifiedMatches.current.has(request.id)) return;
      
      const matchDateTime = parseISO(`${request.date}T${request.time}`);
      const hoursUntil = differenceInHours(matchDateTime, new Date());
      
      if (hoursUntil > 0 && hoursUntil <= 24) {
        notifiedMatches.current.add(request.id);
        const partner = getPartner(request);
        
        if (isToday(parseISO(request.date))) {
          toast.info(`Match today at ${request.time} with ${partner?.name || "your partner"}!`, {
            icon: <Bell className="w-4 h-4" />,
            duration: 8000,
          });
        } else if (isTomorrow(parseISO(request.date))) {
          toast.info(`Match tomorrow at ${request.time} with ${partner?.name || "your partner"}`, {
            icon: <Bell className="w-4 h-4" />,
            duration: 6000,
          });
        }
      }
    });
  }, [matchedRequests]);

  // Cancel challenge mutation
  const cancelChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", challengeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast.success("Challenge cancelled");
    },
  });

  // Mark as arrived mutation
  const arriveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("partner_requests")
        .update({ status: "arrived" as any, updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-matches"] });
      toast.success("Marked as arrived! You can now report match results.");
    },
  });

  // Cancel with penalty mutation
  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) throw new Error("Not logged in");
      
      const { data: request } = await supabase
        .from("partner_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      
      if (!request) throw new Error("Request not found");

      const { data: profile } = await supabase
        .from("profiles")
        .select("experience_points, penalty_count")
        .eq("id", user.id)
        .single();

      const currentExp = profile?.experience_points || 0;
      const expDeduction = Math.floor(currentExp * 0.03);
      const newPenaltyCount = (profile?.penalty_count || 0) + 1;

      await supabase
        .from("partner_requests")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      await supabase.from("penalty_logs").insert({
        user_id: user.id,
        reason: "No-show / Cancellation",
        exp_deducted_percent: 3,
      });

      await supabase
        .from("profiles")
        .update({
          experience_points: Math.max(0, currentExp - expDeduction),
          penalty_count: newPenaltyCount,
          account_suspension_until: newPenaltyCount >= 5 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
            : null,
        })
        .eq("id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-matches"] });
      toast.warning("Match cancelled. You received a penalty for no-show.");
    },
  });

  // Report match result mutation (creates pending confirmation)
  const reportResultMutation = useMutation({
    mutationFn: async ({ requestId, myScoreNum, opponentScoreNum }: { requestId: string; myScoreNum: number; opponentScoreNum: number }) => {
      if (!user?.id) throw new Error("Not logged in");
      
      const request = matchedRequests?.find(r => r.id === requestId);
      if (!request) throw new Error("Match not found");

      const isCreator = request.created_by_user === user.id;
      const partnerId = isCreator ? request.matched_user : request.created_by_user;
      const iWon = myScoreNum > opponentScoreNum;

      // Get reporter's name
      const { data: reporterProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      // Create match record with only reporter's confirmation
      const { data: matchData } = await supabase.from("matches").insert({
        player1: user.id,
        player2: partnerId,
        mode: request.mode,
        score_player1: myScoreNum,
        score_player2: opponentScoreNum,
        winner: iWon ? user.id : partnerId,
        request_id: requestId,
        player1_confirmed: true,
        player2_confirmed: false,
      }).select().single();

      // Create notification for opponent to confirm
      await supabase.from("notifications").insert({
        user_id: partnerId,
        type: "match_confirmation",
        title: "Match Result Needs Confirmation",
        message: `${reporterProfile?.name || "Your opponent"} reported a ${request.mode} match result (${myScoreNum}-${opponentScoreNum}). Please confirm or dispute.`,
        related_id: matchData?.id,
      });

      // Update request status to awaiting confirmation
      await supabase
        .from("partner_requests")
        .update({ status: "completed" as any })
        .eq("id", requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-matches"] });
      queryClient.invalidateQueries({ queryKey: ["pending-confirmations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setReportDialog({ open: false, match: null });
      setMyScore("");
      setOpponentScore("");
      toast.success("Match result submitted! Waiting for opponent confirmation.");
    },
    onError: (error: any) => {
      toast.error("Failed to report result: " + error.message);
    },
  });

  // Confirm match result mutation
  // Confirm match result mutation - uses database function for reliable stats updates
  const confirmResultMutation = useMutation({
    mutationFn: async (matchId: string) => {
      if (!user?.id) throw new Error("Not logged in");
      
      const match = pendingConfirmations?.find(m => m.id === matchId);
      if (!match) throw new Error("Match not found");

      // Determine winner from scores if not set or invalid
      let winnerId = match.winner;
      if (!winnerId || winnerId === "none") {
        if (match.score_player1 != null && match.score_player2 != null) {
          if (match.score_player1 > match.score_player2) {
            winnerId = match.player1;
          } else if (match.score_player2 > match.score_player1) {
            winnerId = match.player2;
          } else {
            winnerId = null; // Draw
          }
        }
      }

      // Update match as confirmed with correct winner
      const { error: matchError } = await supabase
        .from("matches")
        .update({ 
          player2_confirmed: true,
          winner: winnerId 
        })
        .eq("id", matchId);
      
      if (matchError) throw matchError;

      const isFriendly = match.mode === "friendly";
      const player1Won = winnerId === match.player1;

      // Get experience rules
      const { data: rules } = await supabase
        .from("experience_rules")
        .select("*")
        .eq("mode", match.mode)
        .maybeSingle();

      const player1ExpGain = isFriendly 
        ? (rules?.friendly_points || 5)
        : (player1Won ? (rules?.win_points || 15) : (rules?.lose_points || 10));
      
      const player2ExpGain = isFriendly
        ? (rules?.friendly_points || 5)
        : (!player1Won ? (rules?.win_points || 15) : (rules?.lose_points || 10));

      // Call database function to update stats (bypasses RLS with SECURITY DEFINER)
      const { error: statsError } = await supabase.rpc('update_match_stats', {
        p_match_id: matchId,
        p_player1: match.player1,
        p_player2: match.player2,
        p_winner: winnerId || match.player1, // Default to player1 if still no winner (draw case)
        p_mode: match.mode,
        p_player1_exp_gain: player1ExpGain,
        p_player2_exp_gain: player2ExpGain,
        p_is_friendly: isFriendly
      });

      if (statsError) throw statsError;

      // Create notification for the reporter that result was confirmed
      await supabase.from("notifications").insert({
        user_id: match.player1,
        type: "match_confirmed",
        title: "Match Result Confirmed",
        message: `Your opponent confirmed the match result. Stats have been updated!`,
        related_id: matchId,
      });

      // Return whether the current user won
      return { userWon: winnerId === user.id, isFriendly };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["my-matches"] });
      queryClient.invalidateQueries({ queryKey: ["pending-confirmations"] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      // Fire confetti if user won!
      if (result?.userWon && !result?.isFriendly) {
        fireConfetti("win");
        setTimeout(() => fireEmoji("🏆"), 500);
        toast.success("🏆 Congratulations! You won the match!");
      } else if (result?.userWon) {
        fireConfetti("subtle");
        toast.success("Match confirmed! Great game!");
      } else {
        toast.success("Match confirmed! Stats and experience have been updated.");
      }
    },
    onError: (error: any) => {
      toast.error("Failed to confirm: " + error.message);
    },
  });

  // Dispute match result mutation
  const disputeResultMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const match = pendingConfirmations?.find(m => m.id === matchId);
      
      // Delete the unconfirmed match
      await supabase.from("matches").delete().eq("id", matchId);
      
      // Find associated request and revert to arrived status
      if (match?.request_id) {
        await supabase
          .from("partner_requests")
          .update({ status: "arrived" as any })
          .eq("id", match.request_id);
      }

      // Create notification for the reporter that result was disputed
      if (match) {
        await supabase.from("notifications").insert({
          user_id: match.player1,
          type: "match_disputed",
          title: "Match Result Disputed",
          message: "Your opponent disputed the reported match result. Please meet again to report the correct scores.",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-matches"] });
      queryClient.invalidateQueries({ queryKey: ["pending-confirmations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.info("Result disputed. Please re-report the correct scores.");
    },
  });

  const handleReportSubmit = () => {
    const myScoreNum = parseInt(myScore);
    const opponentScoreNum = parseInt(opponentScore);
    
    if (isNaN(myScoreNum) || isNaN(opponentScoreNum)) {
      toast.error("Please enter valid scores");
      return;
    }
    
    reportResultMutation.mutate({
      requestId: reportDialog.match.id,
      myScoreNum,
      opponentScoreNum,
    });
  };

  const getPartner = (request: any) => {
    if (request.created_by_user === user?.id) {
      return request.partner;
    }
    return request.creator;
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case "beginner": return "bg-green-500/20 text-green-400";
      case "intermediate": return "bg-primary/20 text-primary";
      case "advanced": return "bg-accent/20 text-accent";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const matchedOnly = matchedRequests?.filter(r => (r.status as string) === "matched") || [];
  const arrivedOnly = matchedRequests?.filter(r => (r.status as string) === "arrived") || [];
  const completedOnly = matchedRequests?.filter(r => (r.status as string) === "completed") || [];
  const pendingForMe = pendingConfirmations?.filter(m => !m.isReporter) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Badge variant="level" className="mb-4">My Matches</Badge>
            <h1 className="font-display text-4xl font-bold mb-2">
              Your <span className="text-gradient-primary">Matches</span>
            </h1>
            <p className="text-muted-foreground">Manage your upcoming and past matches</p>
          </div>

          {/* Pending Confirmations Alert */}
          {pendingForMe.length > 0 && (
            <Card variant="glass" className="mb-6 border-amber-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  Pending Confirmations ({pendingForMe.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingForMe.map((match) => (
                  <div key={match.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-background/50">
                    <div>
                      <p className="font-medium">
                        {match.opponent?.name || "Unknown"} reported a match result
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score: {match.opponent?.name}: {match.score_player1} - You: {match.score_player2}
                        {match.winner === match.player1 ? ` (${match.opponent?.name} won)` : " (You won)"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {match.mode === "tournament" ? "Tournament" : "Friendly"} • {match.request?.court?.court_name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="hero" 
                        size="sm"
                        onClick={() => confirmResultMutation.mutate(match.id)}
                        disabled={confirmResultMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => disputeResultMutation.mutate(match.id)}
                        disabled={disputeResultMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Dispute
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="glass flex-wrap">
              <TabsTrigger value="upcoming">Upcoming ({matchedOnly.length})</TabsTrigger>
              <TabsTrigger value="arrived">Arrived ({arrivedOnly.length})</TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-1">
                <Swords className="w-3 h-3" />
                Challenges ({(challenges?.sent.length || 0) + (challenges?.received.filter(c => c.status === "pending").length || 0)})
              </TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedOnly.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {matchedOnly.length === 0 ? (
                <Card variant="glass">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No upcoming matches</h3>
                    <p className="text-muted-foreground text-sm">Join a partner request to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {matchedOnly.map((request) => {
                    const partner = getPartner(request);
                    return (
                      <Card key={request.id} variant="glass">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                                {partner?.name?.slice(0, 2).toUpperCase() || "??"}
                              </div>
                              <div>
                                <h3 className="font-semibold">{partner?.name || "Unknown"}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge className={getLevelColor(partner?.level)}>{partner?.level || "N/A"}</Badge>
                                  <Badge variant={request.mode === "tournament" ? "rank" : "success"}>
                                    {request.mode === "tournament" ? <Trophy className="w-3 h-3 mr-1" /> : <Gamepad2 className="w-3 h-3 mr-1" />}
                                    {request.mode}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {request.court?.court_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(request.date), "MMM d")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {request.time}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="hero" 
                                size="sm"
                                onClick={() => arriveMutation.mutate(request.id)}
                                disabled={arriveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Arrived
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="w-5 h-5 text-destructive" />
                                      Cancel Match?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cancelling will result in a <strong>3% experience penalty</strong>. 
                                      After 5 cancellations, your account will be suspended for 1 month.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Go Back</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelMutation.mutate(request.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Cancel Match
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="arrived">
              {arrivedOnly.length === 0 ? (
                <Card variant="glass">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No matches awaiting results</h3>
                    <p className="text-muted-foreground text-sm">Arrive at your match to report results</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {arrivedOnly.map((request) => {
                    const partner = getPartner(request);
                    return (
                      <Card key={request.id} variant="glass">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                                {partner?.name?.slice(0, 2).toUpperCase() || "??"}
                              </div>
                              <div>
                                <h3 className="font-semibold">{partner?.name || "Unknown"}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge className={getLevelColor(partner?.level)}>{partner?.level || "N/A"}</Badge>
                                  <Badge variant={request.mode === "tournament" ? "rank" : "success"}>
                                    {request.mode === "tournament" ? <Trophy className="w-3 h-3 mr-1" /> : <Gamepad2 className="w-3 h-3 mr-1" />}
                                    {request.mode}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {request.court?.court_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(request.date), "MMM d")}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Dialog open={reportDialog.open && reportDialog.match?.id === request.id} onOpenChange={(open) => setReportDialog({ open, match: open ? request : null })}>
                                <DialogTrigger asChild>
                                  <Button variant="hero" size="sm">
                                    <Trophy className="w-4 h-4 mr-1" />
                                    Report Result
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Report Match Result</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <p className="text-sm text-muted-foreground">
                                      Enter the final scores. Your opponent will need to confirm the result.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Your Score</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={myScore}
                                          onChange={(e) => setMyScore(e.target.value)}
                                          placeholder="Your score"
                                        />
                                      </div>
                                      <div>
                                        <Label>{partner?.name || "Opponent"}'s Score</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={opponentScore}
                                          onChange={(e) => setOpponentScore(e.target.value)}
                                          placeholder="Opponent score"
                                        />
                                      </div>
                                    </div>
                                    <Button 
                                      className="w-full" 
                                      onClick={handleReportSubmit}
                                      disabled={reportResultMutation.isPending}
                                    >
                                      {reportResultMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                      Submit Result
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="w-5 h-5 text-destructive" />
                                      Cancel Match?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cancelling after arrival will result in a <strong>3% experience penalty</strong>. 
                                      After 5 cancellations, your account will be suspended for 1 month.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Go Back</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelMutation.mutate(request.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Cancel Match
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges">
              {(!challenges?.sent.length && !challenges?.received.length) ? (
                <Card variant="glass">
                  <CardContent className="p-8 text-center">
                    <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No challenges</h3>
                    <p className="text-muted-foreground text-sm">Challenge players from the Rankings page</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Received Challenges */}
                  {challenges?.received.filter(c => c.status === "pending").length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Badge variant="default" className="bg-primary/20">Received</Badge>
                      </h3>
                      <div className="grid gap-4">
                        {challenges.received.filter(c => c.status === "pending").map((challenge: any) => (
                          <Card key={challenge.id} variant="glass" className="border-primary/30">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="w-12 h-12 border-2 border-primary">
                                    <AvatarImage src={challenge.challenger?.profile_photo || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                      {challenge.challenger?.name?.slice(0, 2).toUpperCase() || "??"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold">{challenge.challenger?.name || "Unknown"}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Badge className={getLevelColor(challenge.challenger?.level)}>
                                        {challenge.challenger?.level || "N/A"}
                                      </Badge>
                                      <Badge variant="rank">
                                        <Swords className="w-3 h-3 mr-1" />
                                        Challenge
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {challenge.court && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {challenge.court.court_name}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(challenge.proposed_date), "MMM d")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {challenge.proposed_time?.slice(0, 5)}
                                  </div>
                                </div>
                                <p className="text-xs text-amber-400">
                                  Respond via floating notification
                                </p>
                              </div>
                              {challenge.message && (
                                <p className="text-sm text-muted-foreground mt-3 italic">"{challenge.message}"</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent Challenges */}
                  {challenges?.sent.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Badge variant="outline">Sent</Badge>
                      </h3>
                      <div className="grid gap-4">
                        {challenges.sent.map((challenge: any) => (
                          <Card key={challenge.id} variant="glass">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={challenge.challenged?.profile_photo || ""} />
                                    <AvatarFallback className="bg-muted font-bold">
                                      {challenge.challenged?.name?.slice(0, 2).toUpperCase() || "??"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold">{challenge.challenged?.name || "Unknown"}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Badge className={getLevelColor(challenge.challenged?.level)}>
                                        {challenge.challenged?.level || "N/A"}
                                      </Badge>
                                      <Badge variant={challenge.status === "accepted" ? "success" : "outline"}>
                                        {challenge.status === "accepted" ? "Accepted" : "Pending"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {challenge.court && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {challenge.court.court_name}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(challenge.proposed_date), "MMM d")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {challenge.proposed_time?.slice(0, 5)}
                                  </div>
                                </div>
                                {challenge.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => cancelChallengeMutation.mutate(challenge.id)}
                                    disabled={cancelChallengeMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedOnly.length === 0 ? (
                <Card variant="glass">
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No completed matches</h3>
                    <p className="text-muted-foreground text-sm">Your match history will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {completedOnly.map((request) => {
                    const partner = getPartner(request);
                    return (
                      <Card key={request.id} variant="glass">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold">
                                {partner?.name?.slice(0, 2).toUpperCase() || "??"}
                              </div>
                              <div>
                                <h3 className="font-semibold">{partner?.name || "Unknown"}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge className={getLevelColor(partner?.level)}>{partner?.level || "N/A"}</Badge>
                                  <Badge variant={request.mode === "tournament" ? "rank" : "success"}>
                                    {request.mode === "tournament" ? <Trophy className="w-3 h-3 mr-1" /> : <Gamepad2 className="w-3 h-3 mr-1" />}
                                    {request.mode}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {request.court?.court_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(request.date), "MMM d")}
                              </div>
                            </div>
                            <Badge variant="outline">Completed</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
