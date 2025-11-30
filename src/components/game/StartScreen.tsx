import { Button } from "@/components/ui/button";

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen = ({ onStart }: StartScreenProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-50 animate-fade-in">
      <div className="text-center space-y-8 px-4">
        <div className="animate-float">
          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-pulse-glow">
            SNAKE
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-1 w-20 bg-primary shadow-neon-green"></div>
            <span className="text-2xl md:text-4xl font-bold text-foreground">VS</span>
            <div className="h-1 w-20 bg-secondary shadow-neon-cyan"></div>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary via-accent to-primary mt-2">
            AI
          </h2>
        </div>

        <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto">
          Race against an intelligent AI opponent. First to 10 points wins!
        </p>

        <div className="flex flex-col gap-4 items-center">
          <Button
            onClick={onStart}
            size="lg"
            className="text-2xl px-12 py-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon-green hover:shadow-neon-green hover:scale-105 transition-all duration-300 font-bold"
          >
            START GAME
          </Button>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary shadow-neon-green rounded"></div>
              <span>You</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary shadow-neon-cyan rounded"></div>
              <span>AI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent shadow-neon-pink rounded"></div>
              <span>Food</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Use arrow keys to control your snake</p>
          <p>Press SPACE to pause</p>
        </div>
      </div>
    </div>
  );
};
