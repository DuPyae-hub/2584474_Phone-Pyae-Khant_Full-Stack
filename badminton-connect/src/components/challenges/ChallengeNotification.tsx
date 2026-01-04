import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConfetti } from "@/hooks/useConfetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Swords, Check, X, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: string;
  court_id: string | null;
  proposed_date: string;
  proposed_time: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  challenger?: {
    name: string;
    level: string | null;
    profile_photo: string | null;
  };
  court?: {
    court_name: string;
  } | null;
}

export function ChallengeNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { fireConfetti, fireEmoji } = useConfetti();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Fetch pending challenges for the user
  const { data: challenges } = useQuery({
    queryKey: ["pending-challenges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("challenged_id", user.id)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch challenger profiles
      const challengerIds = data.map(c => c.challenger_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, level, profile_photo")
        .in("id", challengerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Fetch court info
      const courtIds = data.filter(c => c.court_id).map(c => c.court_id);
      const { data: courts } = await supabase
        .from("courts")
        .select("id, court_name")
        .in("id", courtIds);
      
      const courtMap = new Map(courts?.map(c => [c.id, c]) || []);
      
      return data.map(challenge => ({
        ...challenge,
        challenger: profileMap.get(challenge.challenger_id),
        court: challenge.court_id ? courtMap.get(challenge.court_id) : null,
      })) as Challenge[];
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Real-time subscription for new challenges
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('challenge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `challenged_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-challenges", user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-challenges", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Accept challenge mutation
  const acceptMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const challenge = challenges?.find(c => c.id === challengeId);
      if (!challenge || !user?.id) throw new Error("Challenge not found");

      // Update challenge status
      const { error: updateError } = await supabase
        .from("challenges")
        .update({ status: "accepted" })
        .eq("id", challengeId);
      
      if (updateError) throw updateError;

      // Create partner request (current user creates it, challenger is matched)
      const { data: request, error: requestError } = await supabase
        .from("partner_requests")
        .insert({
          created_by_user: user.id,
          matched_user: challenge.challenger_id,
          court_id: challenge.court_id,
          date: challenge.proposed_date,
          time: challenge.proposed_time,
          mode: "tournament",
          status: "matched",
          players_needed: 1,
        })
        .select()
        .single();
      
      if (requestError) throw requestError;

      // Add participant
      await supabase
        .from("partner_request_participants")
        .insert({
          request_id: request.id,
          user_id: user.id,
          status: "joined",
        });

      // Notify challenger
      await supabase.from("notifications").insert({
        user_id: challenge.challenger_id,
        type: "challenge_accepted",
        title: "Challenge Accepted! ⚔️",
        message: `Your challenge has been accepted! Get ready for a tournament match.`,
        related_id: request.id,
      });

      return request;
    },
    onSuccess: () => {
      fireConfetti("celebration");
      fireEmoji("⚔️");
      queryClient.invalidateQueries({ queryKey: ["pending-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["partner-requests"] });
      toast.success("Challenge accepted! Tournament match created.");
    },
    onError: (error: any) => {
      toast.error("Failed to accept challenge: " + error.message);
    },
  });

  // Reject challenge mutation
  const rejectMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const challenge = challenges?.find(c => c.id === challengeId);
      
      const { error } = await supabase
        .from("challenges")
        .update({ status: "rejected" })
        .eq("id", challengeId);
      
      if (error) throw error;

      // Notify challenger
      if (challenge) {
        await supabase.from("notifications").insert({
          user_id: challenge.challenger_id,
          type: "challenge_rejected",
          title: "Challenge Declined",
          message: "Your challenge was declined. Try challenging someone else!",
        });
      }
    },
    onSuccess: (_, challengeId) => {
      setDismissedIds(prev => [...prev, challengeId]);
      queryClient.invalidateQueries({ queryKey: ["pending-challenges"] });
      toast.info("Challenge declined");
    },
  });

  const visibleChallenges = challenges?.filter(c => !dismissedIds.includes(c.id)) || [];

  if (visibleChallenges.length === 0) return null;

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case "beginner": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate": return "bg-primary/20 text-primary border-primary/30";
      case "advanced": return "bg-accent/20 text-accent border-accent/30";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {visibleChallenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <Card className="glass border-2 border-primary/50 shadow-glow overflow-hidden">
              {/* Header with animated gradient */}
              <div className="h-1 gradient-primary animate-pulse" />
              
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Challenger Avatar */}
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={challenge.challenger?.profile_photo || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {challenge.challenger?.name?.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center">
                      <Swords className="w-4 h-4 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">
                        {challenge.challenger?.name || "Unknown"}
                      </span>
                      {challenge.challenger?.level && (
                        <Badge className={`text-xs ${getLevelColor(challenge.challenger.level)}`}>
                          {challenge.challenger.level}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-primary font-medium mb-2">
                      ⚔️ Challenges you to a tournament match!
                    </p>

                    {/* Match Details */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(challenge.proposed_date), "MMM d")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {challenge.proposed_time.slice(0, 5)}
                      </span>
                      {challenge.court && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {challenge.court.court_name}
                        </span>
                      )}
                    </div>

                    {challenge.message && (
                      <p className="text-xs text-muted-foreground italic mb-3">
                        "{challenge.message}"
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => acceptMutation.mutate(challenge.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                      >
                        {acceptMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => rejectMutation.mutate(challenge.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}