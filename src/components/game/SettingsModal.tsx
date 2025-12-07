import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings, X, Volume2, Monitor, Gamepad2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

export type GraphicsLevel = "low" | "medium" | "high";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  graphicsLevel: GraphicsLevel;
  onGraphicsChange: (level: GraphicsLevel) => void;
  targetFps: number;
  onFpsChange: (fps: number) => void;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  volume,
  onVolumeChange,
  graphicsLevel,
  onGraphicsChange,
  targetFps,
  onFpsChange,
}: SettingsModalProps) => {
  if (!isOpen) return null;

  const graphicsOptions: { value: GraphicsLevel; label: string; description: string }[] = [
    { value: "low", label: "LOW", description: "No trails, minimal effects" },
    { value: "medium", label: "MEDIUM", description: "Reduced particles" },
    { value: "high", label: "HIGH", description: "Full effects & trails" },
  ];

  const fpsOptions = [30, 60, 120];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border-2 border-primary rounded-2xl p-6 w-full max-w-md mx-4 shadow-neon-green">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            SETTINGS
          </h2>
          <Button
            onClick={onClose}
            size="icon"
            variant="ghost"
            className="hover:bg-destructive/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Audio Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Volume2 className="h-4 w-4" />
              AUDIO
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">Master Volume</span>
                <span className="text-sm text-primary font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume * 100]}
                onValueChange={(val) => onVolumeChange(val[0] / 100)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Gamepad2 className="h-4 w-4" />
              CONTROLS
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border space-y-4">
              {/* Arrow Keys */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Movement</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-primary/20 border border-primary rounded flex items-center justify-center">
                      <ArrowUp className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-primary/20 border border-primary rounded flex items-center justify-center">
                      <ArrowLeft className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-8 h-8 bg-primary/20 border border-primary rounded flex items-center justify-center">
                      <ArrowDown className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-8 h-8 bg-primary/20 border border-primary rounded flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* WASD */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Alternative</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-secondary/20 border border-secondary rounded flex items-center justify-center text-xs font-bold text-secondary">W</div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-secondary/20 border border-secondary rounded flex items-center justify-center text-xs font-bold text-secondary">A</div>
                    <div className="w-8 h-8 bg-secondary/20 border border-secondary rounded flex items-center justify-center text-xs font-bold text-secondary">S</div>
                    <div className="w-8 h-8 bg-secondary/20 border border-secondary rounded flex items-center justify-center text-xs font-bold text-secondary">D</div>
                  </div>
                </div>
              </div>

              {/* Touch/Swipe */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Mobile</span>
                <div className="text-xs text-muted-foreground bg-accent/20 px-3 py-2 rounded border border-accent">
                  SWIPE TO MOVE
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                Double-tap direction or tap DASH button to boost
              </div>
            </div>
          </div>

          {/* Graphics Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Monitor className="h-4 w-4" />
              GRAPHICS
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border space-y-3">
              <div className="flex gap-2">
                {graphicsOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => onGraphicsChange(option.value)}
                    variant={graphicsLevel === option.value ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 ${
                      graphicsLevel === option.value
                        ? "bg-primary text-primary-foreground"
                        : "border-border hover:bg-primary/20"
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {graphicsOptions.find((o) => o.value === graphicsLevel)?.description}
              </p>
            </div>
          </div>

          {/* FPS Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              TARGET FPS
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex gap-2">
                {fpsOptions.map((fps) => (
                  <Button
                    key={fps}
                    onClick={() => onFpsChange(fps)}
                    variant={targetFps === fps ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 ${
                      targetFps === fps
                        ? "bg-secondary text-secondary-foreground"
                        : "border-border hover:bg-secondary/20"
                    }`}
                  >
                    {fps} FPS
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-6 bg-primary hover:bg-primary/80 text-primary-foreground font-bold"
        >
          SAVE & CLOSE
        </Button>
      </div>
    </div>
  );
};

export const SettingsButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant="outline"
      className="h-12 w-12 border-2 border-primary hover:bg-primary/20 transition-all"
      title="Settings"
    >
      <Settings className="h-5 w-5 text-primary" />
    </Button>
  );
};