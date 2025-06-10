import type { Application, Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { WebsocketRequestHandler } from 'express-ws';
import expressWs from 'express-ws';
import type { RawData, WebSocket } from 'ws';

import leaderboardRouter from './routers/leaderboard';
import authRouter from './routers/auth';
import { authMiddleware } from './middlewares/auth';
import { handleGameAction } from './ws';

const baseApp: Application = express();
const port = parseInt(process.env.PORT ?? '3000', 10);

baseApp.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
baseApp.use(express.json());
baseApp.use(cookieParser());

baseApp.use('/auth', authRouter);
baseApp.use('/leaderboard', leaderboardRouter);

// Protected routes
baseApp.use(authMiddleware);

const { app, getWss } = expressWs(baseApp);

app.ws('/game', (ws: WebSocket, req) => {
  console.log('✅ WS connected, user=', (req as any).user);

  ws.on('message', (data: RawData) => {
    handleGameAction(ws, getWss(), data);
  });

  ws.on('close', () => {
    console.log('🛑 WS client disconnected');
  });

  ws.on('error', (err) => {
    console.error('❌ WS error:', err);
  });
});

app.listen(port, () => {
  console.log(`🚀 HTTP + WS listening on http://localhost:${port}`);
});
