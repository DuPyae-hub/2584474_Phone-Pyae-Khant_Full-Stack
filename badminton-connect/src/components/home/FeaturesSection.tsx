import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, Trophy, Store, MessageSquare, Shield } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  {
    icon: Users,
    title: "Smart Partner Matching",
    description: "Find players at your exact skill level. Our algorithm matches you based on experience, playing style, and availability.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: MapPin,
    title: "Court Directory",
    description: "Discover all badminton courts in Mandalay with real-time availability and user reviews.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Trophy,
    title: "Rankings & Tournaments",
    description: "Compete in friendly matches or tournaments. Earn experience points and climb the leaderboard.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Store,
    title: "Equipment Shop",
    description: "Shop for quality rackets, shuttlecocks, and accessories with gear recommendations based on your level.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: MessageSquare,
    title: "Community Chat",
    description: "Join discussions, share experiences, get tips from advanced players, and stay connected.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Fair Play System",
    description: "Our penalty system ensures reliable partners. No-shows get penalized, keeping the community trustworthy.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export function FeaturesSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();

  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="text-primary font-semibold text-sm tracking-wider uppercase mb-2 block">
            Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to <span className="text-gradient-primary">Play Better</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From finding partners to tracking your progress, we've built the ultimate platform for badminton enthusiasts.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                variant="interactive"
                className={`group transition-all duration-500 ${
                  gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
