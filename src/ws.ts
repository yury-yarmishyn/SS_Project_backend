import type { WebSocketServer, RawData } from 'ws';
import { WebSocket } from 'ws';

import { createRoom, joinRoomByCode, getRoomById, removePlayerFromRoom } from './services/roomManager';

// Map to track active connections per username (single-session enforcement)
const activeUserSockets = new Map<string, WebSocket>();

function hasActiveSession(username?: string, currentWs?: WebSocket): boolean {
  if (!username) return false;
  const existing = activeUserSockets.get(username);
  return !!existing && existing !== currentWs && existing.readyState === WebSocket.OPEN;
}

function registerActiveSession(username: string | undefined, ws: WebSocket) {
  if (!username) return;
  activeUserSockets.set(username, ws);
  (ws as any).username = username;
}

export function removeActiveSession(username?: string, ws?: WebSocket) {
  if (!username) return;
  const existing = activeUserSockets.get(username);
  if (existing === ws || !existing) {
    activeUserSockets.delete(username);
  }
}

export interface IncomingMessage {
  type: string;
  [key: string]: any;
}

/**
 * Handles an incoming WebSocket message from a client. Supports both
 * room management actions (e.g., roomCreate) and generic game actions.
 */
export function handleGameAction(
  ws: WebSocket,
  wss: WebSocketServer,
  data: RawData,
): void {
  let msg: IncomingMessage;
  try {
    msg = JSON.parse(data.toString());
  } catch (err) {
    console.error('Invalid message format:', err);
    ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
    return;
  }

  const { type } = msg;

  switch (type) {
    case 'roomCreate': {
      const { correlationId, hostId, username } = msg;

      if (hasActiveSession(username, ws)) {
        ws.send(
          JSON.stringify({
            type: 'roomCreate_FAILURE',
            correlationId,
            error: 'ACTIVE_SESSION_EXISTS',
          }),
        );
        break;
      }

      const room = createRoom(hostId ?? 'host-' + Math.random().toString(36).slice(2));

      // Update host player's username if provided
      if (username) {
        room.players[0].username = username;
        room.players[0].name = username;
      }

      // Attach identifiers to WebSocket instance for later cleanup
      (ws as any).playerId = room.hostId;
      (ws as any).roomId = room.id;

      registerActiveSession(username, ws);

      const response = {
        type: 'roomCreate_SUCCESS',
        correlationId,
        roomId: room.id,
        code: room.code,
        players: room.players,
      };
      ws.send(JSON.stringify(response));
      break;
    }

    case 'roomJoin': {
      const { correlationId, code, playerId: incomingId, username } = msg;

      if (hasActiveSession(username, ws)) {
        ws.send(
          JSON.stringify({
            type: 'roomJoin_FAILURE',
            correlationId,
            error: 'ACTIVE_SESSION_EXISTS',
          }),
        );
        break;
      }

      const resolvedId = incomingId ?? 'guest-' + Math.random().toString(36).slice(2);

      const room = joinRoomByCode(code, {
        id: resolvedId,
        username,
        name: username,
        status: 'guest',
      });

      if (!room) {
        ws.send(
          JSON.stringify({
            type: 'roomJoin_FAILURE',
            correlationId,
            error: 'Room not found or full',
          }),
        );
        break;
      }

      // Remember mapping for disconnection cleanup
      (ws as any).playerId = resolvedId;
      (ws as any).roomId = room.id;

      registerActiveSession(username, ws);

      const successPayload = {
        type: 'roomJoin_SUCCESS',
        correlationId,
        roomId: room.id,
        code: room.code,
        players: room.players,
      };
      ws.send(JSON.stringify(successPayload));

      // Notify other players in the room (e.g., host) about update
      const updateMsg = {
        type: 'roomUpdate',
        roomId: room.id,
        code: room.code,
        players: room.players,
      };
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(updateMsg));
        }
      });
      break;
    }

    case 'room:leave': {
      const { roomId, playerId } = msg;
      if (!roomId || !playerId) break;

      const room = getRoomById(roomId);
      if (!room) break;

      const isHostLeaving = room.hostId === playerId;

      removePlayerFromRoom(roomId, playerId);

      if (isHostLeaving || room.players.length === 0) {
        // Inform remaining players that room was closed
        const closedMsg = { type: 'roomClosed', roomId };
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(closedMsg));
          }
        });
      } else {
        const updateMsg = {
          type: 'roomUpdate',
          roomId: room.id,
          code: room.code,
          players: room.players,
        };
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updateMsg));
          }
        });
      }
      break;
    }

    default: {
      // By default, broadcast the message to all other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
      break;
    }
  }
}
