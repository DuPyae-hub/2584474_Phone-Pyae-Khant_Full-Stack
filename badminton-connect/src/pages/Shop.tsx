import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Star,
  Filter,
  Loader2
} from "lucide-react";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price) + " MMK";
};

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, shop_categories:category_id (name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user favorites
  const { data: favorites } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((f) => f.product_id);
    },
    enabled: !!user?.id,
  });

  // Fetch cart count
  const { data: cartItems } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) throw new Error("Not logged in");
      
      const isFavorite = favorites?.includes(productId);
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) throw new Error("Not logged in");
      
      // Check if already in cart
      const existingItem = cartItems?.find((item) => item.product_id === productId);
      
      if (existingItem) {
        const { error } = await supabase
          .from("cart")
          .update({ quantity: (existingItem.quantity || 1) + 1 })
          .eq("id", existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart")
          .insert({ user_id: user.id, product_id: productId, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart!");
    },
    onError: (error) => {
      if (error.message === "Not logged in") {
        toast.error("Please login to add items to cart");
      } else {
        toast.error("Failed to add to cart");
      }
    },
  });

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || product.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "beginner": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate": return "bg-primary/20 text-primary border-primary/30";
      case "advanced": return "bg-accent/20 text-accent border-accent/30";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getProductEmoji = (categoryName: string | undefined) => {
    switch (categoryName?.toLowerCase()) {
      case "rackets": return "🏸";
      case "shoes": return "👟";
      case "bags": return "🎒";
      case "shuttlecocks": return "🏸";
      default: return "📦";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="level" className="mb-4">Official Store</Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Badminton <span className="text-gradient-primary">Shop</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Premium equipment for every skill level. Get gear recommendations based on your playing style.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="glass">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            <Button
              variant={activeCategory === "all" ? "hero" : "glass"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className="whitespace-nowrap"
            >
              All Products
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "hero" : "glass"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts?.map((product) => (
                <Card key={product.id} variant="interactive" className="overflow-hidden group">
                  {/* Image */}
                  <div className="relative h-48 gradient-card flex items-center justify-center overflow-hidden">
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                        {getProductEmoji(product.shop_categories?.name)}
                      </span>
                    )}
                    
                    {/* Favorite */}
                    <button
                      onClick={() => {
                        if (!user) {
                          toast.error("Please login to add favorites");
                          return;
                        }
                        toggleFavoriteMutation.mutate(product.id);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <Heart 
                        className={`w-5 h-5 ${favorites?.includes(product.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
                      />
                    </button>

                    {/* Out of Stock */}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Badge variant="secondary">Out of Stock</Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.level_recommendation && (
                        <Badge className={`text-xs ${getLevelColor(product.level_recommendation)}`}>
                          {product.level_recommendation}
                        </Badge>
                      )}
                    </div>

                    {product.shop_categories?.name && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-sm text-muted-foreground">{product.shop_categories.name}</span>
                      </div>
                    )}

                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-bold text-lg text-primary">
                        {formatPrice(Number(product.price))}
                      </span>
                    </div>

                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="w-full"
                      disabled={product.stock === 0 || addToCartMutation.isPending}
                      onClick={() => addToCartMutation.mutate(product.id)}
                    >
                      {addToCartMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredProducts?.length === 0 && !productsLoading && (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🛒</span>
              <h3 className="font-display text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
