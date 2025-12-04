import { SNAKE_SKINS } from "./types";

interface SkinSelectorProps {
  selectedSkin: string;
  onSelectSkin: (skinId: string) => void;
}

export const SkinSelector = ({ selectedSkin, onSelectSkin }: SkinSelectorProps) => {
  return (
    <div className="w-full space-y-2">
      <h3 className="text-sm font-bold text-muted-foreground text-center">CHOOSE YOUR SNAKE</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {SNAKE_SKINS.map((skin) => (
          <button
            key={skin.id}
            onClick={() => onSelectSkin(skin.id)}
            className={`relative w-12 h-12 rounded-lg transition-all duration-200 ${
              selectedSkin === skin.id
                ? "scale-110"
                : "hover:scale-105 opacity-70 hover:opacity-100"
            }`}
            style={{
              background: `linear-gradient(135deg, ${skin.headColor}, ${skin.bodyColor})`,
              boxShadow: selectedSkin === skin.id ? `0 0 20px ${skin.glowColor}, 0 0 0 2px ${skin.headColor}` : "none",
            }}
            title={skin.name}
          >
            {selectedSkin === skin.id && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-background rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
