const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

const games = new Map();
const gameHistory = [];

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

async function loadGames() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(GAMES_FILE, 'utf-8');
    const loadedGames = JSON.parse(data);
    games.clear();
    for (const game of loadedGames) {
      games.set(game.id, game);
    }
  } catch (error) {
    console.log('No existing games file, starting fresh');
  }
}

async function saveGames() {
  await ensureDataDir();
  try {
    const gamesArray = Array.from(games.values());
    await fs.writeFile(GAMES_FILE, JSON.stringify(gamesArray, null, 2));
  } catch (error) {
    console.error('Error saving games:', error);
  }
}

async function loadHistory() {
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

async function saveHistory() {
  await ensureDataDir();
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(gameHistory, null, 2));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

async function initializeStorage() {
  await loadGames();
  await loadHistory();
}

function createGame(mode, playerId) {
  const game = {
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
  saveGames();
  return game;
}

function getGame(gameId) {
  return games.get(gameId);
}

function getAllGames() {
  return Array.from(games.values());
}

function updateGame(game) {
  game.updatedAt = Date.now();
  games.set(game.id, game);
  saveGames();
}

function joinGame(gameId, playerId) {
  const game = games.get(gameId);
  if (!game || game.status !== 'waiting' || game.playerO) {
    return null;
  }
  
  game.playerO = playerId;
  game.status = 'active';
  updateGame(game);
  return game;
}

function finishGame(game) {
  game.status = 'finished';
  game.finishedAt = Date.now();
  updateGame(game);
  
  const historyEntry = {
    gameId: game.id,
    mode: game.mode,
    status: game.status,
    winner: game.winner,
    moves: game.moves.length,
    createdAt: game.createdAt,
    finishedAt: game.finishedAt,
  };
  
  gameHistory.push(historyEntry);
  saveHistory();
}

function getGameHistory(playerId) {
  if (!playerId) {
    return [...gameHistory].reverse();
  }
  return gameHistory
    .filter(() => true)
    .reverse();
}

module.exports = {
  initializeStorage,
  createGame,
  getGame,
  getAllGames,
  updateGame,
  joinGame,
  finishGame,
  getGameHistory,
};

