const { Server: SocketIOServer } = require('socket.io');
const { getGame, updateGame, finishGame } = require('./gameStore');
const { makeMove, checkWinner, isBoardFull, getGameStatus } = require('./gameLogic');
const { getBestMove } = require('./gameLogic');

let io = null;

function initializeSocket(server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-game', (gameId) => {
      socket.join(gameId);
      const game = getGame(gameId);
      if (game) {
        socket.emit('game-state', game);
        socket.to(gameId).emit('player-joined', { playerId: socket.id });
      }
    });

    socket.on('make-move', async (data) => {
      const { gameId, position, playerId } = data;
      const game = getGame(gameId);
      
      if (!game || game.status !== 'active') {
        socket.emit('error', { message: 'Game not found or not active' });
        return;
      }

      const isPlayerX = game.playerX === playerId;
      const isPlayerO = game.playerO === playerId;
      
      if (!isPlayerX && !isPlayerO) {
        socket.emit('error', { message: 'You are not a player in this game' });
        return;
      }

      const expectedPlayer = game.currentPlayer;
      if ((expectedPlayer === 'X' && !isPlayerX) || (expectedPlayer === 'O' && !isPlayerO)) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

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

        io?.to(gameId).emit('game-updated', game);

        if (game.mode === 'ai' && game.status === 'active' && game.currentPlayer === 'O') {
          setTimeout(() => {
            makeAIMove(gameId);
          }, 500);
        }
      } catch (error) {
        socket.emit('error', { message: error.message || 'Invalid move' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

async function makeAIMove(gameId) {
  const game = getGame(gameId);
  if (!game || game.status !== 'active' || game.currentPlayer !== 'O') {
    return;
  }

  const aiPosition = getBestMove(game.board, 'O');
  
  if (aiPosition === -1) {
    return;
  }

  try {
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

    io?.to(gameId).emit('game-updated', game);
  } catch (error) {
    console.error('AI move error:', error);
  }
}

function getIO() {
  return io;
}

// Export function to notify about game updates (for API routes)
function notifyGameUpdate(gameId, game) {
  if (io) {
    io.to(gameId).emit('game-updated', game);
  }
}

module.exports = { initializeSocket, getIO, notifyGameUpdate };

