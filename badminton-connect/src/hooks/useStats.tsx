import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      // Fetch active players count
      const { count: playersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch courts count
      const { count: courtsCount } = await supabase
        .from("courts")
        .select("*", { count: "exact", head: true });

      // Fetch matches this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: matchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      // Calculate average rating from courts
      const { data: courts } = await supabase
        .from("courts")
        .select("rating")
        .not("rating", "is", null);

      const avgRating = courts && courts.length > 0
        ? (courts.reduce((sum, c) => sum + (c.rating || 0), 0) / courts.length).toFixed(1)
        : "4.5";

      return {
        activePlayers: playersCount || 0,
        courtsListed: courtsCount || 0,
        matchesPerMonth: matchesCount || 0,
        avgRating: parseFloat(avgRating),
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });

  return { stats, isLoading };
}
