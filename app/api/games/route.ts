import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Use the JavaScript version to share the same in-memory store with socket server
const gameStorePath = path.join(process.cwd(), 'lib', 'gameStore');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameStore = require(gameStorePath);

const { createGame, getAllGames, getGame } = gameStore;

// Initialize storage on first import
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await gameStore.initializeStorage();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('id');
    
    if (gameId) {
      const game = getGame(gameId);
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }
      return NextResponse.json(game);
    }
    
    const games = getAllGames();
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error in GET /api/games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { mode, playerId } = body;
    
    if (!mode || (mode !== 'multiplayer' && mode !== 'ai')) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "multiplayer" or "ai"' },
        { status: 400 }
      );
    }
    
    const sessionId = playerId || uuidv4();
    const game = createGame(mode, sessionId);
    
    // Ensure game is saved before returning (wait a bit for async save)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error in POST /api/games:', error);
    return NextResponse.json(
      { error: 'Failed to create game', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

