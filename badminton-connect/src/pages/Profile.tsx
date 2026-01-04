import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Zap, Target, Calendar, Phone, Mail, 
  ArrowLeft, Shield, AlertTriangle, Clock
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";

const getLevelColor = (level: string) => {
  switch (level) {
    case "beginner": return "bg-green-500";
    case "intermediate": return "bg-primary";
    case "advanced": return "bg-accent";
    default: return "bg-secondary";
  }
};

const getXPRange = (level: string) => {
  switch (level) {
    case "beginner": return { min: 0, max: 500 };
    case "intermediate": return { min: 501, max: 1500 };
    case "advanced": return { min: 1501, max: 3000 };
    default: return { min: 0, max: 100 };
  }
};

const getMembershipBadge = (status: string | null) => {
  switch (status) {
    case "active": return <Badge variant="level" className="bg-accent text-accent-foreground">Active Member</Badge>;
    case "trial": return <Badge variant="outline">Free Trial</Badge>;
    case "expired": return <Badge variant="destructive">Expired</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwnProfile = user?.id === id;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Real-time subscription for profile updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`profile-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["profile", id] });
          queryClient.invalidateQueries({ queryKey: ["recent-matches", id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const { data: recentMatches } = useQuery({
    queryKey: ["recent-matches", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .or(`player1.eq.${id},player2.eq.${id}`)
        .eq("player1_confirmed", true)
        .eq("player2_confirmed", true)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Fetch opponent profiles separately
      if (data && data.length > 0) {
        const opponentIds = data.map(m => m.player1 === id ? m.player2 : m.player1);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, profile_photo")
          .in("id", opponentIds);
        
        return data.map(match => ({
          ...match,
          opponent: profiles?.find(p => p.id === (match.player1 === id ? match.player2 : match.player1))
        }));
      }
      
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <span className="text-6xl mb-4 block">😕</span>
            <h1 className="font-display text-2xl font-bold mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground mb-6">This player profile doesn't exist.</p>
            <Link to="/rankings">
              <Button variant="hero">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rankings
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const range = getXPRange(profile.level || "beginner");
  const xpProgress = (((profile.experience_points || 0) - range.min) / (range.max - range.min)) * 100;
  const winRate = profile.total_matches_played 
    ? Math.round(((profile.total_wins || 0) / profile.total_matches_played) * 100)
    : 0;

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link to="/rankings" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rankings
          </Link>

          {/* Profile Header */}
          <Card variant="elevated" className="mb-8 overflow-hidden">
            <div className="h-32 gradient-primary opacity-80" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
                {isOwnProfile ? (
                  <ProfilePhotoUpload
                    userId={user.id}
                    currentPhotoUrl={profile.profile_photo}
                    name={profile.name}
                    onPhotoUpdated={(url) => {
                      queryClient.invalidateQueries({ queryKey: ["profile", id] });
                    }}
                  />
                ) : profile.profile_photo ? (
                  <img 
                    src={profile.profile_photo} 
                    alt={profile.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background gradient-card flex items-center justify-center text-3xl font-bold">
                    {getInitials(profile.name)}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <h1 className="font-display text-2xl sm:text-3xl font-bold">{profile.name}</h1>
                    {getMembershipBadge(profile.membership_status)}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getLevelColor(profile.level || "beginner")}`} />
                      {(profile.level || "beginner").charAt(0).toUpperCase() + (profile.level || "beginner").slice(1)}
                    </span>
                    {profile.ranking_position && (
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-primary" />
                        Rank #{profile.ranking_position}
                      </span>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div className="mt-3">
                      <EditProfileDialog 
                        profile={profile}
                        onProfileUpdated={() => queryClient.invalidateQueries({ queryKey: ["profile", id] })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stats Card */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      {profile.experience_points || 0} XP
                    </span>
                  </div>
                  <Progress value={Math.min(xpProgress, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {range.max - (profile.experience_points || 0)} XP to next level
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-accent">{profile.total_wins || 0}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-destructive">{profile.total_losses || 0}</p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold">{profile.total_matches_played || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-bold text-lg">{winRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOwnProfile && profile.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.gender && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="text-sm capitalize">{profile.gender}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Penalties */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Standing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Penalties</span>
                  <Badge variant={profile.penalty_count > 0 ? "destructive" : "outline"}>
                    {profile.penalty_count || 0}
                  </Badge>
                </div>
                {profile.account_suspension_until && new Date(profile.account_suspension_until) > new Date() ? (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Suspended until {new Date(profile.account_suspension_until).toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm text-accent">Good Standing ✓</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Matches */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Recent Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMatches && recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {recentMatches.map((match: any) => {
                    const isPlayer1 = match.player1 === id;
                    const opponent = match.opponent;
                    const playerScore = isPlayer1 ? match.score_player1 : match.score_player2;
                    const opponentScore = isPlayer1 ? match.score_player2 : match.score_player1;
                    const isWinner = match.winner === id;
                    
                    return (
                      <div 
                        key={match.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isWinner ? 'border-accent/30 bg-accent/5' : 'border-destructive/30 bg-destructive/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={match.mode === "tournament" ? "default" : "outline"}>
                            {match.mode}
                          </Badge>
                          <span className="text-sm">vs {opponent?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono">
                            {playerScore ?? '-'} : {opponentScore ?? '-'}
                          </span>
                          <Badge variant={isWinner ? "default" : "destructive"}>
                            {isWinner ? "WIN" : "LOSS"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">🏸</span>
                  <p className="text-muted-foreground">No matches played yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
