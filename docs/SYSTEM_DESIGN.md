# Tic-Tac-Toe Application - System Design

## 1. Overview

A real-time multiplayer tic-tac-toe game application supporting:
- Two-player multiplayer games
- AI opponent games (with optional LLM integration)
- Real-time game state synchronization
- Game state persistence
- Game history tracking

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────┐
│   Client    │ (Browser)
│  (Next.js)  │
└──────┬──────┘
       │ HTTP/WebSocket
       │
┌──────▼─────────────────────────────────┐
│         Next.js Server                 │
│  ┌─────────────────────────────────┐   │
│  │   API Routes (REST)             │   │
│  │   - /api/games                  │   │
│  │   - /api/games/[id]/join        │   │
│  │   - /api/games/[id]/move        │   │
│  │   - /api/history                │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   WebSocket Server (Socket.io)  │   │
│  │   - Real-time updates           │   │
│  │   - Game state sync             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Game Store (In-Memory)       │   │
│  │   - Active games                │   │
│  │   - Game state                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   File System (JSON)            │   │
│  │   - Game persistence            │   │
│  │   - History                     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Socket.io Client

**Backend:**
- Next.js API Routes
- Node.js
- Socket.io Server
- File System (JSON storage)

**External Services:**
- OpenAI API (optional, for LLM opponent)

## 3. Core Components

### 3.1 Client-Side Components

1. **Home Page** (`app/page.tsx`)
   - Game mode selection (AI vs Multiplayer)
   - Navigation to join/history pages

2. **Game Page** (`app/game/[gameId]/page.tsx`)
   - Game board UI
   - WebSocket connection management
   - Real-time state updates

3. **Join Page** (`app/join/page.tsx`)
   - List of available games
   - Manual game ID entry
   - Auto-refresh functionality

4. **History Page** (`app/history/page.tsx`)
   - Display completed games
   - Filter and search capabilities

5. **Game Board Component** (`components/GameBoard.tsx`)
   - Visual representation of the board
   - Move input handling
   - Status display

### 3.2 Server-Side Components

1. **API Routes**
   - `GET /api/games` - List all games or get specific game
   - `POST /api/games` - Create new game
   - `POST /api/games/[id]/join` - Join multiplayer game
   - `POST /api/games/[id]/move` - Make a move
   - `POST /api/games/[id]/ai-move` - Trigger AI move
   - `GET /api/history` - Get game history

2. **WebSocket Server** (`lib/socketServer.js`)
   - Real-time game state synchronization
   - Room management (Socket.io rooms)
   - Event broadcasting

3. **Game Store** (`lib/gameStore.js`)
   - In-memory game state management
   - Game CRUD operations
   - Persistence layer (JSON files)

4. **Game Logic** (`lib/gameLogic.js`)
   - Win condition checking
   - Move validation
   - AI move generation (minimax-like)

5. **LLM Integration** (`lib/llmAI.ts`)
   - OpenAI API integration
   - Fallback to rule-based AI

## 4. Data Flow

### 4.1 Creating a Game

```
Client → POST /api/games
       ↓
API Route → gameStore.createGame()
       ↓
In-Memory Store (Map)
       ↓
File System (async save)
       ↓
Response → Client (game ID)
```

### 4.2 Joining a Game

```
Client → POST /api/games/[id]/join
       ↓
API Route → gameStore.joinGame()
       ↓
Update Game State
       ↓
Socket.io → Broadcast 'game-updated' to room
       ↓
Response → Client
       ↓
All clients in room receive update
```

### 4.3 Making a Move (Multiplayer)

```
Client → Socket.io 'make-move' event
       ↓
Socket Server → Validate move
       ↓
Update game state
       ↓
Socket.io → Broadcast 'game-updated' to room
       ↓
All clients receive updated state
```

### 4.4 Making a Move (AI)

```
Client → POST /api/games/[id]/move
       ↓
API Route → Validate & apply move
       ↓
Response → Client
       ↓
Client → POST /api/games/[id]/ai-move
       ↓
API Route → Generate AI move (LLM or rule-based)
       ↓
Update game state
       ↓
Response → Client
```

## 5. Data Models

### 5.1 Game Object

```typescript
interface Game {
  id: string;                    // UUID
  mode: 'multiplayer' | 'ai';
  status: 'waiting' | 'active' | 'finished' | 'draw';
  board: Player[];                // 9-element array
  currentPlayer: 'X' | 'O';
  playerX?: string;               // Player/session ID
  playerO?: string;               // Player/session ID or 'ai'
  winner: Player;                  // 'X' | 'O' | null
  moves: GameMove[];
  createdAt: number;
  updatedAt: number;
  finishedAt?: number;
}
```

### 5.2 Game Move

```typescript
interface GameMove {
  position: number;               // 0-8
  player: 'X' | 'O';
  timestamp: number;
}
```

### 5.3 Game History

```typescript
interface GameHistory {
  gameId: string;
  mode: 'multiplayer' | 'ai';
  status: GameStatus;
  winner: Player;
  moves: number;
  createdAt: number;
  finishedAt?: number;
}
```

## 6. Key Design Decisions

### 6.1 In-Memory Store + File Persistence

**Decision:** Use in-memory Map for active games with JSON file persistence

**Rationale:**
- Fast read/write for active games
- Persistence across server restarts
- Simple implementation for MVP

**Trade-offs:**
- ✅ Fast performance
- ✅ Simple to implement
- ❌ Not scalable (single server)
- ❌ Data loss risk if server crashes before save

**Future Improvement:** Migrate to Redis or database

### 6.2 WebSocket for Real-Time Updates

**Decision:** Use Socket.io for multiplayer game state synchronization

**Rationale:**
- Low latency for real-time updates
- Bidirectional communication
- Room-based broadcasting

**Trade-offs:**
- ✅ Real-time updates
- ✅ Efficient broadcasting
- ❌ Requires persistent connections
- ❌ More complex than polling

### 6.3 Hybrid Approach: REST + WebSocket

**Decision:** Use REST API for game creation/joining, WebSocket for moves

**Rationale:**
- REST for stateless operations
- WebSocket for real-time game state
- Fallback to REST polling if WebSocket fails

**Trade-offs:**
- ✅ Best of both worlds
- ✅ More resilient
- ❌ More complex client code

### 6.4 Session-Based Player Identification

**Decision:** Use localStorage for player IDs (no authentication)

**Rationale:**
- Quick to implement
- No signup required
- Good for MVP

**Trade-offs:**
- ✅ Simple UX
- ✅ Fast development
- ❌ No user accounts
- ❌ Can't track players across devices

**Future Improvement:** Add authentication system

## 7. Scalability Considerations

### 7.1 Current Limitations

1. **Single Server**
   - All games stored in one process
   - Can't scale horizontally

2. **In-Memory Store**
   - Limited by server RAM
   - Lost on server restart (partially mitigated by file persistence)

3. **File System Storage**
   - Not suitable for high concurrency
   - Slow for large datasets

### 7.2 Scaling Strategies

#### Horizontal Scaling

**Problem:** In-memory store doesn't work across multiple servers

**Solution:**
- Use Redis for shared game state
- Sticky sessions or stateless design
- Load balancer for API routes

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Server1 │     │ Server2 │     │ Server3 │
└────┬────┘     └────┬────┘     └────┬────┘
     │              │              │
     └──────┬───────┴───────┬──────┘
            │               │
     ┌──────▼───────────────▼──────┐
     │      Redis Cluster          │
     │   (Shared Game State)        │
     └──────────────────────────────┘
```

#### Database Migration

**Current:** JSON files
**Future:** PostgreSQL or MongoDB

**Benefits:**
- ACID transactions
- Better querying
- Scalability
- Backup/recovery

#### WebSocket Scaling

**Problem:** Socket.io rooms are per-server

**Solution:**
- Redis adapter for Socket.io
- Shared pub/sub for cross-server communication

```javascript
const redisAdapter = require('@socket.io/redis-adapter');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
```

### 7.3 Performance Optimizations

1. **Caching**
   - Cache frequently accessed games
   - Cache game history with TTL

2. **Connection Pooling**
   - Reuse database connections
   - WebSocket connection limits

3. **Rate Limiting**
   - Prevent abuse
   - Limit moves per second

4. **CDN for Static Assets**
   - Serve React bundle from CDN
   - Cache game assets

## 8. Security Considerations

### 8.1 Current State

- No authentication
- Session-based player IDs
- Basic input validation

### 8.2 Security Improvements Needed

1. **Authentication & Authorization**
   - User accounts
   - JWT tokens
   - Rate limiting per user

2. **Input Validation**
   - Sanitize all inputs
   - Validate game moves server-side
   - Prevent injection attacks

3. **WebSocket Security**
   - Authenticate WebSocket connections
   - Validate all socket events
   - Prevent message flooding

4. **Data Protection**
   - Encrypt sensitive data
   - Secure API keys (OpenAI)
   - HTTPS only

## 9. Monitoring & Observability

### 9.1 Metrics to Track

- Active games count
- Concurrent players
- API response times
- WebSocket connection count
- Error rates
- Game completion rate

### 9.2 Logging

- Game creation/joining events
- Move events
- Error logs
- Performance metrics

### 9.3 Alerting

- High error rates
- Server downtime
- High memory usage
- Database connection issues

## 10. Deployment Architecture

### 10.1 Current (Development)

```
Single Server
├── Next.js App
├── Socket.io Server
├── In-Memory Store
└── File System
```

### 10.2 Production (Recommended)

```
┌─────────────┐
│   CDN       │ (Static assets)
└─────────────┘
       │
┌──────▼──────────────────┐
│   Load Balancer         │
└──────┬───────────────────┘
       │
   ┌───┴───┬────────┬────────┐
   │       │        │        │
┌──▼──┐ ┌─▼──┐  ┌──▼──┐  ┌──▼──┐
│App1 │ │App2│  │App3│  │AppN │
└──┬──┘ └─┬──┘  └──┬──┘  └──┬──┘
   │      │        │        │
   └──────┴────────┴────────┘
          │
   ┌──────▼──────┐
   │   Redis     │ (Game state)
   └─────────────┘
          │
   ┌──────▼──────┐
   │ PostgreSQL  │ (Persistence)
   └─────────────┘
```

## 11. API Design

### 11.1 REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games?id={id}` | Get game by ID or list all |
| POST | `/api/games` | Create new game |
| POST | `/api/games/[id]/join` | Join multiplayer game |
| POST | `/api/games/[id]/move` | Make a move |
| POST | `/api/games/[id]/ai-move` | Trigger AI move |
| GET | `/api/history` | Get game history |

### 11.2 WebSocket Events

**Client → Server:**
- `join-game` - Join a game room
- `make-move` - Make a move (multiplayer)

**Server → Client:**
- `game-state` - Initial game state
- `game-updated` - Game state update
- `player-joined` - Player joined notification
- `error` - Error message

## 12. Failure Scenarios & Handling

### 12.1 Server Crash

**Impact:** Active games lost from memory

**Mitigation:**
- Periodic file saves
- Redis persistence
- Client reconnection logic

### 12.2 Network Partition

**Impact:** Players can't communicate

**Mitigation:**
- Client-side retry logic
- Fallback to REST polling
- Connection state indicators

### 12.3 High Load

**Impact:** Slow responses, connection failures

**Mitigation:**
- Horizontal scaling
- Rate limiting
- Queue system for moves

## 13. Future Enhancements

1. **User Accounts**
   - Authentication system
   - User profiles
   - Friend system

2. **Advanced Features**
   - Tournament mode
   - Leaderboards
   - Spectator mode
   - Game replays

3. **AI Improvements**
   - Difficulty levels
   - Learning AI
   - Multiple AI strategies

4. **Mobile App**
   - React Native version
   - Push notifications
   - Offline mode

## 14. Interview Talking Points

### Strengths to Highlight

1. **Real-time Architecture**
   - WebSocket for low-latency updates
   - Efficient room-based broadcasting

2. **Scalability Awareness**
   - Identified current limitations
   - Proposed scaling strategies

3. **Trade-off Analysis**
   - In-memory vs database
   - REST vs WebSocket
   - Simplicity vs scalability

4. **Full-Stack Implementation**
   - Frontend and backend
   - Real-time features
   - State management

### Areas for Discussion

1. **Database Choice**
   - When to migrate from files
   - SQL vs NoSQL trade-offs

2. **Caching Strategy**
   - What to cache
   - Cache invalidation

3. **Message Queue**
   - When to introduce queues
   - Event-driven architecture

4. **Microservices**
   - When to split services
   - Service boundaries

## 15. Code Quality & Best Practices

### Current Implementation

- TypeScript for type safety
- Modular code structure
- Error handling
- Separation of concerns

### Improvements Needed

- Unit tests
- Integration tests
- API documentation (OpenAPI)
- Code comments
- Performance profiling

