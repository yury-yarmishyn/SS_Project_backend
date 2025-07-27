# SS Space Shooter – Backend

## 🎮 About the Game

**SS Space Shooter** is an exciting top-down space shooter where players pilot a combat spaceship in a confined arena, battling waves of hostile aliens and striving to survive as long as possible.

### 🎯 Rules and Objectives

- **Main Goal**: Survive as long as possible and achieve the highest score
- **Controls**: Move the ship around the arena and shoot at enemies
- **Health**: Player has limited health that decreases upon contact with enemies or their projectiles
- **Score**: Points are awarded for destroying enemies (1 point for regular enemies, 30 points for bosses)
- **Healing**: Health items spawn in the arena to restore player's health

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
- **Leaderboard**: Competition for the best score among players

#### Multiplayer
- **Cooperative Mode**: Up to 2 players can play together
- **Room Creation**: Host creates a game room with a unique code
- **Join by Code**: Second player can join using a 6-digit code
- **Synchronization**: Real-time synchronization of all player actions

### 🎮 Gameplay and Game Loop

1. **Game Start**: Player chooses between single-player or multiplayer
2. **Setup**: In multiplayer — creating/joining a room
3. **Main Loop**:
   - Move ship to avoid enemies
   - Shoot at waves of opponents
   - Collect healing items
   - Survive against increasing difficulty
4. **Game End**: After losing all health — save result to leaderboard

### 📸 Game Demo

| Main Menu | Single Player |
|:---:|:---:|
| ![Main Menu](demo/SS_menu_demo.jfif) | ![Single Player](demo/SS_gameplay_single_demo.jfif) |

| Multiplayer | Cooperative Play |
|:---:|:---:|
| ![Multiplayer](demo/SS_mp_demo.jfif) | ![Cooperative Play](demo/SS_gameplay_mp_demo.jfif) |

---

## 🛠 Техническая документация

This repository contains the backend part of the educational project **Space Shooter**, written in **TypeScript** using **Express**, **WebSocket**, and **Prisma ORM**.

## 🛠 Tech Stack

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

## 🔄 Connection & Synchronization

### WebSocket architecture

#### 1. Connection establishment
- The client connects to the `/game` endpoint.
- A JWT token from a cookie is validated.
- A dedicated user session is created and stored.

#### 2. Session management
```typescript
// Enforce a single active session per user
const activeUserSockets = new Map<string, WebSocket>();

function hasActiveSession(username?: string, currentWs?: WebSocket): boolean {
  if (!username) return false;
  const existing = activeUserSockets.get(username);
  return !!existing && existing !== currentWs && existing.readyState === WebSocket.OPEN;
}
```

#### 3. Room manager

**Room structure:**
```typescript
interface Room {
  id: string;            // Room UUID
  code: string;          // 6-character join code
  hostId: string;        // Host player ID
  players: PlayerInfo[]; // Up to 2 players (host + guest)
  createdAt: number;     // Unix timestamp
}
```

**Key operations**
- `createRoom(hostId)` – create a new room
- `joinRoomByCode(code, player)` – join by code
- `removePlayerFromRoom(roomId, playerId)` – remove a player
- Empty rooms (or rooms whose host left) are deleted automatically.

#### 4. Game-state synchronization

**Message types:**
- `roomCreate` / `roomJoin` – room management
- `gameState` – full game state sync
- `playerPosition` – player position updates
- `playerShoot` – player shots
- `enemySpawn` / `enemyAction` – enemies and their actions
- `scoreUpdate` – score changes

**Broadcast pattern:**
```typescript
// Broadcast to every client except the sender
wss.clients.forEach((client) => {
  if (client !== ws && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(msg));
  }
});
```

#### 5. Authoritative model
- The **Host** is authoritative for enemy spawns and game events.
- The **Guest** only sends its own actions.
- Request-response pattern implemented via `correlationId`.
- Graceful handling of disconnects & reconnects.

#### 6. Security
- JWT authentication for WebSocket connections
- Single active session per user
- Validation of incoming messages
- Automatic resource cleanup on disconnect

---

## Requirements

* Node.js **v18** or newer
* npm **v9** or newer (bundled with Node)
* **Docker** and **docker-compose** – only if you want to spin up PostgreSQL quickly

---
## Environment variables
```bash
# Database connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/spaceshooter"

# Authentication parameters
JWT_SECRET="my_super_secret"   # required – any long random string
JWT_EXPIRES_IN="1h"            # optional, default 1h
SALT_ROUNDS=10                  # bcrypt salt rounds, default 10

# HTTP/WS server port
PORT=3000
```

---
## Running PostgreSQL with Docker (optional)
```bash
docker-compose up -d   # start container in background
docker-compose logs -f # view logs (optional)
```
The database becomes available at `localhost:5432`; data persists in the `db-data` volume.

---
## Applying Prisma migrations
```bash
npm run migrations:up   # prisma migrate deploy
```
For development:
```bash
npx prisma migrate dev --name <migration_name>
```

---
## Starting the server (development)
```bash
npm run start:dev
```
* REST & WebSocket server: `http://localhost:${PORT}` (default `3000`)
* WebSocket endpoint: `ws://localhost:${PORT}/game`

---
## Useful commands
```bash
npx prisma studio    # GUI for inspecting the DB
npx prisma generate  # regenerate Prisma Client
```