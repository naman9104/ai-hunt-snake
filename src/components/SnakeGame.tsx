import { useEffect, useRef, useState } from "react";
import { StartScreen } from "./game/StartScreen";
import { TutorialScreen } from "./game/TutorialScreen";
import { LevelScreen } from "./game/LevelScreen";
import { GameHUD } from "./game/GameHUD";
import { EndScreen } from "./game/EndScreen";
import { MobileControls } from "./game/MobileControls";
import { GameState, Position, Direction } from "./game/types";
import { supabase } from "@/integrations/supabase/client";
import { sounds } from "./game/sounds";

const BOX_SIZE = 20;
const WIN_SCORE = 10;
const DASH_SPEED = 3;
const DASH_COOLDOWN = 1000;

export const SnakeGame = () => {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [speed, setSpeed] = useState(150);
  const [isPaused, setIsPaused] = useState(false);
  const [endMessage, setEndMessage] = useState("");
  const [username, setUsername] = useState("");
  const [userRank, setUserRank] = useState<number | null>(null);
  const [topScores, setTopScores] = useState<Array<{ username: string; score: number }>>([]);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("snakeTutorialSeen");
  });

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTimeRef = useRef<number>(0);
  const gameLoopRef = useRef<number>(0);
  const lastKeyPressRef = useRef<{ key: string; time: number } | null>(null);
  const dashCooldownRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fetch leaderboard on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("leaderboard")
        .select("username, score")
        .order("score", { ascending: false })
        .limit(10);
      if (data) {
        setTopScores(data);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleStartGame = (selectedSpeed: number) => {
    setSpeed(selectedSpeed);
    setGameState("playing");
    setScore(0);
    setAiScore(0);
    setIsPaused(false);
    sounds.start();

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
    dashCooldownRef.current = 0;

    spawnFood();
  };

  const spawnFood = () => {
    const maxX = Math.floor(canvasSize.width / BOX_SIZE);
    const maxY = Math.floor(canvasSize.height / BOX_SIZE);
    foodRef.current = {
      x: Math.floor(Math.random() * maxX) * BOX_SIZE,
      y: Math.floor(Math.random() * maxY) * BOX_SIZE,
    };
  };

  const handleRestart = () => {
    setGameState("level");
    setScore(0);
    setAiScore(0);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const endGame = async (message: string, isWin: boolean) => {
    setEndMessage(message);
    setGameState("end");
    
    if (isWin) {
      sounds.win();
    } else {
      sounds.lose();
    }
    
    // Submit score to leaderboard
    if (username && isWin && score > 0) {
      await supabase.from("leaderboard").insert({
        username,
        score,
      });
      
      // Get user rank
      const { data } = await supabase
        .from("leaderboard")
        .select("score")
        .order("score", { ascending: false });
      
      if (data) {
        const rank = data.findIndex((entry) => entry.score <= score) + 1;
        setUserRank(rank);
      }
      
      // Get top 10 scores
      const { data: topData } = await supabase
        .from("leaderboard")
        .select("username, score")
        .order("score", { ascending: false })
        .limit(10);
      
      if (topData) {
        setTopScores(topData);
      }
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvasSize.width;
    const height = canvasSize.height;

    // Clear canvas
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += BOX_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += BOX_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw food
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff006e";
    ctx.fillStyle = "#ff006e";
    ctx.fillRect(foodRef.current.x + 2, foodRef.current.y + 2, BOX_SIZE - 4, BOX_SIZE - 4);
    ctx.shadowBlur = 0;

    // Draw player snake
    snakeRef.current.forEach((segment, index) => {
      const isHead = index === 0;
      const alpha = 1 - (index / snakeRef.current.length) * 0.5;
      
      if (isHead) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ff41";
        ctx.fillStyle = "#00ff41";
        ctx.fillRect(segment.x + 2, segment.y + 2, BOX_SIZE - 4, BOX_SIZE - 4);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ff41";
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.fillRect(segment.x + 3, segment.y + 3, BOX_SIZE - 6, BOX_SIZE - 6);
        ctx.shadowBlur = 0;
      }
    });

    // Draw AI snake
    aiSnakeRef.current.forEach((segment, index) => {
      const isHead = index === 0;
      const alpha = 1 - (index / aiSnakeRef.current.length) * 0.5;
      
      if (isHead) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#00f0ff";
        ctx.fillRect(segment.x + 2, segment.y + 2, BOX_SIZE - 4, BOX_SIZE - 4);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.fillRect(segment.x + 3, segment.y + 3, BOX_SIZE - 6, BOX_SIZE - 6);
        ctx.shadowBlur = 0;
      }
    });
  };

  useEffect(() => {
    if (gameState !== "playing" || isPaused) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;

      if (deltaTime >= speed) {
        lastTimeRef.current = currentTime;

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
          newHead.x >= canvasSize.width ||
          newHead.y < 0 ||
          newHead.y >= canvasSize.height
        ) {
          sounds.collision();
          endGame("💀 WALL COLLISION!", false);
          return;
        }

        // Check player self collision
        if (snakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          sounds.collision();
          endGame("💀 SELF COLLISION!", false);
          return;
        }

        // Check player collision with AI
        if (aiSnakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          sounds.collision();
          endGame("💀 HIT AI SNAKE!", false);
          return;
        }

        const newSnake = [newHead, ...snakeRef.current];
        
        // Check if player ate food
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          sounds.eat();
          setScore((prev) => {
            const newScore = prev + 1;
            if (newScore >= WIN_SCORE) {
              endGame("🎉 YOU WIN!", true);
            }
            return newScore;
          });
          spawnFood();
        } else {
          newSnake.pop();
        }

        snakeRef.current = newSnake;

        // Update AI snake
        const aiHead = aiSnakeRef.current[0];
        const food = foodRef.current;

        const dx = food.x - aiHead.x;
        const dy = food.y - aiHead.y;

        let newAiDir = aiDirRef.current;
        if (Math.abs(dx) > Math.abs(dy)) {
          newAiDir = dx > 0 ? "RIGHT" : "LEFT";
        } else {
          newAiDir = dy > 0 ? "DOWN" : "UP";
        }

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

        // Check AI collision with walls
        if (
          newAiHead.x < 0 ||
          newAiHead.x >= canvasSize.width ||
          newAiHead.y < 0 ||
          newAiHead.y >= canvasSize.height
        ) {
          endGame("🎉 AI HIT WALL - YOU WIN!", true);
          return;
        }

        // Check AI self collision
        if (aiSnakeRef.current.some((seg) => seg.x === newAiHead.x && seg.y === newAiHead.y)) {
          endGame("🎉 AI SELF COLLISION - YOU WIN!", true);
          return;
        }

        // Check AI collision with player
        if (snakeRef.current.some((seg) => seg.x === newAiHead.x && seg.y === newAiHead.y)) {
          endGame("🎉 AI HIT YOUR SNAKE - YOU WIN!", true);
          return;
        }

        const newAiSnake = [newAiHead, ...aiSnakeRef.current];

        // Check if AI ate food
        if (newAiHead.x === foodRef.current.x && newAiHead.y === foodRef.current.y) {
          setAiScore((prev) => {
            const newScore = prev + 1;
            if (newScore >= WIN_SCORE) {
              endGame("🤖 AI WINS!", false);
            }
            return newScore;
          });
          spawnFood();
        } else {
          newAiSnake.pop();
        }
        aiSnakeRef.current = newAiSnake;

        drawGame();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
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
        // Double tap detection for dash
        const now = Date.now();
        const lastPress = lastKeyPressRef.current;
        
        if (
          lastPress &&
          lastPress.key === e.key &&
          now - lastPress.time < 300 &&
          now > dashCooldownRef.current
        ) {
          // Execute dash
          sounds.dash();
          const head = snakeRef.current[0];
          let dashHead = { ...head };
          
          for (let i = 0; i < DASH_SPEED; i++) {
            switch (newDir) {
              case "LEFT":
                dashHead.x -= BOX_SIZE;
                break;
              case "RIGHT":
                dashHead.x += BOX_SIZE;
                break;
              case "UP":
                dashHead.y -= BOX_SIZE;
                break;
              case "DOWN":
                dashHead.y += BOX_SIZE;
                break;
            }
          }
          
          snakeRef.current = [dashHead, ...snakeRef.current.slice(0, -DASH_SPEED)];
          dashCooldownRef.current = now + DASH_COOLDOWN;
          lastKeyPressRef.current = null;
        } else {
          lastKeyPressRef.current = { key: e.key, time: now };
          dirRef.current = newDir;
        }
      }

      if (e.key === " ") {
        e.preventDefault();
        handleTogglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Handle canvas resizing and touch events
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("touchstart", handleTouchStart);
      canvas.addEventListener("touchend", handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [gameState, isPaused]);

  const handleTouchStart = (e: TouchEvent) => {
    if (gameState !== "playing" || isPaused) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current || gameState !== "playing" || isPaused) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      touchStartRef.current = null;
      return;
    }
    
    const opposites: Record<Direction, Direction> = {
      LEFT: "RIGHT",
      RIGHT: "LEFT",
      UP: "DOWN",
      DOWN: "UP",
    };
    
    let newDirection: Direction;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      newDirection = deltaX > 0 ? "RIGHT" : "LEFT";
    } else {
      newDirection = deltaY > 0 ? "DOWN" : "UP";
    }
    
    if (newDirection !== opposites[dirRef.current]) {
      dirRef.current = newDirection;
    }
    
    touchStartRef.current = null;
  };

  const handleMobileDash = () => {
    if (gameState !== "playing" || isPaused) return;
    const now = Date.now();
    
    if (now > dashCooldownRef.current) {
      sounds.dash();
      const head = snakeRef.current[0];
      let dashHead = { ...head };
      
      for (let i = 0; i < DASH_SPEED; i++) {
        switch (dirRef.current) {
          case "LEFT":
            dashHead.x -= BOX_SIZE;
            break;
          case "RIGHT":
            dashHead.x += BOX_SIZE;
            break;
          case "UP":
            dashHead.y -= BOX_SIZE;
            break;
          case "DOWN":
            dashHead.y += BOX_SIZE;
            break;
        }
      }
      
      snakeRef.current = [dashHead, ...snakeRef.current.slice(0, -DASH_SPEED)];
      dashCooldownRef.current = now + DASH_COOLDOWN;
    }
  };

  const handleTutorialComplete = () => {
    localStorage.setItem("snakeTutorialSeen", "true");
    setShowTutorial(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {gameState === "start" && showTutorial && (
        <TutorialScreen onContinue={handleTutorialComplete} />
      )}
      
      {gameState === "start" && !showTutorial && (
        <StartScreen onStart={(name) => {
          setUsername(name);
          setGameState("level");
        }} />
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
            dashReady={Date.now() > dashCooldownRef.current}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <MobileControls
            onDash={handleMobileDash}
            dashReady={Date.now() > dashCooldownRef.current}
          />
        </>
      )}

      {gameState === "end" && (
        <EndScreen
          message={endMessage}
          onRestart={handleRestart}
          score={score}
          rank={userRank}
          topScores={topScores}
        />
      )}
    </div>
  );
};
