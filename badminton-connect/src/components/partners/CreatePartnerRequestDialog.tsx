import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type MatchMode = Database["public"]["Enums"]["match_mode"];
type UserLevel = Database["public"]["Enums"]["user_level"];

interface CreatePartnerRequestDialogProps {
  onSuccess: () => void;
}

export function CreatePartnerRequestDialog({ onSuccess }: CreatePartnerRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    court_id: "",
    date: "",
    time: "",
    mode: "friendly" as MatchMode,
    wanted_level: "" as UserLevel | "",
    phone: "",
    players_needed: 1,
  });

  const { data: courts } = useQuery({
    queryKey: ["courts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("id, court_name")
        .order("court_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("partner_requests").insert({
        created_by_user: user.id,
        court_id: formData.court_id || null,
        date: formData.date,
        time: formData.time,
        mode: formData.mode,
        wanted_level: formData.wanted_level || null,
        phone: formData.phone || profile?.phone || null,
        players_needed: formData.players_needed,
      });

      if (error) throw error;

      toast({
        title: "Request Created",
        description: "Your partner request has been posted successfully.",
      });
      setOpen(false);
      setFormData({
        court_id: "",
        date: "",
        time: "",
        mode: "friendly",
        wanted_level: "",
        phone: "",
        players_needed: 1,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Button variant="hero" size="lg" asChild>
        <a href="/login">
          <Plus className="w-5 h-5 mr-2" />
          Login to Create Request
        </a>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Partner Request</DialogTitle>
          <DialogDescription>
            Post a request to find badminton partners for your session.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="players_needed" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players Needed
            </Label>
            <Select
              value={String(formData.players_needed)}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, players_needed: parseInt(v) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Player</SelectItem>
                <SelectItem value="2">2 Players</SelectItem>
                <SelectItem value="3">3 Players</SelectItem>
                <SelectItem value="4">4 Players</SelectItem>
                <SelectItem value="5">5 Players</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="court">Court (Optional)</Label>
            <Select
              value={formData.court_id}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, court_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent>
                {courts?.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.court_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Match Type</Label>
            <Select
              value={formData.mode}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, mode: v as MatchMode }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wanted_level">Preferred Partner Level</Label>
            <Select
              value={formData.wanted_level}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, wanted_level: v as UserLevel }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={profile?.phone || "+95 9 xxx xxx xxx"}
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Post Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
