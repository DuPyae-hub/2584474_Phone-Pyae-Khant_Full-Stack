import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Trophy, 
  Gamepad2,
  Search,
  Loader2,
  CheckCircle2,
  UserPlus,
  XCircle,
  Users
} from "lucide-react";
import { CreatePartnerRequestDialog } from "@/components/partners/CreatePartnerRequestDialog";
import { MatchResultDialog } from "@/components/partners/MatchResultDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Participant {
  id: string;
  user_id: string;
  status: string;
  profile?: {
    name: string;
    level: string | null;
    profile_photo: string | null;
  } | null;
}

export default function Partners() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const challengePlayerId = searchParams.get("challenge");
  const challengePlayerName = searchParams.get("name");

  // Show toast when challenge params are present
  useEffect(() => {
    if (challengePlayerId && challengePlayerName) {
      toast({
        title: `Challenge ${challengePlayerName}`,
        description: "Create a partner request to challenge this player!",
      });
    }
  }, [challengePlayerId, challengePlayerName, toast]);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["partner-requests"],
    queryFn: async () => {
      // Get partner requests
      const { data: partnerRequests, error: requestsError } = await supabase
        .from("partner_requests")
        .select("*, court:courts(id, court_name)")
        .order("created_at", { ascending: false });
      
      if (requestsError) throw requestsError;
      
      // Get participants for all requests
      const requestIds = partnerRequests.map(r => r.id);
      const { data: participants, error: participantsError } = await supabase
        .from("partner_request_participants")
        .select("*")
        .in("request_id", requestIds);
      
      if (participantsError) throw participantsError;

      // Get unique user IDs (creators + participants)
      const participantUserIds = participants?.map(p => p.user_id) || [];
      const creatorIds = partnerRequests.map(r => r.created_by_user);
      const userIds = [...new Set([...creatorIds, ...participantUserIds])];
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, level, phone, profile_photo")
        .in("id", userIds);
      
      if (profilesError) throw profilesError;
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      // Map participants with their profiles
      const participantsByRequest = new Map<string, Participant[]>();
      participants?.forEach(p => {
        const existing = participantsByRequest.get(p.request_id) || [];
        existing.push({
          ...p,
          profile: profileMap.get(p.user_id) || null
        });
        participantsByRequest.set(p.request_id, existing);
      });

      return partnerRequests.map(request => ({
        ...request,
        creator: profileMap.get(request.created_by_user) || null,
        participants: participantsByRequest.get(request.id) || []
      }));
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      // Get user's profile for notification
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      
      // Insert participant
      const { error } = await supabase
        .from("partner_request_participants")
        .insert({ 
          request_id: requestId,
          user_id: user.id,
          status: "joined"
        });
      
      if (error) throw error;

      // Get the request to check if it's now full and get creator info
      const request = requests?.find(r => r.id === requestId);
      if (request) {
        const currentParticipants = request.participants.filter((p: Participant) => p.status !== "cancelled").length;
        const newParticipantCount = currentParticipants + 1;
        
        // Create notification for requestor
        await supabase
          .from("notifications")
          .insert({
            user_id: request.created_by_user,
            type: "player_joined",
            title: "Player Joined Your Request",
            message: `${userProfile?.name || "Someone"} has joined your partner request!`,
            related_id: requestId
          });

        // Update status to "matched" if full
        if (newParticipantCount >= request.players_needed) {
          await supabase
            .from("partner_requests")
            .update({ status: "matched" })
            .eq("id", requestId);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Request Joined",
        description: "You have successfully joined this partner request!",
      });
      queryClient.invalidateQueries({ queryKey: ["partner-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join request",
        variant: "destructive",
      });
    },
  });

  const markArrivedMutation = useMutation({
    mutationFn: async ({ requestId, isCreator }: { requestId: string; isCreator: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      
      if (isCreator) {
        // Creator marks request as arrived
        const { error } = await supabase
          .from("partner_requests")
          .update({ status: "arrived" })
          .eq("id", requestId);
        if (error) throw error;
      } else {
        // Participant marks themselves as arrived
        const { error } = await supabase
          .from("partner_request_participants")
          .update({ status: "arrived" })
          .eq("request_id", requestId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Marked as Arrived",
        description: "You've been marked as arrived!",
      });
      queryClient.invalidateQueries({ queryKey: ["partner-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as arrived",
        variant: "destructive",
      });
    },
  });

  const cancelParticipationMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("partner_request_participants")
        .delete()
        .eq("request_id", requestId)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Left Request",
        description: "You have left this partner request.",
      });
      queryClient.invalidateQueries({ queryKey: ["partner-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave request",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests?.filter(request => {
    const creatorName = request.creator?.name || "";
    const courtName = request.court?.court_name || "";
    const matchesSearch = 
      creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courtName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || request.creator?.level === levelFilter;
    const matchesMode = modeFilter === "all" || request.mode === modeFilter;
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesLevel && matchesMode && matchesStatus;
  }) ?? [];

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case "beginner": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate": return "bg-primary/20 text-primary border-primary/30";
      case "advanced": return "bg-accent/20 text-accent border-accent/30";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "open": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "matched": return "bg-primary/20 text-primary border-primary/30";
      case "arrived": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "completed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case "joined": return "bg-primary/20 text-primary";
      case "arrived": return "bg-green-500/20 text-green-400";
      case "cancelled": return "bg-destructive/20 text-destructive";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatWantedLevel = (level: string | null) => {
    if (!level) return "Any Level";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Challenge Banner */}
          {challengePlayerName && (
            <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Challenging {challengePlayerName}</p>
                  <p className="text-sm text-muted-foreground">Create a partner request to challenge this player</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSearchParams({})}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div>
              <Badge variant="level" className="mb-4">Find Partners</Badge>
              <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
                Partner <span className="text-gradient-primary">Requests</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">
                Browse open requests or create your own. Connect with players at your skill level.
              </p>
            </div>
            <CreatePartnerRequestDialog 
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["partner-requests"] })} 
            />
          </div>

          {/* Filters */}
          <div className="glass rounded-xl p-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by player or court..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Match type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Requests List */}
          {!isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRequests.map((request) => {
                const activeParticipants = request.participants.filter((p: Participant) => p.status !== "cancelled");
                const userParticipant = request.participants.find((p: Participant) => p.user_id === user?.id);
                const isCreator = user?.id === request.created_by_user;
                const canJoin = user && !isCreator && !userParticipant && 
                               request.status === "open" && 
                               activeParticipants.length < request.players_needed;
                const allArrived = activeParticipants.length >= request.players_needed && 
                                  activeParticipants.every((p: Participant) => p.status === "arrived");

                return (
                  <Card key={request.id} variant="interactive" className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                            {getInitials(request.creator?.name)}
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-lg">
                              {request.creator?.name || "Unknown"}
                              {isCreator && <span className="text-primary ml-1">(You)</span>}
                            </h3>
                            <Badge className={getLevelColor(request.creator?.level)}>
                              {formatWantedLevel(request.creator?.level)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge 
                            variant={request.mode === "tournament" ? "rank" : "success"}
                            className="flex items-center gap-1"
                          >
                            {request.mode === "tournament" ? (
                              <><Trophy className="w-3 h-3" /> Tournament</>
                            ) : (
                              <><Gamepad2 className="w-3 h-3" /> Friendly</>
                            )}
                          </Badge>
                          <Badge className={`text-xs capitalize ${getStatusColor(request.status)}`}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="truncate">
                            {request.court?.court_name || "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{format(new Date(request.date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{request.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4 text-primary" />
                          <span>{activeParticipants.length}/{request.players_needed} joined</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4 text-primary" />
                          <span className="truncate">{formatWantedLevel(request.wanted_level)}</span>
                        </div>
                      </div>

                      {/* Participants List */}
                      {activeParticipants.length > 0 && (
                        <div className="glass rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-2">Players Joined ({activeParticipants.length})</p>
                          <div className="space-y-2">
                            {activeParticipants.map((participant: Participant) => (
                              <div key={participant.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                    {getInitials(participant.profile?.name || null)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {participant.profile?.name || "Unknown"}
                                      {participant.user_id === user?.id && <span className="text-primary ml-1">(You)</span>}
                                    </p>
                                    <Badge className={`text-xs ${getLevelColor(participant.profile?.level || null)}`}>
                                      {formatWantedLevel(participant.profile?.level || null)}
                                    </Badge>
                                  </div>
                                </div>
                                <Badge className={`text-xs capitalize ${getParticipantStatusColor(participant.status)}`}>
                                  {participant.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {user && request.phone && (
                        <div className="glass rounded-lg p-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{request.phone}</span>
                        </div>
                      )}

                      {!user && (
                        <div className="glass rounded-lg p-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Login to view contact</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {/* Can join */}
                        {canJoin && (
                          <Button 
                            variant="hero" 
                            className="flex-1"
                            onClick={() => joinMutation.mutate(request.id)}
                            disabled={joinMutation.isPending}
                          >
                            {joinMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4 mr-2" />
                            )}
                            Join Request
                          </Button>
                        )}

                        {/* Creator waiting for players */}
                        {isCreator && (request.status === "open" || request.status === "matched") && activeParticipants.length < request.players_needed && (
                          <Button variant="glass" className="flex-1" disabled>
                            Waiting for {request.players_needed - activeParticipants.length} more player(s)...
                          </Button>
                        )}

                        {/* Creator waiting for participants to arrive */}
                        {isCreator && request.status === "matched" && activeParticipants.length >= request.players_needed && !allArrived && (
                          <Button variant="glass" className="flex-1" disabled>
                            Waiting for players to arrive...
                          </Button>
                        )}

                        {/* Creator can mark arrived when all participants have arrived */}
                        {isCreator && (request.status === "open" || request.status === "matched") && allArrived && (
                          <Button 
                            variant="hero" 
                            className="flex-1"
                            onClick={() => markArrivedMutation.mutate({ requestId: request.id, isCreator: true })}
                            disabled={markArrivedMutation.isPending}
                          >
                            {markArrivedMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            Close Request & Start Session
                          </Button>
                        )}

                        {/* Participant can mark arrived or cancel */}
                        {userParticipant && userParticipant.status === "joined" && (
                          <>
                            <Button 
                              variant="hero" 
                              className="flex-1"
                              onClick={() => markArrivedMutation.mutate({ requestId: request.id, isCreator: false })}
                              disabled={markArrivedMutation.isPending}
                            >
                              {markArrivedMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              I've Arrived
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={() => cancelParticipationMutation.mutate(request.id)}
                              disabled={cancelParticipationMutation.isPending}
                              title="Leave request"
                            >
                              {cancelParticipationMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}

                        {/* Participant already arrived */}
                        {userParticipant && userParticipant.status === "arrived" && request.status !== "arrived" && request.status !== "completed" && (
                          <Button variant="glass" className="flex-1" disabled>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            You've Arrived - Waiting for others
                          </Button>
                        )}

                        {/* Request arrived - show report result for creator/participants */}
                        {request.status === "arrived" && (isCreator || userParticipant) && (
                          <MatchResultDialog
                            requestId={request.id}
                            creatorId={request.created_by_user}
                            creatorName={request.creator?.name || "Unknown"}
                            participants={activeParticipants}
                            mode={request.mode}
                          />
                        )}

                        {/* Request completed */}
                        {request.status === "completed" && (
                          <Button variant="glass" className="flex-1" disabled>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Match Completed
                          </Button>
                        )}

                        {/* Full but user not part of it */}
                        {user && !isCreator && !userParticipant && 
                         activeParticipants.length >= request.players_needed && (request.status === "open" || request.status === "matched") && (
                          <Button variant="glass" className="flex-1" disabled>
                            Request Full
                          </Button>
                        )}

                        {/* Not logged in */}
                        {!user && (
                          <Button variant="hero" className="flex-1" asChild>
                            <a href="/login">Login to Join</a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && filteredRequests.length === 0 && (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="font-display text-xl font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new request</p>
              <CreatePartnerRequestDialog 
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["partner-requests"] })} 
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
