# Space Shooter – Backend

## 🎮 About the Game

**Space Shooter** is a top-down shooter game where players pilot a combat spaceship in a confined arena, battling waves of hostile aliens and striving to survive as long as possible.

### 🎯 Rules and Objectives

- **Main Goal**: Survive as long as possible and achieve the highest score
- **Controls**: Move the ship around the arena and shoot at enemies
- **Health**: Player has limited health that decreases upon contact with enemies or their projectiles
- **Score**: Points are awarded for destroying enemies (1 point for regular enemies, 30 points for bosses)
- **Healing**: Health items ![Heal Item](demo/HealItem.png) spawn in the arena to restore player's health

### 🌟 Features and Mechanics

#### Enemy Types

| Enemy | Appearance | Description | Health | Reward |
|:---:|:---:|:---|:---:|:---:|
| **Shooting Enemy** | ![Shooting Enemy](demo/EnemyBlue.png) | Attacks from a distance with direct projectiles, maintains optimal range from players | 50 HP | 1 point |
| **Exploding Enemy** | ![Exploding Enemy](demo/EnemyRed.png) | Fast-moving enemy that deals area damage when destroyed or when getting close to players | 30 HP | 1 point |
| **Circle Shooting Enemy** | ![Circle Shooting Enemy](demo/EnemyGreen.png) | Fires 8 projectiles in all directions simultaneously, orbits around players at medium distance | 80 HP | 1 point |
| **Boss Enemy** | ![Boss Enemy](demo/EnemyBoss.png) | Powerful opponent with increased health and triple laser attacks, spawns at 50 points then every 100 points | 312 HP | 30 points |

#### Progression System
- **Escalating Difficulty**: Enemies spawn more frequently and become stronger
- **Diverse Waves**: Various combinations of enemy types
- **Leaderboard**: Competition for the best score among players (requires login, score > 0, only best scores saved)

#### Multiplayer
- **Cooperative Mode**: Up to 2 players can play together
- **Multiple Sessions**: Server supports multiple simultaneous game rooms
- **Room Creation**: Host creates a game room with a unique code
- **Join by Code**: Second player can join using a 6-digit code
- **Synchronization**: Real-time synchronization of all player actions

#### Quality of Life Features
- **Invincibility Frames**: 500ms of immunity after taking damage with visual blinking feedback
- **Visual Effects**: Particle explosions, camera shake on impacts, and hit-stop effects for satisfying combat feedback
- **Ghost Trail**: Visual trail effect following the player for enhanced movement perception
- **Parallax Starfield**: Three-layer animated background with stars moving at different speeds for depth
- **UI Polish**: Health bars for enemies, glowing player outline, and pulsating arena borders
- **Smooth Animations**: Fluid transitions and visual feedback for all game interactions

### 🎮 Gameplay and Game Loop

1. **Game Start**: Player chooses between single-player or multiplayer
2. **Setup**: In multiplayer – creating/joining a room
3. **Main Loop**:
   - Move ship to avoid enemies
   - Shoot at waves of opponents
   - Collect healing items
   - Survive against increasing difficulty
4. **Game End**: After losing all health – save result to leaderboard (if logged in and score > 0)

### 📸 Game Demo

| Main Menu | Single Player |
|:---:|:---:|
| ![Main Menu](demo/SS_menu_demo.jfif) | ![Single Player](demo/SS_gameplay_single_demo.jfif) |

| Multiplayer | Cooperative Play |
|:---:|:---:|
| ![Multiplayer](demo/SS_mp_demo.jfif) | ![Cooperative Play](demo/SS_gameplay_mp_demo.jfif) |

---

## 🛠 Technical Documentation

## 🏗 Backend Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                      │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 Express Server                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │   Auth      │ │ Leaderboard │ │    WebSocket    │   │
│  │ Middleware  │ │   Router    │ │    Handler      │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Service Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ AuthService │ │ Leaderboard │ │  RoomManager    │   │
│  │             │ │  Service    │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 Data Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Prisma     │ │ PostgreSQL  │ │   WebSocket     │   │
│  │   ORM       │ │  Database   │ │  Connections    │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

### Core technologies
- **Node.js** (v18+) – JavaScript runtime
- **TypeScript** – statically-typed superset of JavaScript
- **Express.js** – web framework for building REST APIs
- **WebSocket (ws)** – real-time communication layer
- **Prisma ORM** – modern ORM for database access
- **PostgreSQL** – relational database
- **Docker** – containerization for effortless deployment

### Auxiliary libraries
- **bcrypt** – password hashing
- **jsonwebtoken** – JWT authentication
- **cors** – Cross-Origin Resource Sharing configuration
- **cookie-parser** – cookie handling
- **express-ws** – WebSocket integration for Express

## 📊 Database Schema

### Entity Relationship Diagram
```sql
┌─────────────────┐
│      User       │
├─────────────────┤
│ id: UUID (PK)   │
│ username: TEXT  │
│ password: TEXT  │ 
│ score: INTEGER  │
│ created_at: TS  │
│ updated_at: TS  │
└─────────────────┘

-- Prisma Schema Definition:
model User {
  id       String @id @default(uuid())
  username String @unique
  password String
  score    Int    @default(0)
  
  @@map("users")
}
```

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)
```typescript
POST   /api/auth/register
  Body: { username: string, password: string }
  Response: { id: string, username: string, score: number }
  
POST   /api/auth/login  
  Body: { username: string, password: string }
  Headers: Set-Cookie: authToken=<JWT>; HttpOnly; Secure
  Response: { id: string, username: string, score: number }
  
POST   /api/auth/logout
  Headers: Clear authToken cookie
  Response: { message: "Logged out" }
```

### Leaderboard Routes (`/api/leaderboard`)
```typescript
GET    /api/leaderboard
  Query: ?limit=10&offset=0
  Response: { users: User[], total: number }
  
PUT    /api/leaderboard
  Body: { username: string, score: number }
  Response: User (created/updated record)
  Note: Only updates if new score > existing score
```

## 🏗 Project Architecture

### Directory layout
```
src/
├── server.ts            # HTTP + WebSocket entry point
├── ws.ts                # WebSocket message handler
├── middlewares/         # Express middleware
│   └── auth.ts          # Authentication middleware
├── routers/             # REST API routes
│   ├── auth.ts          # Login & registration
│   └── leaderboard.ts   # Leaderboard endpoints
├── services/            # Business logic
│   ├── auth.ts          # Auth service
│   ├── leaderboard.ts   # Leaderboard service
│   └── roomManager.ts   # Game-room manager
└── prisma/              # Database config
    └── prisma.ts        # Prisma Client wrapper
```

## 🔄 WebSocket Protocol Specification

### Connection Lifecycle
```
1. Client → WS://host:port/game (with JWT cookie)
2. Server validates JWT → extracts username
3. Server checks for existing session → disconnect if found
4. Store new connection in activeUserSockets Map
5. Ready for game messages
```

### Message Protocol
```typescript
interface WSMessage {
  type: string;
  data: any;
  correlationId?: string;
  timestamp: number;
  playerId?: string;
}

// Room Management
type RoomCreateMessage = {
  type: 'roomCreate';
  data: { hostId: string };
}

type RoomJoinMessage = {
  type: 'roomJoin';  
  data: { code: string; playerId: string };
}

// Game State Synchronization  
type GameStateMessage = {
  type: 'gameState';
  data: {
    players: PlayerState[];
    enemies: EnemyState[];
    projectiles: ProjectileState[];
    timestamp: number;
  };
}

type PlayerActionMessage = {
  type: 'playerPosition' | 'playerShoot';
  data: { x: number; y: number; [key: string]: any };
  playerId: string;
}
```

### Authority Model
- **Host Authority**: Enemy spawning, scoring, game events
- **Peer Authority**: Individual player movements and actions
- **Server Authority**: Room management, authentication, persistence

### Session Management
```typescript
// Single session enforcement
const activeUserSockets = new Map<string, WebSocket>();

function validateSession(username: string, ws: WebSocket): boolean {
  const existing = activeUserSockets.get(username);
  if (existing && existing !== ws && existing.readyState === WebSocket.OPEN) {
    existing.close(1000, 'New session started');
  }
  activeUserSockets.set(username, ws);
  return true;
}
```

## 🛡 Security Implementation

### Authentication Flow
```typescript
// JWT Token Generation
const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Password Security
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Cookie Configuration
app.use(cookieParser());
const cookieOptions = {
  httpOnly: true,    // Prevent XSS
  secure: true,      // HTTPS only
  sameSite: 'strict' // CSRF protection
};
```

### WebSocket Security
- JWT validation on connection
- Rate limiting for message types
- Input sanitization for all payloads
- CORS configuration for trusted origins

## 🚀 Deployment Architecture

### Container Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Docker Compose Stack
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/spaceshooter
      - JWT_SECRET=${JWT_SECRET}
    depends_on: [db]
    
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: spaceshooter
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: ["db-data:/var/lib/postgresql/data"]
```

### Performance Monitoring
- **WebSocket Connections**: Track concurrent connections
- **Database Queries**: Monitor response times with Prisma metrics
- **Memory Usage**: Monitor for memory leaks in long-running sessions
- **Error Rates**: Log and track authentication failures and WebSocket errors

---

## 🛠 Development Setup

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- **PostgreSQL** (local or Docker)
- **Docker & Docker Compose** (optional)

### Environment Configuration
```bash
# .env file
DATABASE_URL="postgresql://postgres:password@localhost:5432/spaceshooter"
JWT_SECRET="your-super-secret-key-here"
JWT_EXPIRES_IN="1h"
SALT_ROUNDS=10
PORT=3000
```

### Quick Start
```bash
# Install dependencies
npm install

# Setup database (Docker)
docker-compose up -d db

# Run migrations
npm run migrations:up

# Start development server
npm run start:dev
```

### Development Commands
```bash
npm run start:dev        # Start with hot reload
npm run build           # Compile TypeScript
npm run migrations:up   # Apply database migrations
npm run migrations:dev  # Create new migration

# Database tools
npx prisma studio       # Visual database browser
npx prisma generate     # Regenerate Prisma client
npx prisma db seed      # Seed database with test data
```

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password123"}'

# WebSocket connection test
wscat -c ws://localhost:3000/game
```