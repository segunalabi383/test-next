'use client';

import { Game } from '@/lib/types';

interface GameBoardProps {
  game: Game;
  playerId: string;
  onMove: (position: number) => void;
  disabled?: boolean;
}

export default function GameBoard({ game, playerId, onMove, disabled }: GameBoardProps) {
  const isPlayerX = game.playerX === playerId;
  const isPlayerO = game.playerO === playerId || (game.mode === 'ai' && playerId === 'ai');
  const isMyTurn = 
    (game.currentPlayer === 'X' && isPlayerX) || 
    (game.currentPlayer === 'O' && isPlayerO);
  const canMove = game.status === 'active' && isMyTurn && !disabled;

  const handleCellClick = (position: number) => {
    if (canMove && game.board[position] === null) {
      onMove(position);
    }
  };

  const getStatusMessage = () => {
    if (game.status === 'waiting') {
      return 'Waiting for opponent...';
    }
    if (game.status === 'finished') {
      if (game.winner === 'X') return isPlayerX ? 'You won!' : 'Player X won!';
      if (game.winner === 'O') return isPlayerO ? 'You won!' : 'Player O won!';
    }
    if (game.status === 'draw') {
      return "It's a draw!";
    }
    if (canMove) {
      return 'Your turn!';
    }
    return "Opponent's turn...";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold">{getStatusMessage()}</div>
      
      <div className="grid grid-cols-3 gap-2 bg-gray-800 p-4 rounded-lg">
        {game.board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={!canMove || cell !== null}
            className={`
              w-24 h-24 text-4xl font-bold rounded
              ${cell === 'X' ? 'bg-blue-500 text-white' : ''}
              ${cell === 'O' ? 'bg-red-500 text-white' : ''}
              ${cell === null && canMove ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' : ''}
              ${cell === null && !canMove ? 'bg-gray-800 cursor-not-allowed' : ''}
              ${game.status !== 'active' ? 'cursor-not-allowed' : ''}
              transition-colors
            `}
          >
            {cell || ''}
          </button>
        ))}
      </div>

      <div className="text-sm text-gray-400">
        {game.mode === 'ai' ? 'Playing against AI' : 'Multiplayer'}
      </div>
    </div>
  );
}

