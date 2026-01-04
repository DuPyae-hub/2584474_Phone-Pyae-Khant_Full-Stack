import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useConfetti } from "@/hooks/useConfetti";

interface Participant {
  user_id: string;
  profile?: {
    name: string;
  } | null;
}

interface MatchResultDialogProps {
  requestId: string;
  creatorId: string;
  creatorName: string;
  participants: Participant[];
  mode: "friendly" | "tournament";
}

export function MatchResultDialog({ requestId, creatorId, creatorName, participants, mode }: MatchResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [winner, setWinner] = useState<string>("");
  const [scorePlayer1, setScorePlayer1] = useState("");
  const [scorePlayer2, setScorePlayer2] = useState("");

  // Auto-determine winner based on scores
  useEffect(() => {
    const score1 = parseInt(scorePlayer1);
    const score2 = parseInt(scorePlayer2);
    
    if (!isNaN(score1) && !isNaN(score2)) {
      const player2Id = participants[0]?.user_id;
      if (score1 > score2) {
        setWinner(creatorId);
      } else if (score2 > score1 && player2Id) {
        setWinner(player2Id);
      } else if (score1 === score2) {
        setWinner("none");
      }
    }
  }, [scorePlayer1, scorePlayer2, creatorId, participants]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { fireConfetti, fireEmoji } = useConfetti();
  const queryClient = useQueryClient();

  // All players including creator
  const allPlayers = [
    { user_id: creatorId, name: creatorName },
    ...participants.map(p => ({ user_id: p.user_id, name: p.profile?.name || "Unknown" }))
  ];

  const submitResultMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      
      // Get the first participant as player2 for now
      const player2Id = participants[0]?.user_id;
      if (!player2Id) throw new Error("No opponent found");

      // Create match record
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          request_id: requestId,
          player1: creatorId,
          player2: player2Id,
          mode: mode,
          score_player1: scorePlayer1 ? parseInt(scorePlayer1) : null,
          score_player2: scorePlayer2 ? parseInt(scorePlayer2) : null,
          winner: winner && winner !== "none" ? winner : null,
          player1_confirmed: user.id === creatorId,
          player2_confirmed: user.id === player2Id,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Update request status to completed
      const { error: requestError } = await supabase
        .from("partner_requests")
        .update({ status: "completed" })
        .eq("id", requestId);

      if (requestError) throw requestError;

      return match;
    },
    onSuccess: (match) => {
      // Fire confetti if user won!
      if (match.winner === user?.id) {
        fireConfetti("win");
        setTimeout(() => fireEmoji("🏆"), 500);
        toast({
          title: "🏆 Congratulations!",
          description: "You won the match! Experience points earned.",
        });
      } else if (match.winner && match.winner !== "none") {
        toast({
          title: "Match Result Submitted",
          description: "Better luck next time! Keep practicing.",
        });
      } else {
        toast({
          title: "Match Result Submitted",
          description: "The match result has been recorded.",
        });
      }
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["partner-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit match result",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="flex-1">
          <Trophy className="w-4 h-4 mr-2" />
          Report Result
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Match Result</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Winner (optional for friendly)</Label>
            <Select value={winner} onValueChange={setWinner}>
              <SelectTrigger>
                <SelectValue placeholder="Select winner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No winner / Draw</SelectItem>
                {allPlayers.map((player) => (
                  <SelectItem key={player.user_id} value={player.user_id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{creatorName}'s Score</Label>
              <Input
                type="number"
                min="0"
                value={scorePlayer1}
                onChange={(e) => setScorePlayer1(e.target.value)}
                placeholder="Score"
              />
            </div>
            <div>
              <Label>{participants[0]?.profile?.name || "Opponent"}'s Score</Label>
              <Input
                type="number"
                min="0"
                value={scorePlayer2}
                onChange={(e) => setScorePlayer2(e.target.value)}
                placeholder="Score"
              />
            </div>
          </div>

          <Button
            onClick={() => submitResultMutation.mutate()}
            disabled={submitResultMutation.isPending}
            className="w-full"
          >
            {submitResultMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Submit Result
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
