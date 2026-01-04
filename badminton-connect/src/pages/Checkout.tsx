import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, CreditCard, CheckCircle, MapPin } from "lucide-react";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price) + " MMK";
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

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

  const totalAmount = cartItems?.reduce(
    (sum, item) => sum + Number(item.products?.price || 0) * (item.quantity || 1),
    0
  ) || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !screenshot || !transactionId.trim() || !deliveryName.trim() || !deliveryPhone.trim() || !deliveryAddress.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload screenshot
      const fileExt = screenshot.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          transaction_id: transactionId.trim(),
          uploaded_screenshot: urlData.publicUrl,
          payment_status: "pending",
          delivery_name: deliveryName.trim(),
          delivery_phone: deliveryPhone.trim(),
          delivery_address: deliveryAddress.trim(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems?.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        price: Number(item.products?.price || 0),
      }));

      if (orderItems && orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Clear cart
      await supabase.from("cart").delete().eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      
      toast.success("Order placed successfully! Waiting for admin approval.");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to place order: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-3xl font-bold">Checkout</h1>
              <p className="text-muted-foreground">Complete your payment</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Order Summary */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.products?.name} × {item.quantity || 1}
                    </span>
                    <span>{formatPrice(Number(item.products?.price || 0) * (item.quantity || 1))}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="glass rounded-lg p-4 mb-4 space-y-2">
                  <p className="font-semibold">KBZ Pay / Wave Pay</p>
                  <p className="text-muted-foreground">Phone: 09-123-456-789</p>
                  <p className="text-muted-foreground">Name: ShuttleMatch</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please transfer the exact amount and upload your payment screenshot below.
                </p>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryName">Recipient Name *</Label>
                  <Input
                    id="deliveryName"
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    placeholder="Enter recipient name"
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryPhone">Phone Number *</Label>
                  <Input
                    id="deliveryPhone"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                  <Input
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address"
                    required
                    className="bg-secondary/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Upload Payment Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID *</Label>
                    <Input
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter your transaction ID"
                      required
                      className="bg-secondary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Screenshot *</Label>
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => document.getElementById("screenshot")?.click()}
                    >
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">Click to upload screenshot</p>
                          <p className="text-xs text-muted-foreground mt-1">Max 5MB (JPG, PNG)</p>
                        </>
                      )}
                    </div>
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting || !screenshot || !transactionId.trim() || !deliveryName.trim() || !deliveryPhone.trim() || !deliveryAddress.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Place Order
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
