
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Point, Direction } from '../types';
import { GRID_SIZE, CELL_COUNT, CANVAS_SIZE, INITIAL_SPEED, APPLE_COUNT, COLORS } from '../constants';

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 12, y: 12 }, { x: 12, y: 13 }, { x: 12, y: 14 }]);
  const [apples, setApples] = useState<Point[]>([]);
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  // Generate random apple not on snake
  const generateApple = useCallback((currentSnake: Point[], currentApples: Point[]): Point => {
    let newApple: Point;
    while (true) {
      newApple = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT)
      };
      const onSnake = currentSnake.some(s => s.x === newApple.x && s.y === newApple.y);
      const onApple = currentApples.some(a => a.x === newApple.x && a.y === newApple.y);
      if (!onSnake && !onApple) break;
    }
    return newApple;
  }, []);

  // Initialize apples
  useEffect(() => {
    const initialApples: Point[] = [];
    for (let i = 0; i < APPLE_COUNT; i++) {
      initialApples.push(generateApple([{ x: 12, y: 12 }], initialApples));
    }
    setApples(initialApples);
    
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, [generateApple]);

  const resetGame = () => {
    setSnake([{ x: 12, y: 12 }, { x: 12, y: 13 }, { x: 12, y: 14 }]);
    setDirection(Direction.UP);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    
    const newApples: Point[] = [];
    for (let i = 0; i < APPLE_COUNT; i++) {
      newApples.push(generateApple([{ x: 12, y: 12 }], newApples));
    }
    setApples(newApples);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Wall Collision
      if (newHead.x < 0 || newHead.x >= CELL_COUNT || newHead.y < 0 || newHead.y >= CELL_COUNT) {
        setGameOver(true);
        return prevSnake;
      }

      // Self Collision
      if (prevSnake.some(part => part.x === newHead.x && part.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      
      // Apple Collision
      const eatenAppleIndex = apples.findIndex(a => a.x === newHead.x && a.y === newHead.y);
      if (eatenAppleIndex !== -1) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        
        // Replace eaten apple
        const updatedApples = [...apples];
        updatedApples[eatenAppleIndex] = generateApple(newSnake, updatedApples);
        setApples(updatedApples);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, apples, gameOver, isPaused, generateApple, highScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== Direction.DOWN) setDirection(Direction.UP); break;
        case 'ArrowDown': if (direction !== Direction.UP) setDirection(Direction.DOWN); break;
        case 'ArrowLeft': if (direction !== Direction.RIGHT) setDirection(Direction.LEFT); break;
        case 'ArrowRight': if (direction !== Direction.LEFT) setDirection(Direction.RIGHT); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [direction]);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid (Subtle)
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
      ctx.stroke();
    }

    // Apples
    apples.forEach(apple => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.APPLE;
      ctx.fillStyle = COLORS.APPLE;
      ctx.beginPath();
      ctx.arc(
        apple.x * GRID_SIZE + GRID_SIZE / 2,
        apple.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Snake
    snake.forEach((part, index) => {
      ctx.shadowBlur = index === 0 ? 20 : 5;
      ctx.shadowColor = index === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      ctx.fillStyle = index === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      
      const padding = 1;
      ctx.fillRect(
        part.x * GRID_SIZE + padding,
        part.y * GRID_SIZE + padding,
        GRID_SIZE - padding * 2,
        GRID_SIZE - padding * 2
      );
    });

    // Reset shadow
    ctx.shadowBlur = 0;

  }, [snake, apples]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950">
      <div className="mb-6 flex gap-8 items-center justify-between w-full max-w-[500px]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white">NEON <span className="text-green-500">SNAKE</span></h1>
          <p className="text-slate-400 text-sm font-medium">Multiple Apples Challenge</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Score</p>
            <p className="text-2xl font-black text-white">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Best</p>
            <p className="text-2xl font-black text-green-400">{highScore}</p>
          </div>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-slate-900">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block"
          />
          
          {(gameOver || isPaused) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
              {gameOver ? (
                <>
                  <h2 className="text-4xl font-black text-red-500 mb-2">GAME OVER</h2>
                  <p className="text-slate-300 mb-6">You crashed into the wall!</p>
                  <button
                    onClick={resetGame}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full shadow-lg shadow-green-900/40 transition-all transform hover:scale-105 active:scale-95"
                  >
                    PLAY AGAIN
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-black text-white mb-6">PAUSED</h2>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-900/40 transition-all transform hover:scale-105 active:scale-95"
                  >
                    CONTINUE
                  </button>
                  <p className="text-slate-400 mt-4 text-xs font-bold uppercase tracking-widest">Press SPACE to toggle</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[500px]">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2">Controls</p>
          <div className="flex gap-2">
            <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300">Arrows</span>
            <span className="text-slate-600 text-xs self-center">to Move</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300">Space</span>
            <span className="text-slate-600 text-xs self-center">to Pause</span>
          </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2">Objective</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Eat the <span className="text-red-400 font-bold">red apples</span> to grow. 
            Avoid hitting the <span className="text-slate-200 font-bold">walls</span> or yourself!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
