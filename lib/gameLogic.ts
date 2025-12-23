import { Player, Game } from './types';

export function createEmptyBoard(): Player[] {
  return Array(9).fill(null);
}

export function checkWinner(board: Player[]): Player {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

export function isBoardFull(board: Player[]): boolean {
  return board.every(cell => cell !== null);
}

export function isValidMove(board: Player[], position: number): boolean {
  return position >= 0 && position < 9 && board[position] === null;
}

export function makeMove(board: Player[], position: number, player: 'X' | 'O'): Player[] {
  if (!isValidMove(board, position)) {
    throw new Error('Invalid move');
  }
  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
}

export function getGameStatus(game: Game): 'waiting' | 'active' | 'finished' | 'draw' {
  if (game.status === 'waiting') return 'waiting';
  
  const winner = checkWinner(game.board);
  if (winner) return 'finished';
  if (isBoardFull(game.board)) return 'draw';
  
  return 'active';
}

export function getBestMove(board: Player[], aiPlayer: 'X' | 'O'): number {
  const opponent = aiPlayer === 'X' ? 'O' : 'X';
  
  // Check if AI can win
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const testBoard = [...board];
      testBoard[i] = aiPlayer;
      if (checkWinner(testBoard) === aiPlayer) {
        return i;
      }
    }
  }
  
  // Check if opponent can win (block them)
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const testBoard = [...board];
      testBoard[i] = opponent;
      if (checkWinner(testBoard) === opponent) {
        return i;
      }
    }
  }
  
  // Take center if available
  if (board[4] === null) {
    return 4;
  }
  
  // Take a corner
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(i => board[i] === null);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }
  
  // Take any available position
  const available = board.map((cell, index) => cell === null ? index : -1).filter(i => i !== -1);
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  
  return -1;
}

