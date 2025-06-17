import { randomUUID } from 'crypto';
import type { WebSocket } from 'ws';

export interface PlayerInfo {
  id: string;
  username?: string;
  name?: string;
  status?: 'host' | 'guest';
  ws?: WebSocket;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: PlayerInfo[];
  createdAt: number;
}

const roomsById = new Map<string, Room>();
const roomsByCode = new Map<string, Room>();

/**
 * Generates a random room code consisting of 6 alphanumeric uppercase characters.
 * Ensures the generated code is unique among existing rooms.
 */
function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (roomsByCode.has(code));
  return code;
}

/**
 * Creates a new game room with a unique ID and code.
 * @param hostId The identifier of the host player.
 */
export function createRoom(hostId: string): Room {
  const id = randomUUID();
  const code = generateUniqueCode();

  const room: Room = {
    id,
    code,
    hostId,
    players: [{ id: hostId, status: 'host', username: 'Host', name: 'Host' }],
    createdAt: Date.now(),
  };

  roomsById.set(id, room);
  roomsByCode.set(code, room);

  return room;
}

export function getRoomById(id: string): Room | undefined {
  return roomsById.get(id);
}

export function getRoomByCode(code: string): Room | undefined {
  return roomsByCode.get(code);
}

export function addPlayerToRoom(roomId: string, player: PlayerInfo): void {
  const room = roomsById.get(roomId);
  if (!room) return;
  if (!room.players.find((p) => p.id === player.id)) {
    room.players.push(player);
  }
}

export function deleteRoom(roomId: string): void {
  const room = roomsById.get(roomId);
  if (!room) return;
  roomsById.delete(roomId);
  roomsByCode.delete(room.code);
}

export function removePlayerFromRoom(roomId: string, playerId: string): void {
  const room = roomsById.get(roomId);
  if (!room) return;
  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.players.length === 0 || playerId === room.hostId) {
    // Remove room if empty or host left
    deleteRoom(roomId);
  }
}

/**
 * Attempts to add a player as guest by room code.
 * Returns updated room or undefined if room not found or full.
 */
export function joinRoomByCode(code: string, player: PlayerInfo): Room | undefined {
  const room = roomsByCode.get(code);
  if (!room) return undefined;

  // Room currently supports only host + 1 guest
  if (room.players.length >= 2) return undefined;

  // Prevent duplicate join
  if (room.players.find((p) => p.id === player.id)) return room;

  // Assign guest status if not already set
  player.status = player.status ?? 'guest';
  room.players.push(player);
  return room;
} 