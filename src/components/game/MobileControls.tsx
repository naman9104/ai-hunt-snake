import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from "lucide-react";

interface MobileControlsProps {
  onDirectionChange: (direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => void;
  onDash: () => void;
  dashReady: boolean;
}

export const MobileControls = ({ onDirectionChange, onDash, dashReady }: MobileControlsProps) => {
  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-between px-4 md:hidden z-50">
      {/* Left side - directional pad */}
      <div className="relative w-40 h-40">
        <Button
          size="icon"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary/80 hover:bg-primary shadow-neon-green"
          onClick={() => onDirectionChange("UP")}
        >
          <ArrowUp className="w-6 h-6" />
        </Button>
        <Button
          size="icon"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary/80 hover:bg-primary shadow-neon-green"
          onClick={() => onDirectionChange("DOWN")}
        >
          <ArrowDown className="w-6 h-6" />
        </Button>
        <Button
          size="icon"
          className="absolute top-1/2 left-0 -translate-y-1/2 w-14 h-14 bg-primary/80 hover:bg-primary shadow-neon-green"
          onClick={() => onDirectionChange("LEFT")}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Button
          size="icon"
          className="absolute top-1/2 right-0 -translate-y-1/2 w-14 h-14 bg-primary/80 hover:bg-primary shadow-neon-green"
          onClick={() => onDirectionChange("RIGHT")}
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Right side - dash button */}
      <div className="flex items-center">
        <Button
          size="icon"
          className={`w-20 h-20 ${dashReady ? 'bg-accent hover:bg-accent/90 shadow-neon-pink' : 'bg-muted'} transition-all`}
          onClick={onDash}
          disabled={!dashReady}
        >
          <Zap className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};
