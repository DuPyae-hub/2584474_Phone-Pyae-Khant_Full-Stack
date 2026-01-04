import confetti from "canvas-confetti";

export function useConfetti() {
  const fireConfetti = (type: "celebration" | "win" | "subtle" = "celebration") => {
    switch (type) {
      case "win":
        // Epic confetti for winning matches
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = window.setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"],
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"],
          });
        }, 250);
        break;

      case "celebration":
        // Standard celebration for registration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"],
          zIndex: 9999,
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#10B981", "#3B82F6", "#8B5CF6"],
            zIndex: 9999,
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#F59E0B", "#EF4444", "#EC4899"],
            zIndex: 9999,
          });
        }, 200);
        break;

      case "subtle":
        // Subtle confetti for small achievements
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#10B981", "#3B82F6"],
          zIndex: 9999,
        });
        break;
    }
  };

  const fireEmoji = (emoji: string = "🏸") => {
    const scalar = 2;
    const emojiShape = confetti.shapeFromText({ text: emoji, scalar });

    confetti({
      shapes: [emojiShape],
      scalar,
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
      zIndex: 9999,
    });
  };

  return { fireConfetti, fireEmoji };
}