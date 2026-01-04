import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Star, Zap } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const levels = [
  {
    name: "Beginner",
    range: "0 - 500 XP",
    color: "bg-green-500",
    description: "Just starting out. Learning fundamentals and basic techniques.",
  },
  {
    name: "Intermediate",
    range: "501 - 1500 XP",
    color: "bg-primary",
    description: "Solid fundamentals. Developing advanced shots and game strategy.",
  },
  {
    name: "Advanced",
    range: "1501+ XP",
    color: "bg-accent",
    description: "Expert level. Competitive play with refined skills and tactics.",
  },
];

export function LevelSystemSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="text-primary font-semibold text-sm tracking-wider uppercase mb-2 block">
            Level System
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Grow Your <span className="text-gradient-primary">Skills</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Earn experience from every match. Level up by defeating higher-ranked opponents, or risk dropping if you can't maintain your performance.
          </p>
        </div>

        <div 
          ref={contentRef}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Level Cards */}
          <div className="space-y-4">
            {levels.map((level, index) => (
              <Card 
                key={index} 
                variant="glass" 
                className={`overflow-hidden transition-all duration-500 ${
                  contentVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-3 h-16 rounded-full ${level.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display font-semibold text-lg">{level.name}</h4>
                      <Badge variant="level" className="text-xs">{level.range}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{level.description}</p>
                  </div>
                  <Star className={`w-6 h-6 ${index === 2 ? 'text-accent' : index === 1 ? 'text-primary' : 'text-green-500'}`} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* XP Rules */}
          <div className="space-y-6">
            <Card 
              variant="gradient"
              className={`transition-all duration-500 ${
                contentVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
              style={{ transitionDelay: "100ms" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold">Tournament Match</h4>
                    <p className="text-muted-foreground text-sm">Competitive play with ranking impact</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-lg p-4 text-center">
                    <ArrowUp className="w-5 h-5 text-accent mx-auto mb-1" />
                    <span className="block font-display font-bold text-xl text-accent">+15 XP</span>
                    <span className="text-xs text-muted-foreground">Win</span>
                  </div>
                  <div className="glass rounded-lg p-4 text-center">
                    <ArrowUp className="w-5 h-5 text-primary mx-auto mb-1" />
                    <span className="block font-display font-bold text-xl text-primary">+10 XP</span>
                    <span className="text-xs text-muted-foreground">Lose</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              variant="gradient"
              className={`transition-all duration-500 ${
                contentVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <span className="text-2xl">🎮</span>
                  </div>
                  <div>
                    <h4 className="font-display font-semibold">Friendly Match</h4>
                    <p className="text-muted-foreground text-sm">Casual play for fun and practice</p>
                  </div>
                </div>
                <div className="glass rounded-lg p-4 text-center">
                  <span className="block font-display font-bold text-xl text-primary">+5 XP</span>
                  <span className="text-xs text-muted-foreground">Per Match (No ranking impact)</span>
                </div>
              </CardContent>
            </Card>

            <div 
              className={`glass rounded-xl p-4 transition-all duration-500 ${
                contentVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
              style={{ transitionDelay: "300ms" }}
            >
              <div className="flex items-start gap-3">
                <ArrowDown className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm">Level Down Warning</h5>
                  <p className="text-muted-foreground text-xs">
                    Lose 15+ tournament matches to drop a level. Your XP will be cut to 50% of the lower bracket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
