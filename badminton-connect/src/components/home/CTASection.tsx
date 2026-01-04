import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function CTASection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary opacity-10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div 
        ref={ref}
        className={`container mx-auto px-4 relative z-10 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">3-Month Free Trial</span>
          </div>
          
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Find Your
            <span className="block text-gradient-primary">Perfect Match?</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join 500+ players in Mandalay. Start your free trial today — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/courts">
              <Button variant="glass" size="xl" className="w-full sm:w-auto">
                Explore Courts
              </Button>
            </Link>
          </div>

          <p className="text-muted-foreground text-sm mt-6">
            ✓ No credit card required &nbsp;·&nbsp; ✓ Full access for 3 months &nbsp;·&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
