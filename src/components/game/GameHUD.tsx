import { Button } from "@/components/ui/button";
import { Play, Pause, Zap, Volume2, VolumeX, Settings } from "lucide-react";

interface GameHUDProps {
  score: number;
  aiScore: number;
  isPaused: boolean;
  onTogglePause: () => void;
  dashReady: boolean;
  musicPlaying: boolean;
  onToggleMusic: () => void;
  onOpenSettings: () => void;
}

export const GameHUD = ({
  score,
  aiScore,
  isPaused,
  onTogglePause,
  dashReady,
  musicPlaying,
  onToggleMusic,
  onOpenSettings,
}: GameHUDProps) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
      <div className="space-y-2">
        <div className="bg-card/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-primary shadow-neon-green">
          <div className="text-xs text-muted-foreground mb-1">YOU</div>
          <div className="text-3xl font-black text-primary">{score}</div>
        </div>
        <div className="bg-card/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-secondary shadow-neon-cyan">
          <div className="text-xs text-muted-foreground mb-1">AI</div>
          <div className="text-3xl font-black text-secondary">{aiScore}</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {dashReady && (
          <div className="px-4 py-2 bg-primary/20 border-2 border-primary rounded-lg text-primary font-bold flex items-center gap-2 animate-pulse">
            <Zap className="h-4 w-4" />
            DASH READY
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onOpenSettings}
            size="icon"
            variant="outline"
            className="h-12 w-12 border-2 border-primary hover:bg-primary/20 transition-all"
            title="Settings"
          >
            <Settings className="h-5 w-5 text-primary" />
          </Button>
          
          <Button
            onClick={onToggleMusic}
            size="icon"
            variant="outline"
            className="h-12 w-12 border-2 border-accent hover:bg-accent/20 transition-all"
            title={musicPlaying ? "Mute Music" : "Play Music"}
          >
            {musicPlaying ? <Volume2 className="h-5 w-5 text-accent" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          
          <Button
            onClick={onTogglePause}
            size="icon"
            variant="outline"
            className="h-12 w-12 border-2 border-foreground hover:bg-foreground hover:text-background transition-all"
          >
            {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
          </Button>
        </div>
        
        {isPaused && (
          <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-accent animate-pulse">
            <div className="text-sm font-bold text-accent">PAUSED</div>
          </div>
        )}
      </div>
    </div>
  );
};