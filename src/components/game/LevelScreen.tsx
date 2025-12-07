import { Button } from "@/components/ui/button";

export type DifficultyLevel = "easy" | "medium" | "hard" | "impossible";

interface LevelScreenProps {
  onSelectLevel: (speed: number, difficulty: DifficultyLevel) => void;
}

const levels: { name: string; speed: number; color: string; description: string; difficulty: DifficultyLevel }[] = [
  { name: "EASY", speed: 150, color: "primary", description: "Relaxed pace", difficulty: "easy" },
  { name: "MEDIUM", speed: 120, color: "secondary", description: "Balanced challenge", difficulty: "medium" },
  { name: "HARD", speed: 90, color: "accent", description: "Fast reflexes needed", difficulty: "hard" },
  { name: "IMPOSSIBLE", speed: 60, color: "destructive", description: "Are you ready?", difficulty: "impossible" },
];

export const LevelScreen = ({ onSelectLevel }: LevelScreenProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-50 animate-slide-up">
      <div className="text-center space-y-8 px-4 max-w-2xl">
        <h2 className="text-5xl md:text-6xl font-black text-foreground">
          SELECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">DIFFICULTY</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {levels.map((level) => (
            <Button
              key={level.name}
              onClick={() => onSelectLevel(level.speed, level.difficulty)}
              variant="outline"
              className={`h-32 text-2xl font-bold border-2 transition-all duration-300 hover:scale-105 ${
                level.color === "primary"
                  ? "border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-neon-green"
                  : level.color === "secondary"
                  ? "border-secondary hover:bg-secondary hover:text-secondary-foreground hover:shadow-neon-cyan"
                  : level.color === "accent"
                  ? "border-accent hover:bg-accent hover:text-accent-foreground hover:shadow-neon-pink"
                  : "border-destructive hover:bg-destructive hover:text-destructive-foreground"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span>{level.name}</span>
                <span className="text-xs font-normal opacity-70">{level.description}</span>
              </div>
            </Button>
          ))}
        </div>

        <p className="text-muted-foreground text-sm">
          Higher difficulty = Faster gameplay for both you and AI
        </p>
      </div>
    </div>
  );
};
