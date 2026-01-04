import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, MapPin, Trophy, Zap, TrendingUp } from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { useCountAnimation } from "@/hooks/useCountAnimation";
import { FloatingElements } from "./FloatingElements";

function AnimatedStatCard({ 
  value, 
  label, 
  icon: Icon, 
  suffix = "",
  decimals = 0,
  color = "primary"
}: { 
  value: number; 
  label: string; 
  icon: React.ElementType; 
  suffix?: string;
  decimals?: number;
  color?: "primary" | "accent";
}) {
  const { count, elementRef, hasStarted } = useCountAnimation({
    end: value,
    duration: 2500,
    decimals,
  });

  return (
    <div 
      ref={elementRef}
      className="group glass rounded-2xl p-6 text-center hover:scale-105 transition-all duration-500 cursor-default relative overflow-hidden"
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        color === "primary" ? "bg-primary/5" : "bg-accent/5"
      }`} />
      
      {/* Animated background ring */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl transition-all duration-700 ${
        hasStarted ? "opacity-30 scale-100" : "opacity-0 scale-50"
      } ${color === "primary" ? "bg-primary" : "bg-accent"}`} />
      
      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-all duration-500 ${
          hasStarted ? "scale-100" : "scale-75"
        } ${color === "primary" ? "bg-primary/10" : "bg-accent/10"}`}>
          <Icon className={`w-6 h-6 ${color === "primary" ? "text-primary" : "text-accent"}`} />
        </div>
        
        <div className={`font-display font-bold text-4xl mb-2 transition-all duration-300 ${
          color === "primary" ? "text-primary" : "text-accent"
        }`}>
          <span className={`inline-block transition-transform duration-300 ${
            hasStarted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}
          </span>
          <span className="text-2xl ml-1">{suffix}</span>
        </div>
        
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        
        {/* Trending indicator */}
        <div className={`flex items-center justify-center gap-1 mt-2 text-xs transition-all duration-500 ${
          hasStarted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        } text-green-400`}>
          <TrendingUp className="w-3 h-3" />
          <span>Growing</span>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { stats, isLoading } = useStats();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
      
      {/* Floating Elements */}
      <FloatingElements />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Mandalay's #1 Badminton Community</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-up">
            Find Your Perfect
            <span className="block text-gradient-primary">Badminton Partner</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Connect with players at your skill level, discover courts in Mandalay, 
            compete in tournaments, and shop premium equipment — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/register">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/partners">
              <Button variant="glass" size="xl" className="w-full sm:w-auto">
                Browse Partners
              </Button>
            </Link>
          </div>

          {/* Animated Stats */}
          {!isLoading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <AnimatedStatCard
                value={stats.activePlayers}
                label="Active Players"
                icon={Users}
                suffix="+"
                color="primary"
              />
              <AnimatedStatCard
                value={stats.courtsListed}
                label="Courts Listed"
                icon={MapPin}
                color="primary"
              />
              <AnimatedStatCard
                value={stats.matchesPerMonth}
                label="Matches/Month"
                icon={Trophy}
                color="primary"
              />
              <AnimatedStatCard
                value={stats.avgRating}
                label="Avg Rating"
                icon={() => <span className="text-2xl">⭐</span>}
                decimals={1}
                color="accent"
              />
            </div>
          )}
          
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-secondary mx-auto mb-3" />
                  <div className="h-10 w-20 bg-secondary rounded mx-auto mb-2" />
                  <div className="h-4 w-24 bg-secondary/50 rounded mx-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decorative Shuttlecock */}
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-float hidden lg:block">
        🏸
      </div>
    </section>
  );
}