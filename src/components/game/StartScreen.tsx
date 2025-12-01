import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StartScreenProps {
  onStart: (username: string) => void;
}

export const StartScreen = ({ onStart }: StartScreenProps) => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("snakeUsername") || "";
  });

  const handleStart = () => {
    const trimmedName = username.trim();
    if (trimmedName) {
      localStorage.setItem("snakeUsername", trimmedName);
      onStart(trimmedName);
    }
  };

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

        <div className="space-y-6 w-full max-w-md mx-auto">
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-xl py-6 px-4 text-center bg-background/50 border-primary focus:border-primary text-foreground"
            maxLength={20}
          />
          
          <Button
            onClick={handleStart}
            disabled={!username.trim()}
            size="lg"
            className="w-full text-2xl px-12 py-8 font-bold transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
          >
            START GAME
          </Button>
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground justify-center">
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

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Use arrow keys to control your snake</p>
          <p>Double tap for DASH ability</p>
          <p>Press SPACE to pause</p>
        </div>
      </div>
    </div>
  );
};
