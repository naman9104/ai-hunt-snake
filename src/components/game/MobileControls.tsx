import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface MobileControlsProps {
  onDash: () => void;
  dashReady: boolean;
}

export const MobileControls = ({ onDash, dashReady }: MobileControlsProps) => {
  return (
    <div className="fixed bottom-8 right-4 md:hidden z-50">
      <Button
        size="icon"
        className={`w-20 h-20 ${dashReady ? 'bg-accent hover:bg-accent/90 shadow-neon-pink' : 'bg-muted'} transition-all`}
        onClick={onDash}
        disabled={!dashReady}
      >
        <Zap className="w-8 h-8" />
      </Button>
    </div>
  );
};
