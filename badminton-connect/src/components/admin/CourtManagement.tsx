import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CourtForm {
  court_name: string;
  address: string;
  contact: string;
  opening_hours: string;
  google_map_url: string;
  rating: string;
}

const defaultForm: CourtForm = {
  court_name: "",
  address: "",
  contact: "",
  opening_hours: "",
  google_map_url: "",
  rating: "",
};

export function CourtManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<string | null>(null);
  const [form, setForm] = useState<CourtForm>(defaultForm);
  const queryClient = useQueryClient();

  const { data: courts, isLoading } = useQuery({
    queryKey: ["admin-courts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CourtForm) => {
      const { error } = await supabase.from("courts").insert({
        court_name: data.court_name,
        address: data.address,
        contact: data.contact || null,
        opening_hours: data.opening_hours || null,
        google_map_url: data.google_map_url || null,
        rating: data.rating ? parseFloat(data.rating) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courts"] });
      toast.success("Court created successfully");
      setIsDialogOpen(false);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast.error("Failed to create court: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CourtForm }) => {
      const { error } = await supabase
        .from("courts")
        .update({
          court_name: data.court_name,
          address: data.address,
          contact: data.contact || null,
          opening_hours: data.opening_hours || null,
          google_map_url: data.google_map_url || null,
          rating: data.rating ? parseFloat(data.rating) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courts"] });
      toast.success("Court updated successfully");
      setIsDialogOpen(false);
      setEditingCourt(null);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast.error("Failed to update court: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courts"] });
      toast.success("Court deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete court: " + error.message);
    },
  });

  const handleEdit = (court: any) => {
    setEditingCourt(court.id);
    setForm({
      court_name: court.court_name,
      address: court.address,
      contact: court.contact || "",
      opening_hours: court.opening_hours || "",
      google_map_url: court.google_map_url || "",
      rating: court.rating?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourt) {
      updateMutation.mutate({ id: editingCourt, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCourt(null);
    setForm(defaultForm);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading courts...</div>;
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Court Management ({courts?.length || 0})</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Court
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCourt ? "Edit Court" : "Add New Court"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="court_name">Court Name *</Label>
                  <Input
                    id="court_name"
                    value={form.court_name}
                    onChange={(e) => setForm({ ...form, court_name: e.target.value })}
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opening_hours">Opening Hours</Label>
                  <Input
                    id="opening_hours"
                    value={form.opening_hours}
                    onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                    placeholder="e.g., 6:00 AM - 10:00 PM"
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_map_url">Google Maps URL</Label>
                  <Input
                    id="google_map_url"
                    value={form.google_map_url}
                    onChange={(e) => setForm({ ...form, google_map_url: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingCourt ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts?.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.court_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{court.address}</TableCell>
                  <TableCell>{court.contact || "-"}</TableCell>
                  <TableCell>{court.opening_hours || "-"}</TableCell>
                  <TableCell>{court.rating ? `${court.rating}/5` : "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {court.google_map_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={court.google_map_url} target="_blank" rel="noopener noreferrer">
                            <MapPin className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(court)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Court</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{court.court_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(court.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
