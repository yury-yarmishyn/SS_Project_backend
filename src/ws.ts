import type { WebSocketServer, RawData } from 'ws';
import { WebSocket } from 'ws';

import { createRoom, joinRoomByCode, getRoomById, removePlayerFromRoom } from './services/roomManager';

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
      const room = createRoom(hostId ?? 'host-' + Math.random().toString(36).slice(2));

      // Update host player's username if provided
      if (username) {
        room.players[0].username = username;
        room.players[0].name = username;
      }

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
      const { correlationId, code, playerId, username } = msg;

      const room = joinRoomByCode(code, {
        id: playerId ?? 'guest-' + Math.random().toString(36).slice(2),
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
