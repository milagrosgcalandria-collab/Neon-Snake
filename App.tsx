
import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const CELL_COUNT = 20; // Reducido ligeramente para mejor ajuste en móviles
const INITIAL_SPEED = 140;
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
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [apples, setApples] = useState<Point[]>([]);
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [canvasWidth, setCanvasWidth] = useState(400);

  // Ajuste de tamaño responsivo
  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(window.innerWidth - 32, 400);
      setCanvasWidth(size);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cellSize = canvasWidth / CELL_COUNT;

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
      initialApples.push(generateApple([{ x: 10, y: 10 }], initialApples));
    }
    setApples(initialApples);
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, [generateApple]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setDirection(Direction.UP);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    const newApples: Point[] = [];
    for (let i = 0; i < APPLE_COUNT; i++) {
      newApples.push(generateApple([{ x: 10, y: 10 }], newApples));
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
    ctx.fillRect(0, 0, canvasWidth, canvasWidth);

    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvasWidth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(canvasWidth, i * cellSize); ctx.stroke();
    }

    apples.forEach(apple => {
      ctx.shadowBlur = 10; ctx.shadowColor = COLORS.APPLE; ctx.fillStyle = COLORS.APPLE;
      ctx.beginPath(); ctx.arc(apple.x * cellSize + cellSize/2, apple.y * cellSize + cellSize/2, cellSize/2.5, 0, Math.PI * 2); ctx.fill();
    });

    snake.forEach((part, i) => {
      ctx.shadowBlur = i === 0 ? 15 : 5;
      ctx.shadowColor = i === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      ctx.fillStyle = i === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      ctx.fillRect(part.x * cellSize + 1, part.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
    ctx.shadowBlur = 0;
  }, [snake, apples, canvasWidth, cellSize]);

  const ControlButton = ({ dir, label, icon }: { dir: Direction, label: string, icon: string }) => (
    <button 
      onPointerDown={(e) => {
        e.preventDefault();
        if (dir === Direction.UP && direction !== Direction.DOWN) setDirection(Direction.UP);
        if (dir === Direction.DOWN && direction !== Direction.UP) setDirection(Direction.DOWN);
        if (dir === Direction.LEFT && direction !== Direction.RIGHT) setDirection(Direction.LEFT);
        if (dir === Direction.RIGHT && direction !== Direction.LEFT) setDirection(Direction.RIGHT);
      }}
      className={`w-16 h-16 rounded-2xl bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center text-2xl active:bg-green-600 active:border-green-400 active:scale-95 transition-all shadow-lg touch-none select-none`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 max-w-md mx-auto">
      <div className="mb-4 flex justify-between w-full items-end px-2">
        <div>
          <h1 className="text-2xl font-black text-white italic leading-none">NEON<span className="text-green-500">SNAKE</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-Apple / Mobile</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right"><p className="text-[8px] text-slate-500 font-bold uppercase">Score</p><p className="text-lg font-black leading-none">{score}</p></div>
          <div className="text-right"><p className="text-[8px] text-slate-500 font-bold uppercase">Best</p><p className="text-lg font-black text-green-400 leading-none">{highScore}</p></div>
        </div>
      </div>

      <div className="relative border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 touch-none">
        <canvas ref={canvasRef} width={canvasWidth} height={canvasWidth} />
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50">
            {gameOver ? (
              <>
                <h2 className="text-4xl font-black text-red-500 mb-2">¡GAME OVER!</h2>
                <p className="text-slate-400 mb-6 font-medium">Lograste {score} puntos</p>
                <button onClick={resetGame} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-black shadow-xl shadow-green-900/20 active:scale-95 transition-all">REINTENTAR</button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-black text-white mb-6">PAUSA</h2>
                <button onClick={() => setIsPaused(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-black shadow-xl shadow-blue-900/20 active:scale-95 transition-all">CONTINUAR</button>
                <p className="text-slate-500 mt-6 text-[10px] font-bold uppercase tracking-widest">Toca los controles para moverte</p>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Controles Táctiles */}
      <div className="mt-8 flex flex-col items-center gap-2 select-none">
        <div className="flex justify-center w-full">
          <ControlButton dir={Direction.UP} label="Arriba" icon="↑" />
        </div>
        <div className="flex gap-16 justify-center w-full">
          <ControlButton dir={Direction.LEFT} label="Izquierda" icon="←" />
          <ControlButton dir={Direction.RIGHT} label="Derecha" icon="→" />
        </div>
        <div className="flex justify-center w-full relative">
          <ControlButton dir={Direction.DOWN} label="Abajo" icon="↓" />
          <button 
            onClick={() => setIsPaused(p => !p)}
            className="absolute right-[-40px] top-4 w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 active:bg-slate-700"
          >
            {isPaused ? "▶" : "||"}
          </button>
        </div>
      </div>
      
      <p className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-wider text-center">
        Diseñado para iPhone, Android y Tablets
      </p>
    </div>
  );
};

export default App;
