export type GameState = "start" | "level" | "playing" | "end";

export type Direction = "LEFT" | "RIGHT" | "UP" | "DOWN";

export type PowerUpType = "speed" | "invincible" | "multiplier" | "shrink" | "freeze";

export interface Position {
  x: number;
  y: number;
}

export interface PowerUp extends Position {
  type: PowerUpType;
  duration: number;
}
