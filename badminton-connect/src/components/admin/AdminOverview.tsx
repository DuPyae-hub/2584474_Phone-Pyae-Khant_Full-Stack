import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, MapPin, Store, TrendingUp } from "lucide-react";

export function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, ordersRes, courtsRes, productsRes, pendingPaymentsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount").eq("payment_status", "approved"),
        supabase.from("courts").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalRevenue,
        totalCourts: courtsRes.count || 0,
        totalProducts: productsRes.count || 0,
        pendingPayments: pendingPaymentsRes.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Total Revenue",
      value: `${(stats?.totalRevenue || 0).toLocaleString()} MMK`,
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Pending Payments",
      value: stats?.pendingPayments || 0,
      icon: CreditCard,
      color: "text-destructive",
    },
    {
      title: "Total Courts",
      value: stats?.totalCourts || 0,
      icon: MapPin,
      color: "text-primary",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Store,
      color: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
