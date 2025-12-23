# User Accounts Implementation Guide

This document outlines how to add basic user accounts to the Tic-Tac-Toe application.

## Overview

Currently, the application uses session-based player identification stored in `localStorage`. To implement user accounts, you would need to add authentication and user management.

## Implementation Approach

### 1. Authentication System

#### Option A: NextAuth.js (Recommended)
- Install: `npm install next-auth`
- Provides multiple authentication providers (Google, GitHub, Email, etc.)
- Handles sessions, JWT tokens, and database integration
- Well-integrated with Next.js App Router

#### Option B: Custom Authentication
- Use JWT tokens with secure HTTP-only cookies
- Implement login/register pages
- Hash passwords using bcrypt
- Store user data in database

### 2. Database Schema

Add a `users` table with the following structure:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_participants (
  game_id UUID REFERENCES games(id),
  user_id UUID REFERENCES users(id),
  player_symbol VARCHAR(1) NOT NULL, -- 'X' or 'O'
  PRIMARY KEY (game_id, user_id)
);
```

### 3. Code Changes Required

#### Update `lib/types.ts`
```typescript
export interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: number;
}

export interface Game {
  // ... existing fields
  playerX?: string; // Change to user ID
  playerO?: string; // Change to user ID
  // Add:
  playerXUser?: User;
  playerOUser?: User;
}
```

#### Update `lib/gameStore.ts`
- Replace `playerId` (session-based) with `userId` (database ID)
- Add user lookup functions
- Filter game history by authenticated user

#### Update API Routes
- Add authentication middleware to protect routes
- Verify user identity before allowing moves
- Return user information with game data

#### Update UI Components
- Add login/register pages
- Show user profile/username in game
- Display user-specific game history
- Add logout functionality

### 4. Example Implementation with NextAuth.js

#### `app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword, getUserByEmail } from '@/lib/auth';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const user = await getUserByEmail(credentials.email);
        if (user && await verifyPassword(credentials.password, user.passwordHash)) {
          return { id: user.id, email: user.email, name: user.username };
        }
        return null;
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);
```

#### Update Game Creation
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const game = createGame(mode, session.user.id);
  // ...
}
```

### 5. Benefits of Adding User Accounts

- **Personalization**: Users can see their win/loss statistics
- **Game History**: Filter and view only your games
- **Friend System**: Challenge specific users
- **Leaderboards**: Track top players
- **Account Recovery**: Reset password, recover games
- **Security**: Better protection against cheating

### 6. Migration Strategy

1. **Phase 1**: Add authentication without breaking existing functionality
   - Keep session-based games working
   - Allow anonymous play alongside authenticated users

2. **Phase 2**: Migrate existing games
   - Link session IDs to user accounts when users sign up
   - Preserve game history

3. **Phase 3**: Require authentication (optional)
   - Make accounts mandatory for multiplayer
   - Keep AI games available for guests

### 7. Additional Features to Consider

- **Email Verification**: Verify user emails
- **Password Reset**: Allow users to reset forgotten passwords
- **Profile Pages**: Display user stats and achievements
- **Social Features**: Add friends, send challenges
- **Notifications**: Notify users when it's their turn
- **Game Invitations**: Send game links via email

## Current Implementation Notes

The current implementation uses:
- `localStorage` for player identification
- Session-based player IDs (e.g., `player_1234567890_abc123`)
- No authentication required

This works well for:
- Quick games without signup
- Testing and development
- Anonymous play

To add user accounts, follow the steps above and gradually migrate from session-based to user-based identification.

