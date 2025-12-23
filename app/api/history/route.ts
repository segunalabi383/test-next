import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Use the JavaScript version to share the same in-memory store
const gameStorePath = path.join(process.cwd(), 'lib', 'gameStore');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameStore = require(gameStorePath);
const { getGameHistory } = gameStore;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerId = searchParams.get('playerId') || undefined;
  
  const history = getGameHistory(playerId);
  return NextResponse.json(history);
}

