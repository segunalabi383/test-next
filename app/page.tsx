'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createGame = async (mode: 'multiplayer' | 'ai') => {
    setLoading(true);
    setError('');

    try {
      let playerId = localStorage.getItem('playerId');
      if (!playerId) {
        playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('playerId', playerId);
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, playerId }),
      });

      if (response.ok) {
        const game = await response.json();
        router.push(`/game/${game.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create game');
      }
    } catch (err) {
      setError('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-white">
            Tic-Tac-Toe
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Choose your game mode
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => createGame('ai')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-6 px-8 rounded-lg text-xl transition-colors"
            >
              {loading ? 'Creating...' : 'Play vs AI'}
            </button>

            <button
              onClick={() => createGame('multiplayer')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold py-6 px-8 rounded-lg text-xl transition-colors"
            >
              {loading ? 'Creating...' : 'Multiplayer'}
            </button>
          </div>

          <div className="text-center space-x-4">
            <Link
              href="/join"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Join Game
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="/history"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              View Game History
            </Link>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900 text-red-200 rounded text-center">
              {error}
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">How to Play</h2>
            <ul className="space-y-2 text-gray-400">
              <li>• Click a cell to make your move</li>
              <li>• Get three in a row (horizontal, vertical, or diagonal) to win</li>
              <li>• In multiplayer mode, share the game URL with your opponent</li>
              <li>• Game state persists across browser refreshes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
