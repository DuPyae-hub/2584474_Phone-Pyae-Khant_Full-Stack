import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Zap, User, Swords } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CreateChallengeDialog } from "@/components/challenges/CreateChallengeDialog";

type UserLevel = "beginner" | "intermediate" | "advanced";

interface RankedPlayer {
  id: string;
  name: string;
  profile_photo: string | null;
  experience_points: number;
  total_wins: number;
  total_losses: number;
  total_matches_played: number;
  level: UserLevel;
  ranking_position: number | null;
}

const getTrendIcon = (position: number) => {
  if (position <= 2) return <TrendingUp className="w-4 h-4 text-accent" />;
  if (position >= 8) return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
    case 2: return <Medal className="w-6 h-6 text-gray-400" />;
    case 3: return <Award className="w-6 h-6 text-amber-600" />;
    default: return <span className="font-display font-bold text-lg text-muted-foreground">#{rank}</span>;
  }
};

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

export default function Rankings() {
  const [activeLevel, setActiveLevel] = useState<UserLevel>("intermediate");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time subscription for rankings updates
  useEffect(() => {
    const channel = supabase
      .channel('rankings-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["rankings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: rankings, isLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, profile_photo, experience_points, total_wins, total_losses, total_matches_played, level, ranking_position")
        .order("experience_points", { ascending: false });
      
      if (error) throw error;
      
      const grouped: Record<UserLevel, RankedPlayer[]> = {
        beginner: [],
        intermediate: [],
        advanced: [],
      };
      
      data?.forEach((player) => {
        const level = (player.level || "beginner") as UserLevel;
        if (grouped[level]) {
          grouped[level].push(player as RankedPlayer);
        }
      });

      Object.keys(grouped).forEach((level) => {
        grouped[level as UserLevel] = grouped[level as UserLevel]
          .sort((a, b) => (b.experience_points || 0) - (a.experience_points || 0))
          .slice(0, 10)
          .map((player, index) => ({
            ...player,
            ranking_position: index + 1,
          }));
      });

      return grouped;
    },
  });

  const handleChallenge = (playerId: string, playerName: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to challenge players.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (playerId === user.id) {
      toast({
        title: "Can't challenge yourself",
        description: "You cannot challenge yourself to a match.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to partners page with pre-selected challenge
    navigate(`/partners?challenge=${playerId}&name=${encodeURIComponent(playerName)}`);
    toast({
      title: "Challenge initiated",
      description: `Create a partner request to challenge ${playerName}!`,
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="rank" className="mb-4">
              <Trophy className="w-4 h-4 mr-1" />
              Leaderboard
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Player <span className="text-gradient-primary">Rankings</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Compete in tournament matches to climb the leaderboard. Top players earn recognition and exclusive rewards.
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading rankings...</p>
            </div>
          )}

          {/* Level Tabs */}
          {!isLoading && rankings && (
            <Tabs value={activeLevel} onValueChange={(v) => setActiveLevel(v as UserLevel)} className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="glass">
                  <TabsTrigger value="beginner" className="data-[state=active]:gradient-primary">
                    Beginner ({rankings.beginner?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="intermediate" className="data-[state=active]:gradient-primary">
                    Intermediate ({rankings.intermediate?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="data-[state=active]:gradient-primary">
                    Advanced ({rankings.advanced?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              {(["beginner", "intermediate", "advanced"] as UserLevel[]).map((level) => {
                const players = rankings[level] || [];
                
                return (
                  <TabsContent key={level} value={level} className="space-y-6">
                    {players.length === 0 ? (
                      <Card variant="glass" className="text-center py-12">
                        <CardContent>
                          <span className="text-6xl mb-4 block">🏆</span>
                          <h3 className="font-display text-xl font-semibold mb-2">No players yet</h3>
                          <p className="text-muted-foreground">Be the first to compete at {level} level!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Top 3 Podium */}
                        {players.length >= 3 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {[1, 0, 2].map((podiumIndex) => {
                              const player = players[podiumIndex];
                              if (!player) return null;
                              
                              const range = getXPRange(level);
                              const progress = ((player.experience_points - range.min) / (range.max - range.min)) * 100;
                              
                              return (
                                <Card 
                                  key={player.id}
                                  variant={podiumIndex === 0 ? "elevated" : "glass"}
                                  className={`relative overflow-hidden ${podiumIndex === 0 ? 'md:-mt-4 shadow-glow' : ''}`}
                                >
                                  {podiumIndex === 0 && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
                                  )}
                                  <CardContent className="p-6 relative">
                                    <div className="text-center">
                                      <div className="flex justify-center mb-4">
                                        {getRankIcon(podiumIndex + 1)}
                                      </div>
                                      {player.profile_photo ? (
                                        <img 
                                          src={player.profile_photo} 
                                          alt={player.name}
                                          className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                                        />
                                      ) : (
                                        <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold ${podiumIndex === 0 ? 'gradient-primary text-primary-foreground' : 'gradient-card text-foreground'}`}>
                                          {getInitials(player.name)}
                                        </div>
                                      )}
                                      <h3 className="font-display font-semibold text-lg mb-1">{player.name}</h3>
                                      <div className="flex items-center justify-center gap-1 text-primary mb-3">
                                        <Zap className="w-4 h-4" />
                                        <span className="font-bold">{player.experience_points || 0} XP</span>
                                      </div>
                                      <Progress value={Math.min(progress, 100)} className="h-2 mb-3" />
                                      <div className="flex justify-center gap-4 text-sm text-muted-foreground mb-4">
                                        <span className="text-accent">{player.total_wins || 0}W</span>
                                        <span className="text-destructive">{player.total_losses || 0}L</span>
                                        <span>{player.total_matches_played || 0} matches</span>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex gap-2 justify-center">
                                        <Button asChild variant="outline" size="sm">
                                          <Link to={`/profile/${player.id}`}>
                                            <User className="w-4 h-4 mr-1" />
                                            Profile
                                          </Link>
                                        </Button>
                                        {user?.id !== player.id && (
                                          <CreateChallengeDialog
                                            playerId={player.id}
                                            playerName={player.name}
                                            trigger={
                                              <Button variant="default" size="sm">
                                                <Swords className="w-4 h-4 mr-1" />
                                                Challenge
                                              </Button>
                                            }
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}

                        {/* Full Ranking Table */}
                        <Card variant="glass">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getLevelColor(level)}`} />
                              {level.charAt(0).toUpperCase() + level.slice(1)} Leaderboard
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-left text-sm text-muted-foreground border-b border-border">
                                    <th className="pb-3 pr-4">Rank</th>
                                    <th className="pb-3 pr-4">Player</th>
                                    <th className="pb-3 pr-4">XP</th>
                                    <th className="pb-3 pr-4">W/L</th>
                                    <th className="pb-3 pr-4">Matches</th>
                                    <th className="pb-3 pr-4">Trend</th>
                                    <th className="pb-3">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {players.map((player, index) => {
                                    const range = getXPRange(level);
                                    const progress = ((player.experience_points - range.min) / (range.max - range.min)) * 100;
                                    const rank = index + 1;
                                    
                                    return (
                                      <tr key={player.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="py-4 pr-4">
                                          <div className="flex items-center justify-center w-10">
                                            {getRankIcon(rank)}
                                          </div>
                                        </td>
                                        <td className="py-4 pr-4">
                                          <div className="flex items-center gap-3">
                                            {player.profile_photo ? (
                                              <img 
                                                src={player.profile_photo} 
                                                alt={player.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-10 h-10 rounded-full gradient-card flex items-center justify-center text-sm font-bold">
                                                {getInitials(player.name)}
                                              </div>
                                            )}
                                            <span className="font-medium">{player.name}</span>
                                          </div>
                                        </td>
                                        <td className="py-4 pr-4">
                                          <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-primary" />
                                            <span className="font-semibold">{player.experience_points || 0}</span>
                                          </div>
                                        </td>
                                        <td className="py-4 pr-4">
                                          <span className="text-accent">{player.total_wins || 0}</span>
                                          <span className="text-muted-foreground"> / </span>
                                          <span className="text-destructive">{player.total_losses || 0}</span>
                                        </td>
                                        <td className="py-4 pr-4 text-muted-foreground">{player.total_matches_played || 0}</td>
                                        <td className="py-4 pr-4">{getTrendIcon(rank)}</td>
                                        <td className="py-4">
                                          <div className="flex gap-2">
                                            <Button asChild variant="ghost" size="sm">
                                              <Link to={`/profile/${player.id}`}>
                                                <User className="w-4 h-4" />
                                              </Link>
                                            </Button>
                                            {user?.id !== player.id && (
                                              <CreateChallengeDialog
                                                playerId={player.id}
                                                playerName={player.name}
                                                trigger={
                                                  <Button variant="ghost" size="sm">
                                                    <Swords className="w-4 h-4" />
                                                  </Button>
                                                }
                                              />
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}