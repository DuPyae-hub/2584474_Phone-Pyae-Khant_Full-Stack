import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, X, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function PaymentApprovals() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price,
            products:product_id (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles separately
      const userIds = [...new Set(ordersData?.map((o) => o.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return ordersData?.map((order) => ({
        ...order,
        profile: profileMap.get(order.user_id),
      }));
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`Payment ${status === "approved" ? "approved" : "rejected"} successfully`);
    },
    onError: (error) => {
      toast.error("Failed to update payment: " + error.message);
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-accent/20 text-accent border-accent/30";
      case "pending":
        return "bg-primary/20 text-primary border-primary/30";
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading orders...</div>;
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle>Payment Approvals ({orders?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.profile?.name}</p>
                      <p className="text-xs text-muted-foreground">{order.profile?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="w-3 h-3" />
                          {order.order_items?.length || 0} items
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Order Items</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          {order.order_items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between p-2 bg-secondary/30 rounded">
                              <span>{item.products?.name}</span>
                              <span className="text-muted-foreground">
                                {item.quantity} × {Number(item.price).toLocaleString()} MMK
                              </span>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {Number(order.total_amount).toLocaleString()} MMK
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {order.transaction_id || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadgeColor(order.payment_status || "pending")}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(order.created_at || ""), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {order.uploaded_screenshot && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={order.uploaded_screenshot} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {order.payment_status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-accent hover:text-accent"
                            onClick={() => updatePaymentMutation.mutate({ orderId: order.id, status: "approved" })}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => updatePaymentMutation.mutate({ orderId: order.id, status: "rejected" })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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
