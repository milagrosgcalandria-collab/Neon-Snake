
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Constantes integradas para evitar archivos vacíos o errores de ruta
const GRID_SIZE = 20;
const CELL_COUNT = 25;
const CANVAS_SIZE = GRID_SIZE * CELL_COUNT;
const INITIAL_SPEED = 120;
const APPLE_COUNT = 3;

const COLORS = {
  SNAKE_HEAD: '#22c55e',
  SNAKE_BODY: '#4ade80',
  APPLE: '#ef4444',
  GRID: '#1e293b'
};

enum Direction {
  UP = 'UP', DOWN = 'DOWN', LEFT = 'LEFT', RIGHT = 'RIGHT'
}

interface Point {
  x: number; y: number;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 12, y: 12 }, { x: 12, y: 13 }, { x: 12, y: 14 }]);
  const [apples, setApples] = useState<Point[]>([]);
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

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
      if (direction === Direction.UP) newHead.y -= 1;
      if (direction === Direction.DOWN) newHead.y += 1;
      if (direction === Direction.LEFT) newHead.x -= 1;
      if (direction === Direction.RIGHT) newHead.x += 1;

      if (newHead.x < 0 || newHead.x >= CELL_COUNT || newHead.y < 0 || newHead.y >= CELL_COUNT ||
          prevSnake.some(part => part.x === newHead.x && part.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      const eatenAppleIndex = apples.findIndex(a => a.x === newHead.x && a.y === newHead.y);

      if (eatenAppleIndex !== -1) {
        setScore(s => {
          const ns = s + 10;
          if (ns > highScore) {
            setHighScore(ns);
            localStorage.setItem('snakeHighScore', ns.toString());
          }
          return ns;
        });
        const updatedApples = [...apples];
        updatedApples[eatenAppleIndex] = generateApple(newSnake, updatedApples);
        setApples(updatedApples);
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [direction, apples, gameOver, isPaused, generateApple, highScore]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && direction !== Direction.DOWN) setDirection(Direction.UP);
      if (e.key === 'ArrowDown' && direction !== Direction.UP) setDirection(Direction.DOWN);
      if (e.key === 'ArrowLeft' && direction !== Direction.RIGHT) setDirection(Direction.LEFT);
      if (e.key === 'ArrowRight' && direction !== Direction.LEFT) setDirection(Direction.RIGHT);
      if (e.key === ' ') setIsPaused(p => !p);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE); ctx.stroke();
    }

    apples.forEach(apple => {
      ctx.shadowBlur = 15; ctx.shadowColor = COLORS.APPLE; ctx.fillStyle = COLORS.APPLE;
      ctx.beginPath(); ctx.arc(apple.x * GRID_SIZE + 10, apple.y * GRID_SIZE + 10, 8, 0, Math.PI * 2); ctx.fill();
    });

    snake.forEach((part, i) => {
      ctx.shadowBlur = i === 0 ? 15 : 5;
      ctx.shadowColor = i === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      ctx.fillStyle = i === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      ctx.fillRect(part.x * GRID_SIZE + 1, part.y * GRID_SIZE + 1, 18, 18);
    });
    ctx.shadowBlur = 0;
  }, [snake, apples]);

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex justify-between w-full max-w-[500px] items-end">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">NEON<span className="text-green-500">SNAKE</span></h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Multi-Apple Mode</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right"><p className="text-[10px] text-slate-500 font-bold">SCORE</p><p className="text-xl font-black">{score}</p></div>
          <div className="text-right"><p className="text-[10px] text-slate-500 font-bold">BEST</p><p className="text-xl font-black text-green-400">{highScore}</p></div>
        </div>
      </div>

      <div className="relative border-4 border-slate-800 rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] bg-slate-900">
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            {gameOver ? (
              <>
                <h2 className="text-5xl font-black text-red-500 mb-2">CRASH!</h2>
                <p className="text-slate-400 mb-6 font-medium">Puntuación final: {score}</p>
                <button onClick={resetGame} className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-full font-black transition-all hover:scale-105">REINTENTAR</button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-black text-white mb-6 tracking-widest">PAUSA</h2>
                <button onClick={() => setIsPaused(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-black transition-all hover:scale-105">CONTINUAR</button>
                <p className="text-slate-500 mt-4 text-xs font-bold uppercase">Pulsa ESPACIO para alternar</p>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-6 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Usa las flechas para moverte • Espacio para pausar</div>
    </div>
  );
};

export default App;
