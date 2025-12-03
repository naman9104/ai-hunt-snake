import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface EndScreenProps {
  message: string;
  onRestart: () => void;
  score: number;
  rank: number | null;
  topScores: Array<{ username: string; score: number }>;
}

export const EndScreen = ({ message, onRestart, score, rank, topScores }: EndScreenProps) => {
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

        {isWin && rank && (
          <div className="text-center space-y-2">
            <p className="text-accent text-lg">Your Score: {score}</p>
            <p className="text-primary text-2xl font-bold flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6" />
              Worldwide Rank: #{rank}
            </p>
          </div>
        )}

        <p className="text-muted-foreground text-xl">
          {isWin
            ? "Incredible reflexes! You've defeated the AI!"
            : "Don't give up! Try again?"}
        </p>

        {topScores.length > 0 && (
          <div className="w-full max-w-md space-y-3">
            <h3 className="text-xl font-bold text-center text-accent">🏆 TOP 10 LEADERBOARD</h3>
            <div className="bg-background/50 backdrop-blur-sm border border-primary/30 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
              {topScores.map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-background/30 rounded border border-primary/20"
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
