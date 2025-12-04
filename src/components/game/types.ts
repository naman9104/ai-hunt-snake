export type GameState = "start" | "level" | "playing" | "end";

export type Direction = "LEFT" | "RIGHT" | "UP" | "DOWN";

export interface Position {
  x: number;
  y: number;
}

export interface SnakeSkin {
  id: string;
  name: string;
  headColor: string;
  bodyColor: string;
  glowColor: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const SNAKE_SKINS: SnakeSkin[] = [
  { id: "neon-green", name: "Neon Green", headColor: "#00ff41", bodyColor: "rgba(0, 255, 65, 0.8)", glowColor: "#00ff41" },
  { id: "neon-purple", name: "Neon Purple", headColor: "#bf00ff", bodyColor: "rgba(191, 0, 255, 0.8)", glowColor: "#bf00ff" },
  { id: "neon-orange", name: "Neon Orange", headColor: "#ff6600", bodyColor: "rgba(255, 102, 0, 0.8)", glowColor: "#ff6600" },
  { id: "neon-gold", name: "Neon Gold", headColor: "#ffd700", bodyColor: "rgba(255, 215, 0, 0.8)", glowColor: "#ffd700" },
  { id: "neon-red", name: "Neon Red", headColor: "#ff0040", bodyColor: "rgba(255, 0, 64, 0.8)", glowColor: "#ff0040" },
  { id: "neon-white", name: "Neon White", headColor: "#ffffff", bodyColor: "rgba(255, 255, 255, 0.8)", glowColor: "#ffffff" },
];
