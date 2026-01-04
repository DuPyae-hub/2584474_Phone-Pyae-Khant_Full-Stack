import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LikersPopoverProps {
  postId: string;
  likesCount: number;
  isLiked: boolean;
  onToggleLike: () => void;
  disabled?: boolean;
}

export function LikersPopover({ 
  postId, 
  likesCount, 
  isLiked, 
  onToggleLike,
  disabled 
}: LikersPopoverProps) {
  const [open, setOpen] = useState(false);

  const { data: likers, isLoading } = useQuery({
    queryKey: ["post-likers", postId],
    queryFn: async () => {
      const { data: likes, error } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", postId);

      if (error) throw error;
      if (!likes.length) return [];

      const userIds = likes.map((l) => l.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_photo")
        .in("id", userIds);

      return profiles || [];
    },
    enabled: open && likesCount > 0,
  });

  return (
    <div className="flex items-center gap-2">
      {/* Like Button - Separate from popover */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            onToggleLike();
          }
        }}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300 ${
          isLiked
            ? "bg-destructive/10 text-destructive"
            : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <Heart className={`w-4 h-4 transition-transform ${isLiked ? "fill-destructive scale-110" : ""}`} />
      </button>

      {/* Likes Count with Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button 
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
            disabled={likesCount === 0}
          >
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </button>
        </PopoverTrigger>
        {likesCount > 0 && (
          <PopoverContent className="w-64 p-2" align="start">
            <div className="text-sm font-semibold mb-2 px-2">
              Liked by {likesCount} {likesCount === 1 ? "person" : "people"}
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {likers?.map((liker) => (
                    <div 
                      key={liker.id} 
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary/50"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={liker.profile_photo || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {liker.name?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{liker.name || "User"}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}