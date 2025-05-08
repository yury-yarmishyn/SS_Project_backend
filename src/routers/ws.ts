import type { WebSocketServer, WebSocket } from 'ws';
import { handleGameAction } from '../ws';
import type { RawData } from 'ws';

/**
 * Attaches WebSocket event handlers to the given server instance.
 */
export default function setupWsHandlers(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('New player connected');

    ws.on('message', (data: RawData) => {
      handleGameAction(ws, wss, data);
    });

    ws.on('close', () => {
      console.log('Player disconnected');
    });
  });
}
