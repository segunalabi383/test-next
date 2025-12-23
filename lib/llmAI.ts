import OpenAI from 'openai';
import { Player } from './types';
import { getBestMove } from './gameLogic';

// Initialize OpenAI client (will use environment variable OPENAI_API_KEY)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, using fallback AI');
    return null;
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
}

export async function getLLMMove(
  board: Player[],
  aiPlayer: 'X' | 'O',
  gameHistory: string
): Promise<number> {
  const client = getOpenAIClient();
  
  // If no API key, fall back to rule-based AI
  if (!client) {
    return getBestMove(board, aiPlayer);
  }

  try {
    const boardString = board
      .map((cell, index) => {
        if (cell === null) return index.toString();
        return cell;
      })
      .join('');

    const prompt = `You are playing Tic-Tac-Toe. The board is represented as positions 0-8:
0 1 2
3 4 5
6 7 8

Current board state (${aiPlayer === 'X' ? 'You are X' : 'You are O'}):
${formatBoard(board)}

${gameHistory ? `Game history: ${gameHistory}` : ''}

Make the best move. Respond with ONLY the position number (0-8) where you want to play.`;

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a Tic-Tac-Toe expert. Always respond with only a single number (0-8) representing your move.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const moveText = response.choices[0]?.message?.content?.trim();
    const move = parseInt(moveText || '-1', 10);

    if (move >= 0 && move < 9 && board[move] === null) {
      return move;
    }

    // Fallback to rule-based if LLM returns invalid move
    return getBestMove(board, aiPlayer);
  } catch (error) {
    console.error('LLM error:', error);
    // Fallback to rule-based AI
    return getBestMove(board, aiPlayer);
  }
}

function formatBoard(board: Player[]): string {
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const row = board.slice(i * 3, (i + 1) * 3)
      .map(cell => cell || ' ')
      .join(' | ');
    rows.push(row);
  }
  return rows.join('\n');
}

