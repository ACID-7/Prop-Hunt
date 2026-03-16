import { GameRoomState, PlayerState } from "../rooms/RoomState";
import { checkWinCondition } from "./WinCondition";
import {
  HIDING_PHASE_DURATION,
  HUNTING_PHASE_DURATION,
  ROUND_END_DURATION,
  PHASE_COUNTDOWN,
  PHASE_HIDING,
  PHASE_HUNTING,
  PHASE_ROUND_END,
  PHASE_LOBBY,
  ROLE_PROP,
  ROLE_HUNTER,
  MAP_WIDTH,
  MAP_HEIGHT,
} from "@prop-hunt/shared";
import { ArraySchema } from "@colyseus/core";

// Callback type for broadcasting events from room
type BroadcastFn = (type: string, message: unknown) => void;

export class GameLoop {
  private interval: ReturnType<typeof setInterval> | null = null;
  private phaseEndTime: number = 0;
  private broadcast: BroadcastFn;

  constructor(broadcast: BroadcastFn) {
    this.broadcast = broadcast;
  }

  start(state: GameRoomState) {
    this.stop();
    this.interval = setInterval(() => this.tick(state), 100);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  startCountdown(state: GameRoomState) {
    state.phase = PHASE_COUNTDOWN;
    this.phaseEndTime = Date.now() + 3000;
    state.timer = 3;
    this.assignRoles(state);
    this.resetPlayerPositions(state);
    this.broadcast("phase_change", { phase: PHASE_COUNTDOWN });
  }

  private assignRoles(state: GameRoomState) {
    const players = Array.from(state.players.values());
    const total = players.length;
    // ~1/3 hunters, rest are props (min 1 hunter)
    const hunterCount = Math.max(1, Math.floor(total / 3));

    const shuffled = players.sort(() => Math.random() - 0.5);
    shuffled.forEach((p, i) => {
      p.role = i < hunterCount ? ROLE_HUNTER : ROLE_PROP;
      p.isAlive = true;
      p.isTransformed = false;
      p.transformedObjectId = "";
    });
  }

  private resetPlayerPositions(state: GameRoomState) {
    const players = Array.from(state.players.values());
    players.forEach((p) => {
      // Spawn hunters on one side, props on other
      if (p.role === ROLE_HUNTER) {
        p.x = MAP_WIDTH - 150 + Math.random() * 100;
        p.y = 100 + Math.random() * (MAP_HEIGHT - 200);
      } else {
        p.x = 50 + Math.random() * 200;
        p.y = 100 + Math.random() * (MAP_HEIGHT - 200);
      }
    });
  }

  private tick(state: GameRoomState) {
    const now = Date.now();
    const remaining = Math.max(0, this.phaseEndTime - now);
    state.timer = Math.ceil(remaining / 1000);

    switch (state.phase) {
      case PHASE_COUNTDOWN:
        if (now >= this.phaseEndTime) this.enterHiding(state);
        break;
      case PHASE_HIDING:
        if (now >= this.phaseEndTime) this.enterHunting(state);
        break;
      case PHASE_HUNTING: {
        const { winner, reason } = checkWinCondition(state);
        if (winner || now >= this.phaseEndTime) {
          this.enterRoundEnd(state, winner ?? "props", reason || "Time's up! Props survived!");
        }
        break;
      }
      case PHASE_ROUND_END:
        if (now >= this.phaseEndTime) this.enterLobby(state);
        break;
    }
  }

  private enterHiding(state: GameRoomState) {
    state.phase = PHASE_HIDING;
    this.phaseEndTime = Date.now() + HIDING_PHASE_DURATION;
    state.timer = Math.ceil(HIDING_PHASE_DURATION / 1000);
    this.broadcast("phase_change", { phase: PHASE_HIDING });
  }

  private enterHunting(state: GameRoomState) {
    state.phase = PHASE_HUNTING;
    this.phaseEndTime = Date.now() + HUNTING_PHASE_DURATION;
    state.timer = Math.ceil(HUNTING_PHASE_DURATION / 1000);
    this.broadcast("phase_change", { phase: PHASE_HUNTING });
  }

  private enterRoundEnd(
    state: GameRoomState,
    winner: "props" | "hunters",
    reason: string
  ) {
    state.phase = PHASE_ROUND_END;
    this.phaseEndTime = Date.now() + ROUND_END_DURATION;
    state.timer = Math.ceil(ROUND_END_DURATION / 1000);
    state.winnerRoles = new ArraySchema<string>(winner);
    state.winReason = reason;
    state.round += 1;

    // Update scores
    const players = Array.from(state.players.values());
    players.forEach((p) => {
      if (
        (winner === "props" && p.role === ROLE_PROP && p.isAlive) ||
        (winner === "hunters" && p.role === ROLE_HUNTER)
      ) {
        p.score += 1;
      }
    });

    this.broadcast("round_end", { winner, reason });
  }

  private enterLobby(state: GameRoomState) {
    state.phase = PHASE_LOBBY;
    state.timer = 0;
    // Reset ready states for rematch
    const players = Array.from(state.players.values());
    players.forEach((p) => {
      p.isReady = false;
      p.isTransformed = false;
      p.transformedObjectId = "";
    });
    this.broadcast("phase_change", { phase: PHASE_LOBBY });
  }
}

