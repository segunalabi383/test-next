import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Use the JavaScript version to share the same in-memory store with socket server
const gameStorePath = path.join(process.cwd(), 'lib', 'gameStore');
const gameLogicPath = path.join(process.cwd(), 'lib', 'gameLogic');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameStore = require(gameStorePath);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gameLogic = require(gameLogicPath);
const { getGame, updateGame, finishGame } = gameStore;
const { makeMove, checkWinner, isBoardFull, getGameStatus } = gameLogic;

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;
    const body = await request.json();
    const { position, playerId } = body;
    
    if (typeof position !== 'number' || position < 0 || position > 8) {
      return NextResponse.json(
        { error: 'Invalid position' },
        { status: 400 }
      );
    }
    
    const game = getGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    if (game.status !== 'active') {
      return NextResponse.json(
        { error: 'Game is not active' },
        { status: 400 }
      );
    }
    
    // Verify it's the player's turn
    const isPlayerX = game.playerX === playerId;
    const isPlayerO = game.playerO === playerId || (game.mode === 'ai' && playerId === 'ai');
    
    if (!isPlayerX && !isPlayerO) {
      return NextResponse.json(
        { error: 'You are not a player in this game' },
        { status: 403 }
      );
    }
    
    const expectedPlayer = game.currentPlayer;
    if ((expectedPlayer === 'X' && !isPlayerX) || (expectedPlayer === 'O' && !isPlayerO)) {
      return NextResponse.json(
        { error: 'Not your turn' },
        { status: 400 }
      );
    }
    
    // Make the move
    try {
      const newBoard = makeMove(game.board, position, game.currentPlayer);
      const winner = checkWinner(newBoard);
      const isFull = isBoardFull(newBoard);
      
      game.board = newBoard;
      game.moves.push({
        position,
        player: game.currentPlayer,
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
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
        game.status = getGameStatus(game);
      }
      
      game.updatedAt = Date.now();
      updateGame(game);
      
      return NextResponse.json(game);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid move' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to make move' },
      { status: 500 }
    );
  }
}

