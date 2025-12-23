# Tic-Tac-Toe Game

A full-featured Tic-Tac-Toe application built with Next.js 14, featuring real-time multiplayer, AI opponent, and game history.

## Features

✅ **Two Game Modes**
- **AI Mode**: Play against an intelligent AI opponent (with optional LLM integration)
- **Multiplayer Mode**: Play against another player in real-time from different machines

✅ **Real-time Updates**
- WebSocket-based real-time communication for multiplayer games
- Instant game state synchronization across devices

✅ **Game State Persistence**
- Games persist across browser refreshes
- Game data stored in JSON files (can be migrated to database)

✅ **Multiple Concurrent Games**
- Support for multiple games running simultaneously
- Each game has a unique ID

✅ **Game History**
- View all completed games
- Filter by game mode
- See game results, moves, and timestamps

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Set up OpenAI API key for LLM opponent:
```bash
# Create .env.local file
echo "OPENAI_API_KEY=your_api_key_here" > .env.local
```

If you don't set the API key, the game will use a rule-based AI opponent.

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## How to Play

### AI Mode
1. Click "Play vs AI" on the home page
2. You play as X, AI plays as O
3. Click on any empty cell to make your move
4. The AI will automatically make its move after yours

### Multiplayer Mode
1. Click "Multiplayer" on the home page
2. Share the game ID or URL with your opponent
3. Your opponent can join by:
   - Visiting the "Join Game" page and entering the game ID
   - Or directly opening the shared URL
4. Take turns making moves in real-time

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── games/        # Game management endpoints
│   │   └── history/      # Game history endpoint
│   ├── game/[gameId]/    # Game page
│   ├── join/             # Join game page
│   ├── history/           # Game history page
│   └── page.tsx          # Home page
├── components/
│   └── GameBoard.tsx     # Game board component
├── lib/
│   ├── types.ts          # TypeScript types
│   ├── gameLogic.ts      # Game logic utilities
│   ├── gameStore.ts      # Game state management
│   ├── llmAI.ts          # LLM AI integration
│   └── socketServer.ts   # WebSocket server
├── data/                 # Game data storage (auto-created)
├── server.js             # Custom Next.js server with Socket.io
└── docs/
    └── USER_ACCOUNTS.md  # User accounts implementation guide
```

## API Endpoints

### Games
- `GET /api/games?id={gameId}` - Get game by ID or list all games
- `POST /api/games` - Create a new game
- `POST /api/games/[gameId]/join` - Join a multiplayer game
- `POST /api/games/[gameId]/move` - Make a move
- `POST /api/games/[gameId]/ai-move` - Trigger AI move (for AI games)

### History
- `GET /api/history` - Get game history

## WebSocket Events

### Client → Server
- `join-game` - Join a game room
- `make-move` - Make a move (multiplayer)

### Server → Client
- `game-state` - Initial game state
- `game-updated` - Game state update
- `player-joined` - Notification when player joins
- `error` - Error message

## Configuration

### Environment Variables

- `OPENAI_API_KEY` (optional): OpenAI API key for LLM opponent
- `PORT` (optional): Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## Adding User Accounts

See `docs/USER_ACCOUNTS.md` for a detailed guide on implementing user accounts with authentication.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.io** - Real-time WebSocket communication
- **OpenAI API** - LLM-powered AI opponent (optional)
- **UUID** - Unique game IDs

## Data Storage

Currently, games are stored in JSON files in the `data/` directory:
- `data/games.json` - Active and finished games
- `data/history.json` - Game history

For production, consider migrating to a database (PostgreSQL, MongoDB, etc.).

## License

MIT
