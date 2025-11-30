import { useEffect, useRef, useState } from "react";
import { StartScreen } from "./game/StartScreen";
import { LevelScreen } from "./game/LevelScreen";
import { GameCanvas } from "./game/GameCanvas";
import { GameHUD } from "./game/GameHUD";
import { EndScreen } from "./game/EndScreen";
import { GameState, Position, Direction } from "./game/types";

const BOX_SIZE = 20;
const WIN_SCORE = 10;

export const SnakeGame = () => {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [speed, setSpeed] = useState(150);
  const [isPaused, setIsPaused] = useState(false);
  const [endMessage, setEndMessage] = useState("");

  const snakeRef = useRef<Position[]>([
    { x: 9 * BOX_SIZE, y: 10 * BOX_SIZE },
    { x: 8 * BOX_SIZE, y: 10 * BOX_SIZE },
    { x: 7 * BOX_SIZE, y: 10 * BOX_SIZE },
  ]);
  const aiSnakeRef = useRef<Position[]>([
    { x: 5 * BOX_SIZE, y: 5 * BOX_SIZE },
    { x: 4 * BOX_SIZE, y: 5 * BOX_SIZE },
    { x: 3 * BOX_SIZE, y: 5 * BOX_SIZE },
  ]);
  const foodRef = useRef<Position>({ x: 0, y: 0 });
  const dirRef = useRef<Direction>("RIGHT");
  const aiDirRef = useRef<Direction>("RIGHT");

  const handleStartGame = (selectedSpeed: number) => {
    setSpeed(selectedSpeed);
    setGameState("playing");
    setScore(0);
    setAiScore(0);
    setIsPaused(false);

    snakeRef.current = [
      { x: 9 * BOX_SIZE, y: 10 * BOX_SIZE },
      { x: 8 * BOX_SIZE, y: 10 * BOX_SIZE },
      { x: 7 * BOX_SIZE, y: 10 * BOX_SIZE },
    ];
    aiSnakeRef.current = [
      { x: 5 * BOX_SIZE, y: 5 * BOX_SIZE },
      { x: 4 * BOX_SIZE, y: 5 * BOX_SIZE },
      { x: 3 * BOX_SIZE, y: 5 * BOX_SIZE },
    ];
    dirRef.current = "RIGHT";
    aiDirRef.current = "RIGHT";

    spawnFood();
  };

  const spawnFood = () => {
    const maxX = Math.floor(window.innerWidth / BOX_SIZE);
    const maxY = Math.floor(window.innerHeight / BOX_SIZE);
    foodRef.current = {
      x: Math.floor(Math.random() * maxX) * BOX_SIZE,
      y: Math.floor(Math.random() * maxY) * BOX_SIZE,
    };
  };

  const handleRestart = () => {
    setGameState("start");
    setScore(0);
    setAiScore(0);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const endGame = (message: string) => {
    setEndMessage(message);
    setGameState("end");
  };

  useEffect(() => {
    if (gameState !== "playing" || isPaused) return;

    const interval = setInterval(() => {
      // Update player snake
      const head = snakeRef.current[0];
      let newHead = { ...head };

      switch (dirRef.current) {
        case "LEFT":
          newHead.x -= BOX_SIZE;
          break;
        case "RIGHT":
          newHead.x += BOX_SIZE;
          break;
        case "UP":
          newHead.y -= BOX_SIZE;
          break;
        case "DOWN":
          newHead.y += BOX_SIZE;
          break;
      }

      // Check player collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= window.innerWidth ||
        newHead.y < 0 ||
        newHead.y >= window.innerHeight
      ) {
        endGame("💀 GAME OVER - AI WINS!");
        return;
      }

      // Check player self collision
      if (snakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        endGame("💀 COLLISION - AI WINS!");
        return;
      }

      const newSnake = [newHead, ...snakeRef.current];
      
      // Check if player ate food
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        setScore((prev) => {
          const newScore = prev + 1;
          if (newScore >= WIN_SCORE) {
            endGame("🎉 YOU WIN!");
          }
          return newScore;
        });
        spawnFood();
      } else {
        newSnake.pop();
      }
      snakeRef.current = newSnake;

      // Update AI snake with smarter pathfinding
      const aiHead = aiSnakeRef.current[0];
      const food = foodRef.current;

      // Calculate best direction using simple pathfinding
      const dx = food.x - aiHead.x;
      const dy = food.y - aiHead.y;

      let newAiDir = aiDirRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        newAiDir = dx > 0 ? "RIGHT" : "LEFT";
      } else {
        newAiDir = dy > 0 ? "DOWN" : "UP";
      }

      // Avoid going backwards
      const opposites: Record<Direction, Direction> = {
        LEFT: "RIGHT",
        RIGHT: "LEFT",
        UP: "DOWN",
        DOWN: "UP",
      };
      if (newAiDir === opposites[aiDirRef.current]) {
        newAiDir = aiDirRef.current;
      }

      aiDirRef.current = newAiDir;

      let newAiHead = { ...aiHead };
      switch (aiDirRef.current) {
        case "LEFT":
          newAiHead.x -= BOX_SIZE;
          break;
        case "RIGHT":
          newAiHead.x += BOX_SIZE;
          break;
        case "UP":
          newAiHead.y -= BOX_SIZE;
          break;
        case "DOWN":
          newAiHead.y += BOX_SIZE;
          break;
      }

      const newAiSnake = [newAiHead, ...aiSnakeRef.current];

      // Check if AI ate food
      if (newAiHead.x === foodRef.current.x && newAiHead.y === foodRef.current.y) {
        setAiScore((prev) => {
          const newScore = prev + 1;
          if (newScore >= WIN_SCORE) {
            endGame("🤖 AI WINS!");
          }
          return newScore;
        });
        spawnFood();
      } else {
        newAiSnake.pop();
      }
      aiSnakeRef.current = newAiSnake;
    }, speed);

    return () => clearInterval(interval);
  }, [gameState, speed, isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      const opposites: Record<Direction, Direction> = {
        LEFT: "RIGHT",
        RIGHT: "LEFT",
        UP: "DOWN",
        DOWN: "UP",
      };

      let newDir: Direction | null = null;
      switch (e.key) {
        case "ArrowLeft":
          newDir = "LEFT";
          break;
        case "ArrowRight":
          newDir = "RIGHT";
          break;
        case "ArrowUp":
          newDir = "UP";
          break;
        case "ArrowDown":
          newDir = "DOWN";
          break;
      }

      if (newDir && newDir !== opposites[dirRef.current]) {
        dirRef.current = newDir;
      }

      if (e.key === " ") {
        e.preventDefault();
        handleTogglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {gameState === "start" && (
        <StartScreen onStart={() => setGameState("level")} />
      )}
      
      {gameState === "level" && (
        <LevelScreen onSelectLevel={handleStartGame} />
      )}

      {gameState === "playing" && (
        <>
          <GameHUD
            score={score}
            aiScore={aiScore}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
          />
          <GameCanvas
            snake={snakeRef.current}
            aiSnake={aiSnakeRef.current}
            food={foodRef.current}
            boxSize={BOX_SIZE}
          />
        </>
      )}

      {gameState === "end" && (
        <EndScreen message={endMessage} onRestart={handleRestart} />
      )}
    </div>
  );
};
