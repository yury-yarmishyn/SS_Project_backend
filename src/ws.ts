import type { WebSocketServer, RawData } from 'ws';
import { WebSocket } from 'ws';

export interface GameAction {
  type: 'move' | 'shoot';
  payload: Record<string, any>;
}

/**
 * Processes a raw WebSocket message: parses, validates, and broadcasts the action.
 */
export function handleGameAction(
  ws: WebSocket,
  wss: WebSocketServer,
  data: RawData,
): void {
  let action: GameAction;
  try {
    action = JSON.parse(data.toString()) as GameAction;
  } catch (err) {
    console.error('Invalid message format:', err);
    ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  // Validate action type
  if (!['move', 'shoot'].includes(action.type)) {
    ws.send(JSON.stringify({ error: 'Unknown action type' }));
    return;
  }

  // Broadcast the action to all other clients
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(action));
    }
  });
}
