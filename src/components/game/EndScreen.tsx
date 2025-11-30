import { Button } from "@/components/ui/button";

interface EndScreenProps {
  message: string;
  onRestart: () => void;
}

export const EndScreen = ({ message, onRestart }: EndScreenProps) => {
  const isWin = message.includes("WIN") && !message.includes("AI");

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50 animate-fade-in">
      <div className="text-center space-y-8 px-4">
        <div className="animate-float">
          <h1
            className={`text-6xl md:text-8xl font-black text-transparent bg-clip-text ${
              isWin
                ? "bg-gradient-to-r from-primary to-secondary"
                : "bg-gradient-to-r from-destructive to-accent"
            } animate-pulse-glow`}
          >
            {message}
          </h1>
        </div>

        {isWin ? (
          <div className="text-primary text-8xl animate-float">🎉</div>
        ) : (
          <div className="text-destructive text-8xl animate-float">💀</div>
        )}

        <p className="text-muted-foreground text-xl">
          {isWin
            ? "Incredible reflexes! You've defeated the AI!"
            : "The AI was faster this time. Try again?"}
        </p>

        <div className="flex flex-col gap-4 items-center">
          <Button
            onClick={onRestart}
            size="lg"
            className={`text-2xl px-12 py-8 font-bold transition-all duration-300 hover:scale-105 ${
              isWin
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon-green"
                : "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-neon-cyan"
            }`}
          >
            PLAY AGAIN
          </Button>
        </div>
      </div>
    </div>
  );
};
