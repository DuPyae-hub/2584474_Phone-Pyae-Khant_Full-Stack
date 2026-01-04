import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Users, CreditCard, MapPin, Store, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { UserManagement } from "@/components/admin/UserManagement";
import { PaymentApprovals } from "@/components/admin/PaymentApprovals";
import { CourtManagement } from "@/components/admin/CourtManagement";
import { ShopManagement } from "@/components/admin/ShopManagement";

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (!authLoading && !adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [user, authLoading, isAdmin, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
              <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">Manage users, payments, courts, and shop</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="glass p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CreditCard className="w-4 h-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="courts" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapPin className="w-4 h-4" />
                Courts
              </TabsTrigger>
              <TabsTrigger value="shop" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Store className="w-4 h-4" />
                Shop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminOverview />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentApprovals />
            </TabsContent>

            <TabsContent value="courts">
              <CourtManagement />
            </TabsContent>

            <TabsContent value="shop">
              <ShopManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
