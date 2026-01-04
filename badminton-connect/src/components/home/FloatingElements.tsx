import { useEffect, useState } from "react";

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  type: "shuttlecock" | "particle" | "ring";
}

function generateElements(count: number): FloatingElement[] {
  const elements: FloatingElement[] = [];
  
  for (let i = 0; i < count; i++) {
    const types: ("shuttlecock" | "particle" | "ring")[] = ["shuttlecock", "particle", "particle", "ring"];
    elements.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 15,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.15 + 0.05,
      type: types[Math.floor(Math.random() * types.length)],
    });
  }
  
  return elements;
}

export function FloatingElements() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    setElements(generateElements(15));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute animate-float-random"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            animationDuration: `${element.duration}s`,
            animationDelay: `${element.delay}s`,
            opacity: element.opacity,
          }}
        >
          {element.type === "shuttlecock" && (
            <span 
              className="block transform rotate-45"
              style={{ fontSize: `${element.size}px` }}
            >
              🏸
            </span>
          )}
          
          {element.type === "particle" && (
            <div
              className="rounded-full bg-gradient-to-br from-primary to-accent"
              style={{
                width: `${element.size / 3}px`,
                height: `${element.size / 3}px`,
              }}
            />
          )}
          
          {element.type === "ring" && (
            <div
              className="rounded-full border-2 border-primary/30"
              style={{
                width: `${element.size}px`,
                height: `${element.size}px`,
              }}
            />
          )}
        </div>
      ))}
      
      {/* Animated lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Animated diagonal lines */}
        <line
          x1="0%"
          y1="30%"
          x2="100%"
          y2="70%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          className="animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <line
          x1="20%"
          y1="0%"
          x2="80%"
          y2="100%"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          className="animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
      </svg>
    </div>
  );
}