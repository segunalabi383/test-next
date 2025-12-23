export type Player = 'X' | 'O' | null;
export type GameMode = 'multiplayer' | 'ai';
export type GameStatus = 'waiting' | 'active' | 'finished' | 'draw';

export interface GameMove {
  position: number;
  player: 'X' | 'O';
  timestamp: number;
}

export interface Game {
  id: string;
  mode: GameMode;
  status: GameStatus;
  board: Player[];
  currentPlayer: 'X' | 'O';
  playerX?: string; // Player ID or session ID
  playerO?: string; // Player ID or session ID
  winner: Player;
  moves: GameMove[];
  createdAt: number;
  updatedAt: number;
  finishedAt?: number;
}

export interface GameHistory {
  gameId: string;
  mode: GameMode;
  status: GameStatus;
  winner: Player;
  moves: number;
  createdAt: number;
  finishedAt?: number;
}

