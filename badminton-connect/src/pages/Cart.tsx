import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus,
  ArrowLeft,
  Loader2
} from "lucide-react";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price) + " MMK";
};

export default function Cart() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch cart items with product details
  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("cart")
        .select("*, products (*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart").delete().eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart")
          .update({ quantity })
          .eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("cart").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed from cart");
    },
  });

  const totalAmount = cartItems?.reduce(
    (sum, item) => sum + Number(item.products?.price || 0) * (item.quantity || 1),
    0
  ) || 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
              <p className="text-muted-foreground">{cartItems?.length || 0} items</p>
            </div>
          </div>

          {cartItems?.length === 0 ? (
            <Card variant="glass">
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-display text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
                <Link to="/shop">
                  <Button variant="hero">Browse Shop</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems?.map((item) => (
                  <Card key={item.id} variant="glass">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg gradient-card flex items-center justify-center shrink-0">
                          {item.products?.images?.[0] ? (
                            <img 
                              src={item.products.images[0]} 
                              alt={item.products?.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-3xl">🏸</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{item.products?.name}</h3>
                          {item.products?.level_recommendation && (
                            <Badge variant="outline" className="text-xs mb-2">
                              {item.products.level_recommendation}
                            </Badge>
                          )}
                          <p className="text-primary font-bold">
                            {formatPrice(Number(item.products?.price || 0))}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItemMutation.mutate(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateQuantityMutation.mutate({ 
                                itemId: item.id, 
                                quantity: (item.quantity || 1) - 1 
                              })}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity || 1}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateQuantityMutation.mutate({ 
                                itemId: item.id, 
                                quantity: (item.quantity || 1) + 1 
                              })}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <Card variant="glass" className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {cartItems?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate max-w-[150px]">
                            {item.products?.name} × {item.quantity || 1}
                          </span>
                          <span>{formatPrice(Number(item.products?.price || 0) * (item.quantity || 1))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                    <Button variant="hero" className="w-full" size="lg" onClick={() => navigate("/checkout")}>
                      Proceed to Checkout
                    </Button>
                    <Link to="/shop" className="block">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
