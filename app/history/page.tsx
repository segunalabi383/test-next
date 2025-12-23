'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameHistory } from '@/lib/types';

export default function HistoryPage() {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const getWinnerText = (winner: 'X' | 'O' | null) => {
    if (winner === null) return 'Draw';
    return `Player ${winner} won`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Game History</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              ← Back to Home
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No games played yet. Start a new game to see history here!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-gray-400 font-semibold">Game ID</th>
                    <th className="pb-3 text-gray-400 font-semibold">Mode</th>
                    <th className="pb-3 text-gray-400 font-semibold">Result</th>
                    <th className="pb-3 text-gray-400 font-semibold">Moves</th>
                    <th className="pb-3 text-gray-400 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((game) => (
                    <tr key={game.gameId} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="py-3 text-gray-300 font-mono text-sm">
                        {game.gameId.substring(0, 8)}...
                      </td>
                      <td className="py-3 text-gray-300">
                        <span className={`px-2 py-1 rounded text-xs ${
                          game.mode === 'ai' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'
                        }`}>
                          {game.mode === 'ai' ? 'AI' : 'Multiplayer'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">
                        {getWinnerText(game.winner)}
                      </td>
                      <td className="py-3 text-gray-300">{game.moves}</td>
                      <td className="py-3 text-gray-400 text-sm">
                        {formatDate(game.finishedAt || game.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

