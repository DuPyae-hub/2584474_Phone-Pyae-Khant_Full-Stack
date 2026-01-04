import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { LikersPopover } from "@/components/community/LikersPopover";
import { 
  MessageSquare, 
  Send, 
  Trash2,
  Loader2
} from "lucide-react";

const getLevelColor = (level: string | null) => {
  switch (level?.toLowerCase()) {
    case "beginner": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "intermediate": return "bg-primary/20 text-primary border-primary/30";
    case "advanced": return "bg-accent/20 text-accent border-accent/30";
    default: return "bg-secondary text-secondary-foreground";
  }
};

export default function Community() {
  const [newPost, setNewPost] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch posts with user profiles
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      // Fetch profiles for all posts
      const userIds = [...new Set(postsData.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_photo, level")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return postsData.map((post) => ({
        ...post,
        profile: profileMap.get(post.user_id),
      }));
    },
  });

  // Fetch user's likes
  const { data: userLikes } = useQuery({
    queryKey: ["post-likes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((l) => l.post_id);
    },
    enabled: !!user?.id,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("Not logged in");
      const { error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setNewPost("");
      toast.success("Experience shared!");
    },
    onError: (error) => {
      toast.error("Failed to post: " + error.message);
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error("Not logged in");
      
      // Check current like status directly from database
      const { data: existingLike } = await supabase
        .from("post_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .maybeSingle();
      
      if (existingLike) {
        // Unlike - delete the like
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("id", existingLike.id);
        if (error) throw error;
      } else {
        // Like - insert new like
        const { error } = await supabase
          .from("post_likes")
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }
      
      // Get actual count from post_likes table
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      
      // Update with actual count
      await supabase
        .from("posts")
        .update({ likes_count: count || 0 })
        .eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-likes"] });
      queryClient.invalidateQueries({ queryKey: ["post-likers"] });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    if (!user) {
      toast.error("Please login to share your experience");
      return;
    }
    createPostMutation.mutate(newPost.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="level" className="mb-4">
              <MessageSquare className="w-4 h-4 mr-1" />
              Community
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Share Your <span className="text-gradient-primary">Experience</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect with fellow players, share your badminton journey, and learn from the community.
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto">
            {/* Create Post */}
            <Card variant="glass" className="mb-6">
              <CardContent className="p-4">
                <form onSubmit={handleSubmit}>
                  <Textarea
                    placeholder={user ? "Share your badminton experience, tips, or match stories..." : "Login to share your experience"}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="mb-3 min-h-[100px] bg-secondary/50"
                    disabled={!user}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {user ? `Posting as ${user.email}` : "Login to post"}
                    </p>
                    <Button 
                      type="submit" 
                      disabled={!user || !newPost.trim() || createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Share
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Posts List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : posts?.length === 0 ? (
              <Card variant="glass">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No experiences shared yet</h3>
                  <p className="text-muted-foreground text-sm">Be the first to share your badminton journey!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts?.map((post) => (
                  <Card key={post.id} variant="glass" className="group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.profile?.profile_photo || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {post.profile?.name?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm">{post.profile?.name || "User"}</span>
                            {post.profile?.level && (
                              <Badge className={`text-xs ${getLevelColor(post.profile.level)}`}>
                                {post.profile.level}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4">
                            <LikersPopover
                              postId={post.id}
                              likesCount={post.likes_count || 0}
                              isLiked={userLikes?.includes(post.id) || false}
                              onToggleLike={() => {
                                if (!user) {
                                  toast.error("Please login to like posts");
                                  return;
                                }
                                toggleLikeMutation.mutate(post.id);
                              }}
                              disabled={!user}
                            />
                            {user?.id === post.user_id && (
                              <button
                                onClick={() => deletePostMutation.mutate(post.id)}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
