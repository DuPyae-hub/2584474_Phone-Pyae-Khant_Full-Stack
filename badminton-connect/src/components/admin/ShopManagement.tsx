import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type UserLevel = Database["public"]["Enums"]["user_level"];

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  level_recommendation: UserLevel | "";
}

const defaultForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  level_recommendation: "",
};

export function ShopManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, shop_categories:category_id (name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const { error } = await supabase.from("products").insert({
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        stock: parseInt(data.stock) || 0,
        category_id: data.category_id || null,
        level_recommendation: (data.level_recommendation as UserLevel) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product created successfully");
      setIsDialogOpen(false);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast.error("Failed to create product: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductForm }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          description: data.description || null,
          price: parseFloat(data.price),
          stock: parseInt(data.stock) || 0,
          category_id: data.category_id || null,
          level_recommendation: (data.level_recommendation as UserLevel) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated successfully");
      setIsDialogOpen(false);
      setEditingProduct(null);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast.error("Failed to update product: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete product: " + error.message);
    },
  });

  const handleEdit = (product: any) => {
    setEditingProduct(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price?.toString() || "",
      stock: product.stock?.toString() || "",
      category_id: product.category_id || "",
      level_recommendation: product.level_recommendation || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setForm(defaultForm);
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case "beginner":
        return "bg-accent/20 text-accent";
      case "intermediate":
        return "bg-primary/20 text-primary";
      case "advanced":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (productsLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading products...</div>;
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Shop Management ({products?.length || 0})</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (MMK) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Recommended Level</Label>
                  <Select
                    value={form.level_recommendation}
                    onValueChange={(value) => setForm({ ...form, level_recommendation: value as UserLevel | "" })}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingProduct ? "Update" : "Create"}
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
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.shop_categories?.name || "-"}</TableCell>
                  <TableCell className="font-semibold">{Number(product.price).toLocaleString()} MMK</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={product.stock && product.stock > 0 ? "text-accent" : "text-destructive"}
                    >
                      {product.stock || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.level_recommendation ? (
                      <Badge variant="outline" className={getLevelColor(product.level_recommendation)}>
                        {product.level_recommendation}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
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
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(product.id)}
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
