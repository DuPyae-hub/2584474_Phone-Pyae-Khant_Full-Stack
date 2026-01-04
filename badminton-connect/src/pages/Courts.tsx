import { useState, useRef, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Phone, Star, Search, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CourtsMap } from "@/components/courts/CourtsMap";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Court {
  id: string;
  court_name: string;
  address: string;
  opening_hours: string | null;
  contact: string | null;
  google_map_url: string | null;
  images: string[] | null;
  rating: number | null;
}

// Parse coordinates from google map URL
const parseCoordinates = (url: string | null): [number, number] | null => {
  if (!url) return null;
  const match = url.match(/q=([\d.-]+),([\d.-]+)/);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])];
  }
  return null;
};

// Mandalay center coordinates
const MANDALAY_CENTER: [number, number] = [21.9588, 96.0891];

export default function Courts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedCourtId, setHighlightedCourtId] = useState<string | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  const scrollToCard = useCallback((courtId: string) => {
    const cardElement = cardRefs.current[courtId];
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCourtId(courtId);
      setTimeout(() => setHighlightedCourtId(null), 2000);
    }
  }, []);

  const { data: courts = [], isLoading } = useQuery({
    queryKey: ["courts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .order("court_name");
      if (error) throw error;
      return data as Court[];
    },
  });

  const filteredCourts = courts.filter(
    (court) =>
      court.court_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      court.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const courtsWithCoords = filteredCourts
    .map((court) => ({
      ...court,
      coords: parseCoordinates(court.google_map_url),
    }))
    .filter((court) => court.coords !== null);

  const openDirections = (court: Court) => {
    const coords = parseCoordinates(court.google_map_url);
    if (coords) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`,
        "_blank"
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div 
            ref={headerRef}
            className={`text-center mb-12 transition-all duration-700 ${
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Badge variant="level" className="mb-4">
              Mandalay Directory
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Badminton <span className="text-gradient-primary">Courts</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover the best badminton courts in Mandalay. Check facilities and get directions.
            </p>
          </div>

          {/* Search */}
          <div className={`max-w-xl mx-auto mb-8 transition-all duration-700 delay-100 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Map View - Always Visible */}
          <div className="mb-8 rounded-xl overflow-hidden border border-border shadow-lg animate-fade-in">
            <CourtsMap
              courts={courtsWithCoords}
              center={MANDALAY_CENTER}
              onMarkerClick={scrollToCard}
              onGetDirections={openDirections}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading courts...</p>
            </div>
          )}

          {/* Courts Grid */}
          {!isLoading && (
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCourts.map((court, index) => (
                <Card
                  key={court.id}
                  ref={(el) => { cardRefs.current[court.id] = el; }}
                  variant="interactive"
                  className={`overflow-hidden group transition-all duration-500 opacity-100 translate-y-0 ${
                    highlightedCourtId === court.id 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' 
                      : ''
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Court Image */}
                  <div className="h-40 relative overflow-hidden">
                    {court.images && court.images[0] ? (
                      <img
                        src={court.images[0]}
                        alt={court.court_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full gradient-card flex items-center justify-center">
                        <span className="text-6xl opacity-30 group-hover:scale-110 transition-transform">
                          🏸
                        </span>
                      </div>
                    )}
                    {court.rating && (
                      <div className="absolute top-3 right-3 glass px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold">{court.rating}</span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{court.court_name}</CardTitle>
                    <div className="flex items-start gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{court.address}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      {court.opening_hours && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{court.opening_hours}</span>
                        </div>
                      )}
                      {court.contact && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>{court.contact}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="hero"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDirections(court)}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredCourts.length === 0 && (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="font-display text-xl font-semibold mb-2">
                No courts found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
