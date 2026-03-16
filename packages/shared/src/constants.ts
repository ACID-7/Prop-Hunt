// Game phase durations in milliseconds
export const HIDING_PHASE_DURATION = 30_000;   // 30s for props to hide
export const HUNTING_PHASE_DURATION = 180_000; // 3 minutes to hunt
export const ROUND_END_DURATION = 8_000;       // show results for 8s
export const COUNTDOWN_DURATION = 3_000;       // pre-game countdown

// Player settings
export const PLAYER_SPEED = 200;               // pixels per second
export const HUNTER_ATTACK_RANGE = 80;         // pixels
export const HUNTER_ATTACK_COOLDOWN = 1500;    // ms
export const TRANSFORM_RANGE = 100;            // pixels from object to transform

// Map
export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 1200;
export const TILE_SIZE = 32;

// Room
export const MAX_PLAYERS = 8;
export const MIN_PLAYERS_TO_START = 2;

// Roles
export const ROLE_PROP = "prop" as const;
export const ROLE_HUNTER = "hunter" as const;

// Phases
export const PHASE_LOBBY = "lobby" as const;
export const PHASE_COUNTDOWN = "countdown" as const;
export const PHASE_HIDING = "hiding" as const;
export const PHASE_HUNTING = "hunting" as const;
export const PHASE_ROUND_END = "round_end" as const;
