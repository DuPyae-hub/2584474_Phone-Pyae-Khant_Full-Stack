import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Grid, List, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function UserManagement() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch roles for all users
      const { data: roles } = await supabase.from("user_roles").select("*");

      return profiles.map((profile) => ({
        ...profile,
        roles: roles?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [],
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: AppRole; action: "add" | "remove" }) => {
      if (action === "add") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete profile (user will be cascade deleted from auth if configured)
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete user: " + error.message);
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "workshop":
        return "bg-accent/20 text-accent border-accent/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <CardTitle>User Management ({filteredUsers?.length || 0})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/50"
              />
            </div>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profile_photo || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.membership_status === "active"
                            ? "bg-accent/20 text-accent"
                            : user.membership_status === "trial"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {user.membership_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="outline" className={getRoleBadgeColor(role)}>
                            {role}
                          </Badge>
                        ))}
                        <Select
                          onValueChange={(value) => {
                            const hasRole = user.roles.includes(value as AppRole);
                            updateRoleMutation.mutate({
                              userId: user.id,
                              role: value as AppRole,
                              action: hasRole ? "remove" : "add",
                            });
                          }}
                        >
                          <SelectTrigger className="w-8 h-8 p-0">
                            <Shield className="w-4 h-4" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              {user.roles.includes("admin") ? "Remove Admin" : "Make Admin"}
                            </SelectItem>
                            <SelectItem value="workshop">
                              {user.roles.includes("workshop") ? "Remove Workshop" : "Make Workshop"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers?.map((user) => (
              <Card key={user.id} className="bg-secondary/30 border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile_photo || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {user.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <h3 className="font-semibold mb-1">{user.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="capitalize text-xs">
                      {user.level}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        user.membership_status === "active"
                          ? "bg-accent/20 text-accent"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {user.membership_status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="outline" className={`text-xs ${getRoleBadgeColor(role)}`}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
