import { useEffect, useRef, useState } from "react";
import { StartScreen } from "./game/StartScreen";
import { LevelScreen } from "./game/LevelScreen";
import { GameHUD } from "./game/GameHUD";
import { EndScreen } from "./game/EndScreen";
import { MobileControls } from "./game/MobileControls";
import { GameState, Position, Direction, PowerUp, PowerUpType } from "./game/types";
import { supabase } from "@/integrations/supabase/client";

const BOX_SIZE = 20;
const WIN_SCORE = 10;
const DASH_SPEED = 3;
const DASH_COOLDOWN = 1000;
const POWERUP_SPAWN_INTERVAL = 8000;
const POWERUP_DURATION = 5000;

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
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activePowerUpRef = useRef<{ type: PowerUpType; endTime: number } | null>(null);
  const aiActivePowerUpRef = useRef<{ type: PowerUpType; endTime: number } | null>(null);
  const lastKeyPressRef = useRef<{ key: string; time: number } | null>(null);
  const dashCooldownRef = useRef<number>(0);
  const powerUpSpawnTimerRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

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
    powerUpsRef.current = [];
    activePowerUpRef.current = null;
    aiActivePowerUpRef.current = null;
    dashCooldownRef.current = 0;
    powerUpSpawnTimerRef.current = 0;

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
    setGameState("start");
    setScore(0);
    setAiScore(0);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const endGame = async (message: string) => {
    setEndMessage(message);
    setGameState("end");
    
    // Submit score to leaderboard
    const isWin = message.includes("WIN") && !message.includes("AI");
    const finalScore = isWin ? score : 0;
    
    if (username && finalScore > 0) {
      await supabase.from("leaderboard").insert({
        username,
        score: finalScore,
      });
      
      // Get user rank
      const { data } = await supabase
        .from("leaderboard")
        .select("score")
        .order("score", { ascending: false });
      
      if (data) {
        const rank = data.findIndex((entry) => entry.score <= finalScore) + 1;
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

  const spawnPowerUp = () => {
    const types: PowerUpType[] = ["speed", "invincible", "multiplier", "shrink", "freeze"];
    const type = types[Math.floor(Math.random() * types.length)];
    const maxX = Math.floor(canvasSize.width / BOX_SIZE);
    const maxY = Math.floor(canvasSize.height / BOX_SIZE);
    
    powerUpsRef.current.push({
      x: Math.floor(Math.random() * maxX) * BOX_SIZE,
      y: Math.floor(Math.random() * maxY) * BOX_SIZE,
      type,
      duration: POWERUP_DURATION,
    });
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

    // Draw power-ups
    powerUpsRef.current.forEach((powerUp) => {
      const colors = {
        speed: "#ffff00",
        invincible: "#ff00ff",
        multiplier: "#00ffff",
        shrink: "#ff8800",
        freeze: "#0088ff",
      };
      
      ctx.shadowBlur = 25;
      ctx.shadowColor = colors[powerUp.type];
      ctx.fillStyle = colors[powerUp.type];
      ctx.fillRect(powerUp.x + 1, powerUp.y + 1, BOX_SIZE - 2, BOX_SIZE - 2);
      ctx.shadowBlur = 0;
    });

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

      // Update power-up spawn timer
      powerUpSpawnTimerRef.current += deltaTime;
      if (powerUpSpawnTimerRef.current >= POWERUP_SPAWN_INTERVAL) {
        spawnPowerUp();
        powerUpSpawnTimerRef.current = 0;
      }

      // Clear expired power-ups
      const now = Date.now();
      if (activePowerUpRef.current && now > activePowerUpRef.current.endTime) {
        activePowerUpRef.current = null;
      }
      if (aiActivePowerUpRef.current && now > aiActivePowerUpRef.current.endTime) {
        aiActivePowerUpRef.current = null;
      }

      const currentSpeed = activePowerUpRef.current?.type === "speed" ? speed * 0.7 : speed;

      if (deltaTime >= currentSpeed) {
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
          endGame("💀 WALL COLLISION - AI WINS!");
          return;
        }

        // Check player self collision
        if (snakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          endGame("💀 SELF COLLISION - AI WINS!");
          return;
        }

        // Check player collision with AI (only if not invincible)
        if (!activePowerUpRef.current || activePowerUpRef.current.type !== "invincible") {
          if (aiSnakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
            endGame("💀 HIT AI SNAKE - AI WINS!");
            return;
          }
        }

        const newSnake = [newHead, ...snakeRef.current];
        
        // Check if player ate food
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          setScore((prev) => {
            const multiplier = activePowerUpRef.current?.type === "multiplier" ? 2 : 1;
            const newScore = prev + multiplier;
            if (newScore >= WIN_SCORE) {
              endGame("🎉 YOU WIN!");
            }
            return newScore;
          });
          spawnFood();
        } else {
          newSnake.pop();
        }

        // Check power-up collection
        const collectedPowerUpIndex = powerUpsRef.current.findIndex(
          (p) => p.x === newHead.x && p.y === newHead.y
        );
        if (collectedPowerUpIndex >= 0) {
          const powerUp = powerUpsRef.current[collectedPowerUpIndex];
          activePowerUpRef.current = {
            type: powerUp.type,
            endTime: Date.now() + powerUp.duration,
          };
          powerUpsRef.current.splice(collectedPowerUpIndex, 1);

          // Apply shrink effect to AI
          if (powerUp.type === "shrink" && aiSnakeRef.current.length > 3) {
            aiSnakeRef.current = aiSnakeRef.current.slice(0, Math.ceil(aiSnakeRef.current.length / 2));
          }

          // Apply freeze effect to AI
          if (powerUp.type === "freeze") {
            aiActivePowerUpRef.current = {
              type: "freeze",
              endTime: Date.now() + powerUp.duration,
            };
          }
        }

        snakeRef.current = newSnake;

        // Update AI snake (skip if frozen)
        if (!aiActivePowerUpRef.current || aiActivePowerUpRef.current.type !== "freeze") {
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
            endGame("🎉 AI HIT WALL - YOU WIN!");
            return;
          }

          // Check AI self collision
          if (aiSnakeRef.current.some((seg) => seg.x === newAiHead.x && seg.y === newAiHead.y)) {
            endGame("🎉 AI SELF COLLISION - YOU WIN!");
            return;
          }

          // Check AI collision with player
          if (snakeRef.current.some((seg) => seg.x === newAiHead.x && seg.y === newAiHead.y)) {
            endGame("🎉 AI HIT YOUR SNAKE - YOU WIN!");
            return;
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
        }

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

  // Handle canvas resizing
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

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {gameState === "start" && (
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
            activePowerUp={activePowerUpRef.current?.type}
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
