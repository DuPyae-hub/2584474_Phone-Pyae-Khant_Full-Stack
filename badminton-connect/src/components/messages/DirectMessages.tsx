import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ArrowLeft, Loader2, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Conversation {
  id: string;
  name: string;
  profile_photo: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function DirectMessages() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch unread count always (for badge)
  const { data: unreadCount } = useQuery({
    queryKey: ["dm-unread-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Fetch all users for conversations list
  const { data: users } = useQuery({
    queryKey: ["dm-users"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, profile_photo")
        .neq("id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Fetch conversations with unread counts
  const { data: conversations } = useQuery({
    queryKey: ["dm-conversations", user?.id],
    queryFn: async () => {
      if (!user?.id || !users) return [];

      // Get all messages involving current user
      const { data: messages } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      // Build conversation data for each user
      const convMap = new Map<string, Conversation>();
      
      users.forEach((u) => {
        const userMessages = messages?.filter(
          (m) => m.sender_id === u.id || m.receiver_id === u.id
        );
        const lastMsg = userMessages?.[0];
        const unreadCount = userMessages?.filter(
          (m) => m.sender_id === u.id && !m.is_read
        ).length || 0;

        convMap.set(u.id, {
          id: u.id,
          name: u.name,
          profile_photo: u.profile_photo,
          lastMessage: lastMsg?.message,
          lastMessageTime: lastMsg?.created_at,
          unreadCount,
        });
      });

      // Sort by last message time
      return Array.from(convMap.values()).sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    },
    enabled: !!user?.id && !!users && open,
  });

  // Total unread count
  const totalUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["dm-messages", selectedUser?.id],
    queryFn: async () => {
      if (!user?.id || !selectedUser?.id) return [];
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id && !!selectedUser?.id,
  });

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (!user?.id || !selectedUser?.id || !messages) return;
    
    const unreadIds = messages
      .filter((m) => m.sender_id === selectedUser.id && !m.is_read)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      supabase
        .from("direct_messages")
        .update({ is_read: true })
        .in("id", unreadIds)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
          queryClient.invalidateQueries({ queryKey: ["dm-unread-count"] });
        });
    }
  }, [messages, selectedUser?.id, user?.id, queryClient]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("dm-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dm-messages"] });
          queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
          queryClient.invalidateQueries({ queryKey: ["dm-unread-count"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dm-messages"] });
          queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, open, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id || !selectedUser?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["dm-messages"] });
      queryClient.invalidateQueries({ queryKey: ["dm-conversations"] });
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="w-5 h-5" />
          {(unreadCount || 0) > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary">
              {(unreadCount || 0) > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {selectedUser ? (
          // Chat View
          <>
            <SheetHeader className="p-4 border-b flex flex-row items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedUser(null)}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedUser.profile_photo || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedUser.name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <SheetTitle className="text-left">{selectedUser.name}</SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages?.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.message}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                            {isMine && (
                              msg.is_read 
                                ? <CheckCheck className="w-3 h-3 opacity-70" /> 
                                : <Check className="w-3 h-3 opacity-70" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          // Conversations List
          <>
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Messages</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1">
              {conversations?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 px-4">
                  No conversations yet. Start chatting with other players!
                </div>
              ) : (
                <div className="divide-y">
                  {conversations?.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedUser(conv)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.profile_photo || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.name?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate">{conv.name}</span>
                          {conv.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
