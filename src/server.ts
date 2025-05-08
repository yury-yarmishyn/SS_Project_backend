import type { Application, Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import type { WebsocketRequestHandler } from 'express-ws';
import expressWs from 'express-ws';
import type { RawData, WebSocket } from 'ws';

import leaderboardRouter from './routers/leaderboard';
import authRouter from './routers/auth';
import { authMiddleware } from './middlewares/auth';
import { handleGameAction } from './ws';

//
// 1) Create base Express app & REST routes
//
const baseApp: Application = express();
const port = parseInt(process.env.PORT ?? '3000', 10);

baseApp.use(cors());
baseApp.use(express.json());

baseApp.use('/auth', authRouter);
baseApp.use(authMiddleware); // protect REST
baseApp.use('/leaderboard', leaderboardRouter);

//
// 2) “Enhance” with express-ws
//
const { app, getWss } = expressWs(baseApp);
// — now `app` has `.ws(path, ...handlers)` on it

//
// 3) Wrap authMiddleware for WebSocket handshakes
//
const wsAuth: WebsocketRequestHandler = (ws, req, next) => {
  // We need a dummy `res`, because authMiddleware has signature (req, res, next)
  authMiddleware(req as Request, {} as Response, (err?: any) => {
    if (err) {
      // Authentication failed → close the socket with a policy‐violation code
      ws.close(1008, 'Unauthorized');
    } else {
      // Auth passed → proceed to the real WS handler
      next();
    }
  });
};

//
// 4) Mount your protected WebSocket endpoint
//
app.ws(
  '/ws', // clients connect to ws://host:port/ws
  wsAuth, // run auth first
  (ws: WebSocket, req) => {
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
  },
);

//
// 5) Start your server (HTTP + WS share this port)
//
app.listen(port, () => {
  console.log(`🚀 HTTP + WS listening on http://localhost:${port}`);
});
