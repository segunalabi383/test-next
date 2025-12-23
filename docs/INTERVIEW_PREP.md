# System Design Interview Preparation

## Quick Reference Guide

### 1. Architecture Overview (30 seconds)

"Our tic-tac-toe application is a real-time multiplayer game built with Next.js. It uses a hybrid architecture combining REST APIs for game management and WebSocket (Socket.io) for real-time game state synchronization. The system stores active games in memory for fast access, with file-based persistence for durability."

### 2. Key Components (1 minute)

**Frontend:**
- Next.js React application
- Real-time UI updates via WebSocket
- Game board, join page, history page

**Backend:**
- Next.js API routes (REST)
- Socket.io server for real-time communication
- In-memory game store (Map data structure)
- File system persistence (JSON files)

**External:**
- OpenAI API for LLM-powered AI opponent (optional)

### 3. Data Flow - Creating & Joining Game (1 minute)

1. **Create Game:**
   - Client → POST /api/games
   - Server creates game in memory
   - Returns game ID
   - Saves to file (async)

2. **Join Game:**
   - Client → POST /api/games/[id]/join
   - Server updates game state
   - Broadcasts via WebSocket to all players in room
   - All clients receive real-time update

3. **Make Move:**
   - Multiplayer: Client → WebSocket event
   - Server validates, updates state
   - Broadcasts to room
   - All players see update instantly

### 4. Design Decisions & Trade-offs (2 minutes)

#### Decision 1: In-Memory Store + File Persistence

**Why:** Fast performance for active games, simple implementation

**Trade-offs:**
- ✅ Fast reads/writes
- ✅ Simple to implement
- ❌ Not scalable (single server)
- ❌ Data loss risk on crash

**Future:** Migrate to Redis for shared state

#### Decision 2: WebSocket for Real-Time

**Why:** Low latency, bidirectional communication

**Trade-offs:**
- ✅ Real-time updates
- ✅ Efficient broadcasting
- ❌ Requires persistent connections
- ❌ More complex than polling

#### Decision 3: Hybrid REST + WebSocket

**Why:** REST for stateless ops, WebSocket for real-time

**Trade-offs:**
- ✅ Best of both worlds
- ✅ Resilient (fallback to REST)
- ❌ More complex client code

### 5. Scalability (2 minutes)

**Current Limitations:**
- Single server architecture
- In-memory store (can't scale horizontally)
- File system storage (not concurrent)

**Scaling Strategy:**

1. **Horizontal Scaling:**
   - Use Redis for shared game state
   - Load balancer for API routes
   - Redis adapter for Socket.io

2. **Database Migration:**
   - Move from files to PostgreSQL/MongoDB
   - Better querying and transactions
   - Proper backup/recovery

3. **Caching:**
   - Cache frequently accessed games
   - CDN for static assets

### 6. Common Interview Questions

#### Q: How would you handle 1 million concurrent users?

**Answer:**
1. **Horizontal Scaling:** Multiple app servers behind load balancer
2. **Shared State:** Redis cluster for game state
3. **Database:** PostgreSQL with read replicas
4. **Caching:** Redis cache layer
5. **CDN:** Static assets on CDN
6. **Connection Management:** WebSocket connection pooling
7. **Rate Limiting:** Prevent abuse

#### Q: How do you ensure data consistency?

**Answer:**
1. **Single Source of Truth:** Server validates all moves
2. **Atomic Operations:** Use Redis transactions
3. **Optimistic Locking:** Version numbers for game state
4. **Idempotency:** Move validation prevents duplicates
5. **Event Sourcing:** Could log all moves for replay

#### Q: What happens if a server crashes?

**Answer:**
1. **Current:** Games in memory are lost (mitigated by file saves)
2. **Improved:** 
   - Redis persistence (AOF/RDB)
   - Database backup
   - Client reconnection logic
   - Game state recovery from database

#### Q: How do you prevent cheating?

**Answer:**
1. **Server-Side Validation:** All moves validated on server
2. **Turn Enforcement:** Server checks if it's player's turn
3. **State Verification:** Client can't modify game state directly
4. **Rate Limiting:** Prevent rapid moves
5. **Authentication:** User accounts (future)

#### Q: How would you add user accounts?

**Answer:**
1. **Authentication:** NextAuth.js or custom JWT
2. **Database Schema:** Users table, link games to users
3. **API Changes:** Require authentication, filter by user
4. **Migration:** Link existing games to users
5. **Features:** Profiles, friend system, statistics

### 7. System Metrics to Discuss

- **Active Games:** Track in memory
- **Concurrent Players:** WebSocket connections
- **API Latency:** Response times
- **Error Rates:** Failed requests
- **Game Completion Rate:** Finished vs abandoned

### 8. Architecture Diagram (Draw This)

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ HTTP/WS
     │
┌────▼─────────────────────┐
│   Load Balancer          │
└────┬─────────────────────┘
     │
┌────┴────┬────────┬────────┐
│ App 1  │ App 2  │ App 3  │
└───┬────┴───┬────┴───┬─────┘
    │        │       │
    └────────┴───┬───┘
                 │
         ┌───────▼───────┐
         │    Redis      │
         │  (Game State)  │
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │  PostgreSQL  │
         │ (Persistence) │
         └───────────────┘
```

### 9. Key Points to Emphasize

1. **Real-time Architecture:** WebSocket for low-latency
2. **Scalability Awareness:** Know limitations and solutions
3. **Trade-off Analysis:** Understand pros/cons of decisions
4. **Full-Stack:** End-to-end implementation
5. **Future Thinking:** Clear path for improvements

### 10. Questions to Ask Interviewer

1. "What's the expected scale? (users, games per second)"
2. "Are there specific performance requirements?"
3. "What's the budget for infrastructure?"
4. "Do we need to support mobile apps?"
5. "What's the timeline for launch?"

### 11. Red Flags to Avoid

❌ Don't say: "It works fine as is"
✅ Say: "It works for MVP, but here's how we'd scale..."

❌ Don't say: "We'll just add more servers"
✅ Say: "We need shared state (Redis) to scale horizontally"

❌ Don't say: "We don't need a database"
✅ Say: "Files work for MVP, but database needed for production"

### 12. Practice Scenarios

**Scenario 1: Sudden Traffic Spike**
- Auto-scaling
- Rate limiting
- Queue system
- Graceful degradation

**Scenario 2: Database Failure**
- Read replicas
- Caching layer
- Fallback mechanisms
- Monitoring/alerting

**Scenario 3: WebSocket Connection Issues**
- Reconnection logic
- Fallback to REST polling
- Connection state management
- Heartbeat/ping

## Quick Checklist Before Interview

- [ ] Can explain architecture in 2 minutes
- [ ] Understand all design trade-offs
- [ ] Know scaling strategies
- [ ] Can draw architecture diagram
- [ ] Understand failure scenarios
- [ ] Know current limitations
- [ ] Have improvement roadmap
- [ ] Can discuss metrics
- [ ] Prepared for common questions

