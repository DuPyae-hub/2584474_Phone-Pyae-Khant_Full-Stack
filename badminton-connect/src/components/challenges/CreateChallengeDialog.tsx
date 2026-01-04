import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Swords, Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CreateChallengeDialogProps {
  playerId: string;
  playerName: string;
  trigger?: React.ReactNode;
}

export function CreateChallengeDialog({ playerId, playerName, trigger }: CreateChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [courtId, setCourtId] = useState<string>("");
  const [message, setMessage] = useState("");

  // Handle dialog open - check auth
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      toast.error("Please sign in to challenge players");
      navigate("/login");
      return;
    }
    if (newOpen && user?.id === playerId) {
      toast.error("You cannot challenge yourself");
      return;
    }
    setOpen(newOpen);
  };

  // Fetch courts
  const { data: courts } = useQuery({
    queryKey: ["courts-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("id, court_name")
        .order("court_name");
      if (error) throw error;
      return data;
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not logged in");
      if (!date || !time) throw new Error("Please select date and time");

      const { error } = await supabase.from("challenges").insert({
        challenger_id: user.id,
        challenged_id: playerId,
        proposed_date: date,
        proposed_time: time,
        court_id: courtId || null,
        message: message || null,
      });

      if (error) throw error;

      // Send notification to challenged player
      const { data: challengerProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      await supabase.from("notifications").insert({
        user_id: playerId,
        type: "challenge_received",
        title: "⚔️ New Challenge!",
        message: `${challengerProfile?.name || "A player"} has challenged you to a tournament match!`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-challenges"] });
      toast.success(`Challenge sent to ${playerName}!`);
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send challenge");
    },
  });

  const resetForm = () => {
    setDate("");
    setTime("");
    setCourtId("");
    setMessage("");
  };

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm">
            <Swords className="w-4 h-4 mr-1" />
            Challenge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Challenge {playerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Send a tournament match challenge. If accepted, it will count towards rankings!
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Time
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Court (Optional)
            </Label>
            <Select value={courtId} onValueChange={(val) => setCourtId(val === "none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific court</SelectItem>
                {courts?.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.court_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Textarea
              placeholder="Add a message to your challenge..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => createChallengeMutation.mutate()}
            disabled={!date || !time || createChallengeMutation.isPending}
          >
            {createChallengeMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Swords className="w-4 h-4 mr-2" />
            )}
            Send Challenge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}