# SS Space Shooter – backend

This repository contains the backend part of the educational project *Space Shooter*, written in **TypeScript** using **Express**, **WebSocket**, and **Prisma ORM**.

---
## Requirements

* Node.js **v18** or newer
* npm **v9** or newer (comes with Node)
* **Docker** and **docker-compose** – only if you want to quickly start PostgreSQL locally

---
## Environment variables
```bash
# database connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/spaceshooter"

# authentication parameters
JWT_SECRET="my_super_secret"   # required! any long random string
JWT_EXPIRES_IN="1h"            # optional, default is 1h
SALT_ROUNDS=10                 # bcrypt salt rounds, default is 10

# HTTP/WS server port
PORT=3000
```

---
## Running PostgreSQL with Docker (optional)

If you don't have PostgreSQL installed locally, use the provided compose file:

```bash
docker-compose up -d   # starts the container in the background
docker-compose logs -f # view logs (optional)
```

After startup the database will be available at `localhost:5432`, and data will persist in the `db-data` volume.

---
## Applying Prisma migrations

```bash
npm run migrations:up   # runs prisma migrate deploy
```

If you are developing the schema, use:

```bash
npx prisma migrate dev --name <migration_name>
```

---
## Starting the server in development mode

```bash
npm run start:dev
```

* The REST and WebSocket servers will be available at `http://localhost:${PORT}` (default `3000`).
* WebSocket endpoint — `ws://localhost:${PORT}/game`.

---
## Project structure (briefly)

```
src/
  server.ts        — HTTP + WS entry point
  ws.ts            — game WebSocket message handler
  routers/         — REST routers (auth, leaderboard, etc.)
  services/        — business logic
  middlewares/     — Express middlewares
prisma/
  schema.prisma    — database schema
  migrations/      — Prisma migrations
```

---
## Useful commands

```bash
npx prisma studio           # GUI for the database
npx prisma generate         # regenerate Prisma Client
```