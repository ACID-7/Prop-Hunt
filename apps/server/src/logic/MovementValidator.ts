import { MAP_WIDTH, MAP_HEIGHT, PLAYER_SPEED } from "@prop-hunt/shared";

const HALF_PLAYER = 16; // half player hitbox size

export function clampPosition(
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: Math.max(HALF_PLAYER, Math.min(MAP_WIDTH - HALF_PLAYER, x)),
    y: Math.max(HALF_PLAYER, Math.min(MAP_HEIGHT - HALF_PLAYER, y)),
  };
}

export function applyVelocity(
  x: number,
  y: number,
  vx: number,
  vy: number,
  deltaMs: number
): { x: number; y: number } {
  // Normalize diagonal movement
  const len = Math.sqrt(vx * vx + vy * vy);
  const nx = len > 0 ? vx / len : 0;
  const ny = len > 0 ? vy / len : 0;

  const newX = x + nx * PLAYER_SPEED * (deltaMs / 1000);
  const newY = y + ny * PLAYER_SPEED * (deltaMs / 1000);

  return clampPosition(newX, newY);
}

