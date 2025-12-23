import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Use the JavaScript version to share the same in-memory store with socket server
// Use path.resolve to get absolute path from project root
import path from 'path';

const gameStorePath = path.join(process.cwd(), 'lib', 'gameStore');
const socketServerPath = path.join(process.cwd(), 'lib', 'socketServer');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameStore = require(gameStorePath);
const { getGame, joinGame } = gameStore;

// Initialize storage
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await gameStore.initializeStorage();
    initialized = true;
  }
}

// Dynamic import for socket server (CommonJS module)
function getSocketIO() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getIO } = require(socketServerPath);
    return getIO();
  } catch (error) {
    console.error('Failed to get socket IO:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    await ensureInitialized();
    
    const { gameId } = params;
    const body = await request.json();
    const playerId = body.playerId || uuidv4();
    
    // Retry logic to handle race condition when game is just created
    let game = getGame(gameId);
    let retries = 3;
    while (!game && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      game = getGame(gameId);
      retries--;
    }
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    if (game.mode === 'ai') {
      return NextResponse.json(
        { error: 'Cannot join AI game' },
        { status: 400 }
      );
    }
    
    if (game.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game is not waiting for players' },
        { status: 400 }
      );
    }
    
    if (game.playerO) {
      return NextResponse.json(
        { error: 'Game is full' },
        { status: 400 }
      );
    }
    
    const updatedGame = joinGame(gameId, playerId);
    if (!updatedGame) {
      return NextResponse.json(
        { error: 'Game is full or not available' },
        { status: 400 }
      );
    }
    
    // Notify all players in the game room via socket
    const io = getSocketIO();
    if (io) {
      io.to(gameId).emit('game-updated', updatedGame);
      io.to(gameId).emit('player-joined', { playerId, game: updatedGame });
    }
    
    return NextResponse.json(updatedGame);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}

