
export interface Point {
  x: number;
  y: number;
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export interface GameState {
  snake: Point[];
  apples: Point[];
  direction: Direction;
  score: number;
  highScore: number;
  isGameOver: boolean;
  isPaused: boolean;
}
