import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StartScreenProps {
  onStart: (username: string) => void;
}

export const StartScreen = ({ onStart }: StartScreenProps) => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("snakeUsername") || "";
  });
  const [topScores, setTopScores] = useState<Array<{ username: string; score: number }>>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("leaderboard")
        .select("username, score")
        .order("score", { ascending: false })
        .limit(5);
      if (data) {
        setTopScores(data);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleStart = () => {
    const trimmedName = username.trim();
    if (trimmedName) {
      localStorage.setItem("snakeUsername", trimmedName);
      onStart(trimmedName);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-50 animate-fade-in">
      <div className="text-center space-y-6 px-4 max-w-md w-full">
        <div className="animate-float">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-pulse-glow">
            SNAKE
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-1 w-16 bg-primary shadow-neon-green"></div>
            <span className="text-xl md:text-3xl font-bold text-foreground">VS</span>
            <div className="h-1 w-16 bg-secondary shadow-neon-cyan"></div>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary via-accent to-primary mt-2">
            AI
          </h2>
        </div>

        <p className="text-muted-foreground text-base md:text-lg">
          Race against an intelligent AI. First to 10 points wins!
        </p>

        <div className="space-y-4 w-full">
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-lg py-5 px-4 text-center bg-background/50 border-primary focus:border-primary text-foreground"
            maxLength={20}
          />
          
          <Button
            onClick={handleStart}
            disabled={!username.trim()}
            size="lg"
            className="w-full text-xl px-8 py-6 font-bold transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
          >
            START GAME
          </Button>
        </div>

        {topScores.length > 0 && (
          <div className="w-full space-y-2">
            <h3 className="text-sm font-bold text-accent flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4" />
              TOP PLAYERS
            </h3>
            <div className="bg-card/30 backdrop-blur-sm border border-primary/20 rounded-lg p-3 space-y-1">
              {topScores.map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-1 px-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    #{index + 1} {entry.username}
                  </span>
                  <span className="text-primary font-bold">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary shadow-neon-green rounded"></div>
            <span>You</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-secondary shadow-neon-cyan rounded"></div>
            <span>AI</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-accent shadow-neon-pink rounded"></div>
            <span>Food</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Arrow keys / Swipe to move</p>
          <p>Double tap for DASH</p>
        </div>
      </div>
    </div>
  );
};
