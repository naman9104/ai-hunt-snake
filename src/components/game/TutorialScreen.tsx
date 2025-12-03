import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Hand } from "lucide-react";

interface TutorialScreenProps {
  onContinue: () => void;
}

export const TutorialScreen = ({ onContinue }: TutorialScreenProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-50 animate-fade-in">
      <div className="text-center space-y-6 px-4 max-w-lg">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
          HOW TO PLAY
        </h1>

        <div className="space-y-4 text-left">
          {/* Desktop Controls */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-primary mb-2">Desktop Controls</h3>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <ArrowUp className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <span>Arrow keys to move</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground mt-2">
              <div className="px-3 h-8 bg-muted rounded flex items-center justify-center text-sm font-mono">
                SPACE
              </div>
              <span>Pause game</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground mt-2">
              <Zap className="w-5 h-5 text-accent" />
              <span>Double tap arrow key for DASH</span>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="bg-card/50 backdrop-blur-sm border border-secondary/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-secondary mb-2">Mobile Controls</h3>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Hand className="w-5 h-5 text-secondary" />
              <span>Swipe on screen to change direction</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground mt-2">
              <Zap className="w-5 h-5 text-accent" />
              <span>Tap DASH button to boost forward</span>
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-card/50 backdrop-blur-sm border border-accent/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-accent mb-2">Rules</h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded"></div>
                Collect pink food to score points
              </li>
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                You are the green snake
              </li>
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded"></div>
                Avoid the cyan AI snake
              </li>
              <li>• First to 10 points wins!</li>
              <li>• Don't hit walls or yourself</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={onContinue}
          size="lg"
          className="w-full text-xl px-8 py-6 font-bold transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon-green"
        >
          GOT IT!
        </Button>
      </div>
    </div>
  );
};
