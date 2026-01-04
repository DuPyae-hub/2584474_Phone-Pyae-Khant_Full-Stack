import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  X, 
  User, 
  ShoppingCart, 
  MapPin, 
  Users, 
  Trophy,
  MessageSquare,
  Store,
  LogOut,
  Settings,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { NotificationBell } from "@/components/partners/NotificationBell";
import { DirectMessages } from "@/components/messages/DirectMessages";

const navItems = [
  { label: "Find Partners", href: "/partners", icon: Users },
  { label: "Courts", href: "/courts", icon: MapPin },
  { label: "Rankings", href: "/rankings", icon: Trophy },
  { label: "Shop", href: "/shop", icon: Store },
  { label: "Community", href: "/community", icon: MessageSquare },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  // Fetch cart count
  const { data: cartCount } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from("cart")
        .select("quantity")
        .eq("user_id", user.id);
      if (error) return 0;
      return data.reduce((sum, item) => sum + (item.quantity || 1), 0);
    },
    enabled: !!user?.id,
  });

  const userInitials = user?.user_metadata?.name 
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <span className="text-xl">🏸</span>
            </div>
            <span className="font-display font-bold text-xl hidden sm:block">
              Shuttle<span className="text-primary">Match</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                <DirectMessages />
                <NotificationBell />
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {(cartCount || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-accent text-xs flex items-center justify-center text-accent-foreground font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={user.user_metadata?.profile_photo} alt="Profile" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Shield className="w-3 h-3 text-primary-foreground" />
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user.id}`} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-matches" className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      My Matches
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="glass" size="sm">
                    <User className="w-4 h-4" />
                    Login
                  </Button>
                </Link>
                
                <Link to="/register" className="hidden sm:block">
                  <Button variant="hero" size="sm">
                    Join Free
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              {user ? (
                <div className="flex flex-col gap-2 mt-4 px-4">
                  <Link to={`/profile/${user.id}`} onClick={() => setIsOpen(false)}>
                    <Button variant="glass" className="w-full justify-start gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="glass" className="w-full justify-start gap-2">
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2"
                    onClick={() => { signOut(); setIsOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-4 px-4">
                  <Link to="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button variant="glass" className="w-full">Login</Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button variant="hero" className="w-full">Join Free</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
