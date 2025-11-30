export type GameState = "start" | "level" | "playing" | "end";

export type Direction = "LEFT" | "RIGHT" | "UP" | "DOWN";

export interface Position {
  x: number;
  y: number;
}
