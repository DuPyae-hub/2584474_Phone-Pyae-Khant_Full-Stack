import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-center px-4">
          <div className="text-8xl mb-6 animate-float">🏸</div>
          <h1 className="font-display text-6xl font-bold mb-4 text-gradient-primary">404</h1>
          <p className="text-xl text-muted-foreground mb-2">Shuttlecock out of bounds!</p>
          <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button variant="hero" size="lg">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
            <Button variant="glass" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
