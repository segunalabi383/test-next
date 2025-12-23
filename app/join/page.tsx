'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Game } from '@/lib/types';

export default function JoinPage() {
  const router = useRouter();
  const [gameId, setGameId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAvailableGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const allGames: Game[] = await response.json();
        // Filter for multiplayer games that are waiting for players
        const waitingGames = allGames.filter(
          game => game.mode === 'multiplayer' && game.status === 'waiting'
        );
        setAvailableGames(waitingGames);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoadingGames(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAvailableGames();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchAvailableGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAvailableGames();
  };

  const handleJoinById = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinGame(gameId);
  };

  const joinGame = async (targetGameId: string) => {
    setLoading(true);
    setError('');

    try {
      let playerId = localStorage.getItem('playerId');
      if (!playerId) {
        playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('playerId', playerId);
      }

      const response = await fetch(`/api/games/${targetGameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      if (response.ok) {
        router.push(`/game/${targetGameId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join game');
        // Refresh the list if join failed (game might be full)
        fetchAvailableGames();
      }
    } catch (err) {
      setError('Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Join Game</h1>
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Available Games Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Available Games</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>

            {loadingGames ? (
              <div className="text-center py-8 text-gray-400">Loading games...</div>
            ) : availableGames.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-800 rounded p-4">
                No available games. Create a new game to start playing!
              </div>
            ) : (
              <div className="grid gap-3">
                {availableGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-gray-800 rounded p-4 flex justify-between items-center hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-mono text-sm">{game.id.substring(0, 8)}...</span>
                        <span className="text-gray-400 text-xs">Created {formatDate(game.createdAt)}</span>
                      </div>
                      <div className="text-gray-300 text-sm">
                        Waiting for player to join
                      </div>
                    </div>
                    <button
                      onClick={() => joinGame(game.id)}
                      disabled={loading}
                      className="ml-4 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-semibold rounded transition-colors"
                    >
                      {loading ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 my-8"></div>

          {/* Manual Join Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Join by Game ID</h2>
            <form onSubmit={handleJoinById} className="space-y-4">
              <div>
                <label htmlFor="gameId" className="block text-gray-400 mb-2">
                  Game ID
                </label>
                <input
                  id="gameId"
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Enter game ID"
                  required
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !gameId}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900 text-red-200 rounded text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

