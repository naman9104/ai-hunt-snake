import { useEffect, useRef } from "react";
import { Position } from "./types";

interface GameCanvasProps {
  snake: Position[];
  aiSnake: Position[];
  food: Position;
  boxSize: number;
}

export const GameCanvas = ({ snake, aiSnake, food, boxSize }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with dark background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += boxSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += boxSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw food with glow effect
    const drawGlowingBox = (x: number, y: number, color: string, glowColor: string) => {
      ctx.shadowBlur = 20;
      ctx.shadowColor = glowColor;
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y + 2, boxSize - 4, boxSize - 4);
      ctx.shadowBlur = 0;
    };

    // Food
    drawGlowingBox(food.x, food.y, "#ff006e", "#ff006e");

    // Player snake with gradient
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const alpha = 1 - (index / snake.length) * 0.5;
      
      if (isHead) {
        drawGlowingBox(segment.x, segment.y, "#00ff41", "#00ff41");
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ff41";
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.fillRect(segment.x + 3, segment.y + 3, boxSize - 6, boxSize - 6);
        ctx.shadowBlur = 0;
      }
    });

    // AI snake with gradient
    aiSnake.forEach((segment, index) => {
      const isHead = index === 0;
      const alpha = 1 - (index / aiSnake.length) * 0.5;
      
      if (isHead) {
        drawGlowingBox(segment.x, segment.y, "#00f0ff", "#00f0ff");
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.fillRect(segment.x + 3, segment.y + 3, boxSize - 6, boxSize - 6);
        ctx.shadowBlur = 0;
      }
    });
  }, [snake, aiSnake, food, boxSize]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
};
