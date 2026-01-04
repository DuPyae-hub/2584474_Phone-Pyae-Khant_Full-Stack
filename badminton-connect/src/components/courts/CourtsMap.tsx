import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

interface Court {
  id: string;
  court_name: string;
  address: string;
  opening_hours: string | null;
  contact: string | null;
  google_map_url: string | null;
  images: string[] | null;
  rating: number | null;
  coords: [number, number] | null;
}

interface CourtsMapProps {
  courts: Court[];
  center: [number, number];
  onMarkerClick: (courtId: string) => void;
  onGetDirections: (court: Court) => void;
}

// Custom court marker icon
const createCourtIcon = (rating?: number | null) => {
  return L.divIcon({
    className: 'custom-court-marker',
    html: `
      <div class="court-marker-container">
        <div class="court-marker">
          <span class="court-icon">🏸</span>
          ${rating ? `<span class="court-rating">${rating}</span>` : ''}
        </div>
        <div class="court-marker-pulse"></div>
      </div>
    `,
    iconSize: [50, 60],
    iconAnchor: [25, 60],
    popupAnchor: [0, -60],
  });
};

export function CourtsMap({ courts, center, onMarkerClick, onGetDirections }: CourtsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    setIsReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center]);

  // Add markers when map is ready and courts change
  useEffect(() => {
    if (!mapInstanceRef.current || !isReady) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    courts.forEach((court) => {
      if (!court.coords) return;

      const marker = L.marker(court.coords, {
        icon: createCourtIcon(court.rating),
      }).addTo(map);

      marker.on('click', () => {
        onMarkerClick(court.id);
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';
      popupContent.innerHTML = `
        <h3 class="font-semibold text-sm">${court.court_name}</h3>
        <p class="text-xs text-muted-foreground mt-1">${court.address}</p>
      `;
      
      const button = document.createElement('button');
      button.className = 'mt-2 w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3';
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg> Get Directions';
      button.onclick = () => onGetDirections(court);
      popupContent.appendChild(button);

      marker.bindPopup(popupContent);
    });
  }, [courts, isReady, onMarkerClick, onGetDirections]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: "350px", width: "100%" }}
      className="z-0"
    />
  );
}
