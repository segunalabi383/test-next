import { Game, GameHistory } from './types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// In-memory store for active games
const games = new Map<string, Game>();
const gameHistory: GameHistory[] = [];

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Load games from file
export async function loadGames() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(GAMES_FILE, 'utf-8');
    const loadedGames = JSON.parse(data);
    games.clear();
    for (const game of loadedGames) {
      games.set(game.id, game);
    }
  } catch (error) {
    // File doesn't exist yet, start fresh
    console.log('No existing games file, starting fresh');
  }
}

// Save games to file
export async function saveGames() {
  await ensureDataDir();
  try {
    const gamesArray = Array.from(games.values());
    await fs.writeFile(GAMES_FILE, JSON.stringify(gamesArray, null, 2));
  } catch (error) {
    console.error('Error saving games:', error);
  }
}

// Load game history
export async function loadHistory() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    const loadedHistory = JSON.parse(data);
    gameHistory.length = 0;
    gameHistory.push(...loadedHistory);
  } catch (error) {
    console.log('No existing history file, starting fresh');
  }
}

// Save game history
export async function saveHistory() {
  await ensureDataDir();
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(gameHistory, null, 2));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

// Initialize storage
export async function initializeStorage() {
  await loadGames();
  await loadHistory();
}

// Game operations
export function createGame(mode: 'multiplayer' | 'ai', playerId: string): Game {
  const game: Game = {
    id: uuidv4(),
    mode,
    status: mode === 'ai' ? 'active' : 'waiting',
    board: Array(9).fill(null),
    currentPlayer: 'X',
    playerX: playerId,
    playerO: mode === 'ai' ? 'ai' : undefined,
    winner: null,
    moves: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  games.set(game.id, game);
  saveGames(); // Async, don't wait
  return game;
}

export function getGame(gameId: string): Game | undefined {
  return games.get(gameId);
}

export function getAllGames(): Game[] {
  return Array.from(games.values());
}

export function updateGame(game: Game) {
  game.updatedAt = Date.now();
  games.set(game.id, game);
  saveGames(); // Async, don't wait
}

export function joinGame(gameId: string, playerId: string): Game | null {
  const game = games.get(gameId);
  if (!game || game.status !== 'waiting' || game.playerO) {
    return null;
  }
  
  game.playerO = playerId;
  game.status = 'active';
  updateGame(game);
  return game;
}

export function finishGame(game: Game) {
  game.status = 'finished';
  game.finishedAt = Date.now();
  updateGame(game);
  
  // Add to history
  const historyEntry: GameHistory = {
    gameId: game.id,
    mode: game.mode,
    status: game.status,
    winner: game.winner,
    moves: game.moves.length,
    createdAt: game.createdAt,
    finishedAt: game.finishedAt,
  };
  
  gameHistory.push(historyEntry);
  saveHistory(); // Async, don't wait
  
  // Remove from active games after a delay (or keep for history)
  // For now, we'll keep them but mark as finished
}

export function getGameHistory(playerId?: string): GameHistory[] {
  if (!playerId) {
    return [...gameHistory].reverse(); // Most recent first
  }
  
  // Filter by player (when user accounts are implemented)
  return gameHistory
    .filter(game => {
      // This will be enhanced when user accounts are added
      return true;
    })
    .reverse();
}

