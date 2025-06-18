import { WebSocketServer, WebSocket } from 'ws';
import { handleGameAction, removeActiveSession } from '../ws';
import { removePlayerFromRoom, getRoomById } from '../services/roomManager';
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

      const playerId = (ws as any).playerId as string | undefined;
      const roomId = (ws as any).roomId as string | undefined;

      if (playerId && roomId) {
        removePlayerFromRoom(roomId, playerId);

        const room = getRoomById(roomId);
        // Inform remaining clients about room update or closure
        const message = room
          ? {
              type: 'roomUpdate',
              roomId: room.id,
              code: room.code,
              players: room.players,
            }
          : { type: 'roomClosed', roomId };

        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify(message));
            } catch (_) {/* ignore */}
          }
        });
      }

      // Clear active-session tracking
      const username = (ws as any).username as string | undefined;
      if (username) {
        removeActiveSession(username, ws);
      }
    });
  });
}
