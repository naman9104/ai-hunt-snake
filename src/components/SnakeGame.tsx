import { useEffect, useRef, useState } from "react";
import { StartScreen } from "./game/StartScreen";
import { TutorialScreen } from "./game/TutorialScreen";
import { LevelScreen, DifficultyLevel } from "./game/LevelScreen";
import { GameHUD } from "./game/GameHUD";
import { EndScreen } from "./game/EndScreen";
import { MobileControls } from "./game/MobileControls";
import { SettingsModal, GraphicsLevel } from "./game/SettingsModal";
import { GameState, Position, Direction, Particle, SNAKE_SKINS } from "./game/types";
import { supabase } from "@/integrations/supabase/client";
import { sounds, backgroundMusic } from "./game/sounds";

const BOX_SIZE = 20;
const WIN_SCORE = 10;
const DASH_SPEED = 2;
const DASH_COOLDOWN = 1000;
const MIN_SNAKE_LENGTH = 3;
const SHAKE_DURATION = 300;
const SHAKE_INTENSITY = 8;

export const SnakeGame = () => {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [speed, setSpeed] = useState(150);
  const [isPaused, setIsPaused] = useState(false);
  const [endMessage, setEndMessage] = useState("");
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("snakeUsername") || "";
  });
  const [userRank, setUserRank] = useState<number | null>(null);
  const [topScores, setTopScores] = useState<Array<{ username: string; score: number }>>([]);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("snakeTutorialSeen");
  });
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(() => {
    return localStorage.getItem("snakeSkin") || "neon-green";
  });
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0, active: false });
  const isDashingRef = useRef(false);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("snakeVolume");
    return saved ? parseFloat(saved) : 0.5;
  });
  const [graphicsLevel, setGraphicsLevel] = useState<GraphicsLevel>(() => {
    return (localStorage.getItem("snakeGraphics") as GraphicsLevel) || "high";
  });
  const [targetFps, setTargetFps] = useState(() => {
    const saved = localStorage.getItem("snakeFps");
    return saved ? parseInt(saved) : 60;
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
  
  // Trail history for visual effects
  const playerTrailRef = useRef<Position[]>([]);
  const aiTrailRef = useRef<Position[]>([]);
  const TRAIL_LENGTH = 15;
  
  // Particle system
  const particlesRef = useRef<Particle[]>([]);

  const handleToggleMusic = () => {
    const isPlaying = backgroundMusic.toggle();
    setMusicPlaying(isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem("snakeVolume", newVolume.toString());
    backgroundMusic.setVolume(newVolume);
  };

  const handleGraphicsChange = (level: GraphicsLevel) => {
    setGraphicsLevel(level);
    localStorage.setItem("snakeGraphics", level);
  };

  const handleFpsChange = (fps: number) => {
    setTargetFps(fps);
    localStorage.setItem("snakeFps", fps.toString());
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    setIsPaused(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x: x + BOX_SIZE / 2,
        y: y + BOX_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 4 + Math.random() * 4,
      });
    }
  };

  const updateParticles = () => {
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= 0.03;
      return p.life > 0;
    });
  };

  const triggerScreenShake = () => {
    setScreenShake({ x: 0, y: 0, active: true });
    const shakeStart = Date.now();
    
    const shake = () => {
      const elapsed = Date.now() - shakeStart;
      if (elapsed < SHAKE_DURATION) {
        const intensity = SHAKE_INTENSITY * (1 - elapsed / SHAKE_DURATION);
        setScreenShake({
          x: (Math.random() - 0.5) * 2 * intensity,
          y: (Math.random() - 0.5) * 2 * intensity,
          active: true,
        });
        requestAnimationFrame(shake);
      } else {
        setScreenShake({ x: 0, y: 0, active: false });
      }
    };
    shake();
  };

  const canPhaseThrough = () => {
    return isDashingRef.current && (difficulty === "easy" || difficulty === "medium");
  };

  const getPlayerSkin = () => {
    return SNAKE_SKINS.find((s) => s.id === selectedSkin) || SNAKE_SKINS[0];
  };

  // Fetch leaderboard on mount
  // Initialize volume on mount
  useEffect(() => {
    backgroundMusic.setVolume(volume);
  }, []);

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

  const handleStartGame = (selectedSpeed: number, selectedDifficulty: DifficultyLevel) => {
    setSpeed(selectedSpeed);
    setDifficulty(selectedDifficulty);
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
    playerTrailRef.current = [];
    aiTrailRef.current = [];

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
    backgroundMusic.stop();
    setMusicPlaying(false);
    
    if (isWin) {
      sounds.win();
    } else {
      sounds.lose();
    }
    
    // Submit score to leaderboard (only if win and score > 0)
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
    }
    
    // Always refresh top 10 scores
    const { data: topData } = await supabase
      .from("leaderboard")
      .select("username, score")
      .order("score", { ascending: false })
      .limit(10);
    
    if (topData) {
      setTopScores(topData);
    }
  };

  // AI pathfinding helper - check if a move is safe
  const isSafeMove = (pos: Position): boolean => {
    // Check wall collision
    if (pos.x < 0 || pos.x >= canvasSize.width || pos.y < 0 || pos.y >= canvasSize.height) {
      return false;
    }
    // Check self collision
    if (aiSnakeRef.current.some((seg) => seg.x === pos.x && seg.y === pos.y)) {
      return false;
    }
    // Check player collision
    if (snakeRef.current.some((seg) => seg.x === pos.x && seg.y === pos.y)) {
      return false;
    }
    return true;
  };

  // Get possible next positions for AI
  const getAiNextPositions = (head: Position): Record<Direction, Position> => {
    return {
      LEFT: { x: head.x - BOX_SIZE, y: head.y },
      RIGHT: { x: head.x + BOX_SIZE, y: head.y },
      UP: { x: head.x, y: head.y - BOX_SIZE },
      DOWN: { x: head.x, y: head.y + BOX_SIZE },
    };
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

    // Get player skin
    const playerSkin = getPlayerSkin();
    
    // Convert hex to RGB for alpha support
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 255, b: 65 };
    };
    
    const skinRgb = hexToRgb(playerSkin.headColor);

    // Draw player trail (only on medium/high graphics)
    if (graphicsLevel !== "low") {
      playerTrailRef.current.forEach((pos, index) => {
        const alpha = (1 - index / TRAIL_LENGTH) * 0.3;
        const size = BOX_SIZE * (1 - index / TRAIL_LENGTH) * 0.6;
        ctx.fillStyle = `rgba(${skinRgb.r}, ${skinRgb.g}, ${skinRgb.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(
          pos.x + BOX_SIZE / 2,
          pos.y + BOX_SIZE / 2,
          size / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Draw AI trail
      aiTrailRef.current.forEach((pos, index) => {
        const alpha = (1 - index / TRAIL_LENGTH) * 0.3;
        const size = BOX_SIZE * (1 - index / TRAIL_LENGTH) * 0.6;
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(
          pos.x + BOX_SIZE / 2,
          pos.y + BOX_SIZE / 2,
          size / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    }

    // Draw particles (only on high graphics, reduced on medium)
    if (graphicsLevel !== "low") {
      const particlesToDraw = graphicsLevel === "high" 
        ? particlesRef.current 
        : particlesRef.current.filter((_, i) => i % 2 === 0);
      
      particlesToDraw.forEach((p) => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // Draw food with pulsing effect
    const pulse = Math.sin(Date.now() / 200) * 3 + 3;
    ctx.shadowBlur = 20 + pulse;
    ctx.shadowColor = "#ff006e";
    ctx.fillStyle = "#ff006e";
    ctx.fillRect(foodRef.current.x + 2, foodRef.current.y + 2, BOX_SIZE - 4, BOX_SIZE - 4);
    ctx.shadowBlur = 0;

    // Draw player snake with selected skin
    snakeRef.current.forEach((segment, index) => {
      const isHead = index === 0;
      const alpha = 1 - (index / snakeRef.current.length) * 0.5;
      
      if (isHead) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = playerSkin.glowColor;
        ctx.fillStyle = playerSkin.headColor;
        ctx.fillRect(segment.x + 1, segment.y + 1, BOX_SIZE - 2, BOX_SIZE - 2);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = playerSkin.glowColor;
        ctx.fillStyle = `rgba(${skinRgb.r}, ${skinRgb.g}, ${skinRgb.b}, ${alpha})`;
        ctx.fillRect(segment.x + 3, segment.y + 3, BOX_SIZE - 6, BOX_SIZE - 6);
        ctx.shadowBlur = 0;
      }
    });

    // Draw AI snake
    aiSnakeRef.current.forEach((segment, index) => {
      const isHead = index === 0;
      const alpha = 1 - (index / aiSnakeRef.current.length) * 0.5;
      
      if (isHead) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#00f0ff";
        ctx.fillRect(segment.x + 1, segment.y + 1, BOX_SIZE - 2, BOX_SIZE - 2);
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
          triggerScreenShake();
          spawnParticles(newHead.x, newHead.y, getPlayerSkin().headColor, 20);
          endGame("💀 WALL COLLISION!", false);
          return;
        }

        // Check player self collision
        if (snakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          sounds.collision();
          triggerScreenShake();
          spawnParticles(newHead.x, newHead.y, getPlayerSkin().headColor, 20);
          endGame("💀 SELF COLLISION!", false);
          return;
        }

        // Check player collision with AI (phase through if dashing in easy/medium)
        const hitAi = aiSnakeRef.current.some((seg) => seg.x === newHead.x && seg.y === newHead.y);
        if (hitAi && !canPhaseThrough()) {
          sounds.collision();
          triggerScreenShake();
          spawnParticles(newHead.x, newHead.y, getPlayerSkin().headColor, 20);
          endGame("💀 HIT AI SNAKE!", false);
          return;
        }

        const newSnake = [newHead, ...snakeRef.current];
        
        // Check if player ate food
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          sounds.eat();
          spawnParticles(foodRef.current.x, foodRef.current.y, "#ff006e", 15);
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
        
        // Update player trail
        playerTrailRef.current.unshift({ ...snakeRef.current[snakeRef.current.length - 1] });
        if (playerTrailRef.current.length > TRAIL_LENGTH) {
          playerTrailRef.current.pop();
        }

        // Update AI snake with smarter pathfinding
        const aiHead = aiSnakeRef.current[0];
        const food = foodRef.current;
        const nextPositions = getAiNextPositions(aiHead);

        const opposites: Record<Direction, Direction> = {
          LEFT: "RIGHT",
          RIGHT: "LEFT",
          UP: "DOWN",
          DOWN: "UP",
        };

        // Calculate direction preferences based on food position
        const dx = food.x - aiHead.x;
        const dy = food.y - aiHead.y;

        // Priority: try to move towards food if safe, otherwise find any safe direction
        const directions: Direction[] = [];
        
        // Add preferred directions (towards food)
        if (Math.abs(dx) > Math.abs(dy)) {
          directions.push(dx > 0 ? "RIGHT" : "LEFT");
          directions.push(dy > 0 ? "DOWN" : "UP");
          directions.push(dy > 0 ? "UP" : "DOWN");
          directions.push(dx > 0 ? "LEFT" : "RIGHT");
        } else {
          directions.push(dy > 0 ? "DOWN" : "UP");
          directions.push(dx > 0 ? "RIGHT" : "LEFT");
          directions.push(dx > 0 ? "LEFT" : "RIGHT");
          directions.push(dy > 0 ? "UP" : "DOWN");
        }

        // Find the best safe direction
        let newAiDir = aiDirRef.current;
        for (const dir of directions) {
          // Don't go backwards
          if (dir === opposites[aiDirRef.current]) continue;
          
          if (isSafeMove(nextPositions[dir])) {
            newAiDir = dir;
            break;
          }
        }

        // If no preferred direction is safe, try any safe direction
        if (!isSafeMove(nextPositions[newAiDir])) {
          const allDirs: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
          for (const dir of allDirs) {
            if (dir !== opposites[aiDirRef.current] && isSafeMove(nextPositions[dir])) {
              newAiDir = dir;
              break;
            }
          }
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
          triggerScreenShake();
          spawnParticles(newAiHead.x, newAiHead.y, "#00f0ff", 20);
          endGame("🎉 AI HIT WALL - YOU WIN!", true);
          return;
        }

        // Check AI self collision
        if (aiSnakeRef.current.some((seg) => seg.x === newAiHead.x && seg.y === newAiHead.y)) {
          triggerScreenShake();
          spawnParticles(newAiHead.x, newAiHead.y, "#00f0ff", 20);
          endGame("🎉 AI SELF COLLISION - YOU WIN!", true);
          return;
        }

        // Check AI collision with player
        if (snakeRef.current.some((seg) => seg.x === newAiHead.x && seg.y === newAiHead.y)) {
          triggerScreenShake();
          spawnParticles(newAiHead.x, newAiHead.y, "#00f0ff", 20);
          endGame("🎉 AI HIT YOUR SNAKE - YOU WIN!", true);
          return;
        }

        const newAiSnake = [newAiHead, ...aiSnakeRef.current];

        // Check if AI ate food
        if (newAiHead.x === foodRef.current.x && newAiHead.y === foodRef.current.y) {
          spawnParticles(foodRef.current.x, foodRef.current.y, "#ff006e", 15);
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
        
        // Update AI trail
        aiTrailRef.current.unshift({ ...aiSnakeRef.current[aiSnakeRef.current.length - 1] });
        if (aiTrailRef.current.length > TRAIL_LENGTH) {
          aiTrailRef.current.pop();
        }

        updateParticles();
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
  }, [gameState, speed, isPaused, canvasSize]);

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
        case "a":
        case "A":
          newDir = "LEFT";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newDir = "RIGHT";
          break;
        case "ArrowUp":
        case "w":
        case "W":
          newDir = "UP";
          break;
        case "ArrowDown":
        case "s":
        case "S":
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
          now > dashCooldownRef.current &&
          snakeRef.current.length > MIN_SNAKE_LENGTH // Only dash if snake is long enough
        ) {
          // Execute dash - only remove segments if snake is long enough
          sounds.dash();
          isDashingRef.current = true;
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
          
          // Check if dash position has food - collect it
          if (dashHead.x === foodRef.current.x && dashHead.y === foodRef.current.y) {
            sounds.eat();
            spawnParticles(foodRef.current.x, foodRef.current.y, "#ff006e", 15);
            setScore((prev) => {
              const newScore = prev + 1;
              if (newScore >= WIN_SCORE) {
                endGame("🎉 YOU WIN!", true);
              }
              return newScore;
            });
            spawnFood();
          }
          
          // Keep minimum snake length
          const segmentsToRemove = Math.min(DASH_SPEED, snakeRef.current.length - MIN_SNAKE_LENGTH);
          if (segmentsToRemove > 0) {
            snakeRef.current = [dashHead, ...snakeRef.current.slice(0, -segmentsToRemove)];
          } else {
            snakeRef.current = [dashHead, ...snakeRef.current];
          }
          
          dashCooldownRef.current = now + DASH_COOLDOWN;
          lastKeyPressRef.current = null;
          
          // Reset dashing flag after a short delay
          setTimeout(() => {
            isDashingRef.current = false;
          }, 100);
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
    if (snakeRef.current.length <= MIN_SNAKE_LENGTH) return; // Don't dash if too short
    
    const now = Date.now();
    
    if (now > dashCooldownRef.current) {
      sounds.dash();
      isDashingRef.current = true;
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
      
      // Check if dash position has food - collect it
      if (dashHead.x === foodRef.current.x && dashHead.y === foodRef.current.y) {
        sounds.eat();
        spawnParticles(foodRef.current.x, foodRef.current.y, "#ff006e", 15);
        setScore((prev) => {
          const newScore = prev + 1;
          if (newScore >= WIN_SCORE) {
            endGame("🎉 YOU WIN!", true);
          }
          return newScore;
        });
        spawnFood();
      }
      
      // Keep minimum snake length
      const segmentsToRemove = Math.min(DASH_SPEED, snakeRef.current.length - MIN_SNAKE_LENGTH);
      if (segmentsToRemove > 0) {
        snakeRef.current = [dashHead, ...snakeRef.current.slice(0, -segmentsToRemove)];
      } else {
        snakeRef.current = [dashHead, ...snakeRef.current];
      }
      
      dashCooldownRef.current = now + DASH_COOLDOWN;
      
      // Reset dashing flag after a short delay
      setTimeout(() => {
        isDashingRef.current = false;
      }, 100);
    }
  };

  const handleTutorialComplete = () => {
    localStorage.setItem("snakeTutorialSeen", "true");
    setShowTutorial(false);
  };

  const handleUsernameSet = (name: string, skinId: string) => {
    localStorage.setItem("snakeUsername", name);
    localStorage.setItem("snakeSkin", skinId);
    setUsername(name);
    setSelectedSkin(skinId);
    setGameState("level");
  };

  const handleSkinChange = (skinId: string) => {
    setSelectedSkin(skinId);
    localStorage.setItem("snakeSkin", skinId);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {gameState === "start" && showTutorial && (
        <TutorialScreen onContinue={handleTutorialComplete} />
      )}
      
      {gameState === "start" && !showTutorial && (
        <StartScreen 
          onStart={handleUsernameSet} 
          selectedSkin={selectedSkin}
          onSelectSkin={handleSkinChange}
        />
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
            dashReady={Date.now() > dashCooldownRef.current && snakeRef.current.length > MIN_SNAKE_LENGTH}
            musicPlaying={musicPlaying}
            onToggleMusic={handleToggleMusic}
            onOpenSettings={handleOpenSettings}
          />
          <SettingsModal
            isOpen={showSettings}
            onClose={handleCloseSettings}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            graphicsLevel={graphicsLevel}
            onGraphicsChange={handleGraphicsChange}
            targetFps={targetFps}
            onFpsChange={handleFpsChange}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transition-transform"
            style={{
              transform: screenShake.active 
                ? `translate(${screenShake.x}px, ${screenShake.y}px)` 
                : 'none'
            }}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <MobileControls
            onDash={handleMobileDash}
            dashReady={Date.now() > dashCooldownRef.current && snakeRef.current.length > MIN_SNAKE_LENGTH}
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
