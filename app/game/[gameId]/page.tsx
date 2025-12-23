'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import GameBoard from '@/components/GameBoard';
import { Game } from '@/lib/types';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<Game | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Get or create player ID
    let id = localStorage.getItem('playerId');
    if (!id) {
      id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('playerId', id);
    }
    setPlayerId(id);

    // Initialize socket connection
    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    const socketInstance = io(socketUrl);
    setSocket(socketInstance);

    // Load game state
    fetch(`/api/games?id=${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setGame(data);
          socketInstance.emit('join-game', gameId);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load game');
        setLoading(false);
      });

    // Listen for game updates
    socketInstance.on('game-updated', (updatedGame: Game) => {
      setGame(updatedGame);
    });

    socketInstance.on('game-state', (gameState: Game) => {
      setGame(gameState);
    });

    socketInstance.on('player-joined', (data: { playerId?: string; game?: Game }) => {
      // Refresh game state when a player joins
      if (data.game) {
        setGame(data.game);
      } else {
        // Fetch latest game state
        fetch(`/api/games?id=${gameId}`)
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              setGame(data);
            }
          })
          .catch(err => console.error('Failed to refresh game:', err));
      }
    });

    socketInstance.on('error', (err: { message: string }) => {
      setError(err.message);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [gameId]);

  const handleMove = async (position: number) => {
    if (!game || !socket) return;

    try {
      // For AI games, use API endpoint
      if (game.mode === 'ai') {
        const response = await fetch(`/api/games/${gameId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position, playerId }),
        });

        if (response.ok) {
          const updatedGame = await response.json();
          setGame(updatedGame);

          // If it's now AI's turn, trigger AI move
          if (updatedGame.status === 'active' && updatedGame.currentPlayer === 'O') {
            setTimeout(async () => {
              const aiResponse = await fetch(`/api/games/${gameId}/ai-move`, {
                method: 'POST',
              });
              if (aiResponse.ok) {
                const aiGame = await aiResponse.json();
                setGame(aiGame);
              }
            }, 500);
          }
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to make move');
        }
      } else {
        // For multiplayer, use socket
        socket.emit('make-move', { gameId, position, playerId });
      }
    } catch (err) {
      setError('Failed to make move');
    }
  };

  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Home
        </button>

        <div className="bg-gray-900 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Tic-Tac-Toe</h1>
          
          {game.mode === 'multiplayer' && game.status === 'waiting' && (
            <div className="mb-4 p-4 bg-blue-900 rounded text-center">
              <p className="text-blue-200 mb-2">Share this game ID with your opponent:</p>
              <button
                onClick={copyGameId}
                className="text-white font-mono text-lg font-bold hover:text-blue-300 transition-colors cursor-pointer relative bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded inline-block"
                title="Click to copy"
              >
                {gameId}
                {copied && (
                  <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap shadow-lg z-10">
                    ✓ Copied!
                  </span>
                )}
              </button>
              <p className="text-blue-300 text-sm mt-2">Or share this URL: {typeof window !== 'undefined' ? window.location.href : ''}</p>
            </div>
          )}
          
          <GameBoard
            game={game}
            playerId={playerId}
            onMove={handleMove}
            disabled={game.status !== 'active'}
          />

          {game.status === 'finished' || game.status === 'draw' ? (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                New Game
              </button>
            </div>
          ) : null}

          {error && (
            <div className="mt-4 text-red-500 text-center">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

