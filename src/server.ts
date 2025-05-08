import http from 'http';
import type { Application } from 'express';
import express from 'express';
import cors from 'cors';
import type { RawData, WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import leaderboardRouter from './routers/leaderboard';
import authRouter from './routers/auth';
import { authMiddleware } from './middlewares/auth';
import { handleGameAction } from './ws';

const app: Application = express();
const port = parseInt(process.env.PORT ?? '3000', 10);

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

app.use(authMiddleware);

app.use('/leaderboard', leaderboardRouter);

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');

  ws.on('message', (data: RawData) => {
    handleGameAction(ws, wss, data);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

server.listen(port, () => {
  console.log(`HTTP + WebSocket server listening on http://localhost:${port}`);
});
