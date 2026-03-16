import * as Colyseus from "colyseus.js";
import { ClientMessage } from "@prop-hunt/shared";

// Re-export state types for use in React components
// These mirror the server schema shapes
export interface PlayerState {
  sessionId: string;
  name: string;
  x: number;
  y: number;
  role: "prop" | "hunter";
  isReady: boolean;
  isAlive: boolean;
  isTransformed: boolean;
  transformedObjectId: string;
  score: number;
  lastAttackTime: number;
}

export interface GameRoomState {
  phase: string;
  timer: number;
  players: Map<string, PlayerState>;
  winnerRoles: string[];
  round: number;
  winReason: string;
}

const COLYSEUS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567")
    : "ws://localhost:2567";

let client: Colyseus.Client | null = null;
let room: Colyseus.Room | null = null;

export function getClient(): Colyseus.Client {
  if (!client) {
    client = new Colyseus.Client(COLYSEUS_URL);
  }
  return client;
}

export async function joinOrCreateRoom(
  roomId: string,
  name: string
): Promise<Colyseus.Room> {
  const c = getClient();
  room = await c.joinById(roomId, { name });
  return room;
}

export function sendMessage(msg: ClientMessage) {
  room?.send(msg.type, msg);
}

export function getRoom(): Colyseus.Room | null {
  return room;
}

export function leaveRoom() {
  room?.leave();
  room = null;
}
