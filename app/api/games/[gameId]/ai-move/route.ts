import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Use the JavaScript version to share the same in-memory store with socket server
const gameStorePath = path.join(process.cwd(), 'lib', 'gameStore');
const gameLogicPath = path.join(process.cwd(), 'lib', 'gameLogic');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameStore = require(gameStorePath);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameLogic = require(gameLogicPath);
// Import LLM AI (TypeScript module, will be compiled)
import { getLLMMove } from '@/lib/llmAI';
const { getGame, updateGame, finishGame } = gameStore;
const { makeMove, checkWinner, isBoardFull, getGameStatus } = gameLogic;

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;
    const game = getGame(gameId);
    
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    if (game.mode !== 'ai') {
      return NextResponse.json(
        { error: 'This endpoint is only for AI games' },
        { status: 400 }
      );
    }
    
    if (game.status !== 'active' || game.currentPlayer !== 'O') {
      return NextResponse.json(
        { error: 'Not AI turn' },
        { status: 400 }
      );
    }
    
    // Get AI move (LLM or fallback)
    const gameHistory = game.moves
      .map(m => `Move ${m.position} by ${m.player}`)
      .join(', ');
    
    const aiPosition = await getLLMMove(game.board, 'O', gameHistory);
    
    if (aiPosition === -1) {
      return NextResponse.json(
        { error: 'No valid moves available' },
        { status: 400 }
      );
    }
    
    // Make the AI move
    const newBoard = makeMove(game.board, aiPosition, 'O');
    const winner = checkWinner(newBoard);
    const isFull = isBoardFull(newBoard);
    
    game.board = newBoard;
    game.moves.push({
      position: aiPosition,
      player: 'O',
      timestamp: Date.now(),
    });
    
    if (winner) {
      game.winner = winner;
      game.status = 'finished';
      game.finishedAt = Date.now();
      finishGame(game);
    } else if (isFull) {
      game.status = 'draw';
      game.finishedAt = Date.now();
      finishGame(game);
    } else {
      game.currentPlayer = 'X';
      game.status = getGameStatus(game);
    }
    
    game.updatedAt = Date.now();
    updateGame(game);
    
    return NextResponse.json(game);
  } catch (error) {
    console.error('AI move error:', error);
    return NextResponse.json(
      { error: 'Failed to make AI move' },
      { status: 500 }
    );
  }
}

