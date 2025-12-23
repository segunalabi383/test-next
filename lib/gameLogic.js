function createEmptyBoard() {
  return Array(9).fill(null);
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function isBoardFull(board) {
  return board.every(cell => cell !== null);
}

function isValidMove(board, position) {
  return position >= 0 && position < 9 && board[position] === null;
}

function makeMove(board, position, player) {
  if (!isValidMove(board, position)) {
    throw new Error('Invalid move');
  }
  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
}

function getGameStatus(game) {
  if (game.status === 'waiting') return 'waiting';
  
  const winner = checkWinner(game.board);
  if (winner) return 'finished';
  if (isBoardFull(game.board)) return 'draw';
  
  return 'active';
}

function getBestMove(board, aiPlayer) {
  const opponent = aiPlayer === 'X' ? 'O' : 'X';
  
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const testBoard = [...board];
      testBoard[i] = aiPlayer;
      if (checkWinner(testBoard) === aiPlayer) {
        return i;
      }
    }
  }
  
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const testBoard = [...board];
      testBoard[i] = opponent;
      if (checkWinner(testBoard) === opponent) {
        return i;
      }
    }
  }
  
  if (board[4] === null) {
    return 4;
  }
  
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(i => board[i] === null);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }
  
  const available = board.map((cell, index) => cell === null ? index : -1).filter(i => i !== -1);
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  
  return -1;
}

module.exports = {
  createEmptyBoard,
  checkWinner,
  isBoardFull,
  isValidMove,
  makeMove,
  getGameStatus,
  getBestMove,
};

