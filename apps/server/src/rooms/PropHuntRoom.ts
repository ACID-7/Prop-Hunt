import { Room, Client } from "@colyseus/core";
import { GameRoomState, PlayerState } from "./RoomState";
import { GameLoop } from "../logic/GameLoop";
import { applyVelocity } from "../logic/MovementValidator";
import {
  ClientMessage,
  MAP_OBJECTS,
  TRANSFORM_RANGE,
  HUNTER_ATTACK_RANGE,
  HUNTER_ATTACK_COOLDOWN,
  PHASE_LOBBY,
  PHASE_ROUND_END,
  PHASE_HUNTING,
  PHASE_HIDING,
  ROLE_HUNTER,
  ROLE_PROP,
  MIN_PLAYERS_TO_START,
  MAX_PLAYERS,
} from "@prop-hunt/shared";

export class PropHuntRoom extends Room<GameRoomState> {
  maxClients = MAX_PLAYERS;

  // Track last tick time per player for movement interpolation
  private lastTickTime: Map<string, number> = new Map();
  private gameLoop: GameLoop;

  onCreate() {
    this.setState(new GameRoomState());
    this.gameLoop = new GameLoop((type, msg) => this.broadcast(type, msg));
    this.gameLoop.start(this.state);

    this.onMessage("*", (client, message: ClientMessage) => {
      this.handleMessage(client, message);
    });

    // Tick loop for movement (20Hz)
    this.setSimulationInterval((dt) => this.simulationTick(dt), 50);

    console.log(`[Room] ${this.roomId} created`);
  }

  onJoin(client: Client, options: { name?: string }) {
    const player = new PlayerState();
    player.sessionId = client.sessionId;
    player.name = options?.name ?? `Player_${client.sessionId.slice(0, 4)}`;
    player.x = 400 + Math.random() * 100;
    player.y = 300 + Math.random() * 100;
    this.state.players.set(client.sessionId, player);
    this.lastTickTime.set(client.sessionId, Date.now());

    console.log(`[Room] ${client.sessionId} joined as ${player.name}`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.lastTickTime.delete(client.sessionId);
    console.log(`[Room] ${client.sessionId} left`);
  }

  onDispose() {
    this.gameLoop.stop();
    console.log(`[Room] ${this.roomId} disposed`);
  }

  private handleMessage(client: Client, message: ClientMessage) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    switch (message.type) {
      case "ready":
        this.handleReady(client, player);
        break;
      case "transform":
        this.handleTransform(client, player, message.objectId);
        break;
      case "attack":
        this.handleAttack(client, player);
        break;
      case "rematch":
        this.handleRematch(client, player);
        break;
      // Movement is handled via simulation interval with client velocity
      case "move":
        this.setPlayerVelocity(client.sessionId, message.vx, message.vy);
        break;
    }
  }

  // Store pending velocities to apply in simulation
  private velocities: Map<string, { vx: number; vy: number }> = new Map();

  private setPlayerVelocity(sessionId: string, vx: number, vy: number) {
    this.velocities.set(sessionId, { vx, vy });
  }

  private simulationTick(deltaTime: number) {
    const phase = this.state.phase;
    if (phase !== PHASE_HIDING && phase !== PHASE_HUNTING) return;

    this.state.players.forEach((player, sessionId) => {
      if (!player.isAlive) return;
      const vel = this.velocities.get(sessionId);
      if (!vel || (vel.vx === 0 && vel.vy === 0)) return;

      const pos = applyVelocity(player.x, player.y, vel.vx, vel.vy, deltaTime);
      player.x = pos.x;
      player.y = pos.y;
    });
  }

  private handleReady(client: Client, player: PlayerState) {
    if (this.state.phase !== PHASE_LOBBY) return;
    player.isReady = !player.isReady;

    // Check if all players are ready
    const players = Array.from(this.state.players.values());
    if (
      players.length >= MIN_PLAYERS_TO_START &&
      players.every((p) => p.isReady)
    ) {
      this.gameLoop.startCountdown(this.state);
    }
  }

  private handleTransform(
    client: Client,
    player: PlayerState,
    objectId: string | null
  ) {
    const phase = this.state.phase;
    if (phase !== PHASE_HIDING && phase !== PHASE_HUNTING) return;
    if (player.role !== ROLE_PROP) return;

    if (objectId === null) {
      // Untransform
      player.isTransformed = false;
      player.transformedObjectId = "";
      this.broadcast("transform_result", {
        type: "transform_result",
        playerId: client.sessionId,
        objectId: null,
        success: true,
      });
      return;
    }

    // Validate object exists and is in range
    const obj = MAP_OBJECTS.find((o) => o.id === objectId);
    if (!obj) return;

    const dist = Math.hypot(player.x - (obj.x + obj.width / 2), player.y - (obj.y + obj.height / 2));
    if (dist > TRANSFORM_RANGE) {
      client.send("error", { message: "Too far from object!" });
      return;
    }

    player.isTransformed = true;
    player.transformedObjectId = objectId;

    this.broadcast("transform_result", {
      type: "transform_result",
      playerId: client.sessionId,
      objectId,
      success: true,
    });
  }

  private handleAttack(client: Client, player: PlayerState) {
    if (this.state.phase !== PHASE_HUNTING) return;
    if (player.role !== ROLE_HUNTER) return;

    const now = Date.now();
    if (now - player.lastAttackTime < HUNTER_ATTACK_COOLDOWN) {
      client.send("error", { message: "Attack on cooldown!" });
      return;
    }
    player.lastAttackTime = now;

    // Find closest prop within range
    let closestProp: PlayerState | null = null;
    let closestDist = HUNTER_ATTACK_RANGE;

    this.state.players.forEach((target) => {
      if (target.role !== ROLE_PROP || !target.isAlive) return;
      const dist = Math.hypot(player.x - target.x, player.y - target.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestProp = target;
      }
    });

    if (closestProp) {
      (closestProp as PlayerState).isAlive = false;
      (closestProp as PlayerState).isTransformed = false;

      this.broadcast("attack_result", {
        type: "attack_result",
        attackerId: client.sessionId,
        targetId: (closestProp as PlayerState).sessionId,
        hit: true,
      });
    } else {
      this.broadcast("attack_result", {
        type: "attack_result",
        attackerId: client.sessionId,
        targetId: null,
        hit: false,
      });
    }
  }

  private handleRematch(client: Client, player: PlayerState) {
    if (this.state.phase !== PHASE_ROUND_END && this.state.phase !== PHASE_LOBBY) return;
    player.isReady = true;

    const players = Array.from(this.state.players.values());
    if (players.length >= MIN_PLAYERS_TO_START && players.every((p) => p.isReady)) {
      this.gameLoop.startCountdown(this.state);
    }
  }
}

