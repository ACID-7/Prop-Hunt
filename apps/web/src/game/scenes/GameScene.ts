import Phaser from "phaser";
import * as Colyseus from "colyseus.js";
import {
  MAP_OBJECTS,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  HUNTER_ATTACK_COOLDOWN,
  TRANSFORM_RANGE,
  PHASE_HIDING,
  PHASE_HUNTING,
  PHASE_COUNTDOWN,
} from "@prop-hunt/shared";
import { LocalPlayer } from "../objects/LocalPlayer";
import { RemotePlayer } from "../objects/RemotePlayer";
import { MapObject } from "../objects/MapObject";
import { PlayerState } from "../network/ColyseusClient";

interface GameSceneData {
  room: Colyseus.Room;
  sessionId: string;
}

export class GameScene extends Phaser.Scene {
  private room!: Colyseus.Room;
  private sessionId!: string;

  private localPlayer!: LocalPlayer;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private mapObjects: MapObject[] = [];

  private attackFlash: Phaser.GameObjects.Image | null = null;
  private lastAttackTime: number = 0;

  // Expose state snapshot for React HUD
  stateSnapshot: {
    phase: string;
    timer: number;
    attackCooldownMs: number;
    isTransformed: boolean;
    nearbyObjectId: string | null;
  } = {
    phase: "lobby",
    timer: 0,
    attackCooldownMs: 0,
    isTransformed: false,
    nearbyObjectId: null,
  };

  onStateChange?: (snapshot: typeof this.stateSnapshot) => void;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: GameSceneData) {
    this.room = data.room;
    this.sessionId = data.sessionId;
  }

  create() {
    this.buildMap();
    this.setupRoom();

    // Attack flash effect
    this.attackFlash = this.add.image(0, 0, "attack_flash");
    this.attackFlash.setAlpha(0);

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  private buildMap() {
    // Floor tiles
    for (let x = 0; x < MAP_WIDTH; x += TILE_SIZE) {
      for (let y = 0; y < MAP_HEIGHT; y += TILE_SIZE) {
        this.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, "floor_tile");
      }
    }

    // Border walls
    for (let x = 0; x < MAP_WIDTH; x += TILE_SIZE) {
      this.add.image(x + TILE_SIZE / 2, TILE_SIZE / 2, "wall_tile");
      this.add.image(x + TILE_SIZE / 2, MAP_HEIGHT - TILE_SIZE / 2, "wall_tile");
    }
    for (let y = TILE_SIZE; y < MAP_HEIGHT - TILE_SIZE; y += TILE_SIZE) {
      this.add.image(TILE_SIZE / 2, y + TILE_SIZE / 2, "wall_tile");
      this.add.image(MAP_WIDTH - TILE_SIZE / 2, y + TILE_SIZE / 2, "wall_tile");
    }

    // Map objects (static props)
    MAP_OBJECTS.forEach((def) => {
      const obj = new MapObject(this, def);
      this.mapObjects.push(obj);
    });
  }

  private setupRoom() {
    const state = this.room.state;

    // Initial players
    state.players.forEach((player: PlayerState, sessionId: string) => {
      this.addPlayer(sessionId, player);
    });

    // Player join
    state.players.onAdd((player: PlayerState, sessionId: string) => {
      this.addPlayer(sessionId, player);
    });

    // Player leave
    state.players.onRemove((_: PlayerState, sessionId: string) => {
      const rp = this.remotePlayers.get(sessionId);
      if (rp) {
        rp.destroy();
        this.remotePlayers.delete(sessionId);
      }
    });

    // Player changes
    state.players.onChange((player: PlayerState, sessionId: string) => {
      if (sessionId === this.sessionId) {
        // Update local player from server
        if (this.localPlayer) {
          this.localPlayer.setServerPosition(player.x, player.y);
          this.localPlayer.updateRole(
            player.role,
            player.isAlive,
            player.isTransformed,
            player.transformedObjectId
          );
        }
      } else {
        const rp = this.remotePlayers.get(sessionId);
        if (rp) {
          rp.targetX = player.x;
          rp.targetY = player.y;
          rp.update(
            player.isAlive,
            player.isTransformed,
            player.role,
            player.transformedObjectId
          );
        }
      }
    });

    // Messages from server
    this.room.onMessage("attack_result", (msg) => {
      this.showAttackFlash(msg.attackerId, msg.hit);
    });

    this.room.onMessage("transform_result", () => {
      // Handled via state changes
    });
  }

  private addPlayer(sessionId: string, player: PlayerState) {
    if (sessionId === this.sessionId) {
      this.localPlayer = new LocalPlayer(
        this,
        player.x,
        player.y,
        player.name,
        player.role
      );

      this.localPlayer.onAttack = () => {
        const now = Date.now();
        if (now - this.lastAttackTime < HUNTER_ATTACK_COOLDOWN) return;
        this.lastAttackTime = now;
        this.room.send("attack", {});
      };

      this.localPlayer.onTransform = (objectId) => {
        this.room.send("transform", { objectId });
      };

      this.localPlayer.getNearbyObject = () => this.findNearbyObject();

      this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
    } else {
      const rp = new RemotePlayer(
        this,
        player.x,
        player.y,
        player.name,
        player.role
      );
      this.remotePlayers.set(sessionId, rp);
    }
  }

  private findNearbyObject(): string | null {
    if (!this.localPlayer) return null;
    let closest: string | null = null;
    let closestDist = TRANSFORM_RANGE;

    this.mapObjects.forEach((obj) => {
      const dist = Phaser.Math.Distance.Between(
        this.localPlayer.x,
        this.localPlayer.y,
        obj.x,
        obj.y
      );
      if (dist < closestDist) {
        closestDist = dist;
        closest = obj.objectDef.id;
      }
    });
    return closest;
  }

  private showAttackFlash(attackerId: string, hit: boolean) {
    if (!this.attackFlash) return;

    let targetX = 0, targetY = 0;
    if (attackerId === this.sessionId && this.localPlayer) {
      targetX = this.localPlayer.x;
      targetY = this.localPlayer.y;
    } else {
      const rp = this.remotePlayers.get(attackerId);
      if (rp) { targetX = rp.x; targetY = rp.y; }
    }

    this.attackFlash.setPosition(targetX, targetY);
    this.attackFlash.setTint(hit ? 0xff0000 : 0xffff00);
    this.attackFlash.setAlpha(0.8);
    this.tweens.add({
      targets: this.attackFlash,
      alpha: 0,
      duration: 300,
      ease: "Linear",
    });
  }

  update(_time: number, _delta: number) {
    if (!this.room?.state) return;

    const phase = this.room.state.phase;
    const canMove = phase === PHASE_HIDING || phase === PHASE_HUNTING || phase === PHASE_COUNTDOWN;

    if (this.localPlayer) {
      this.localPlayer.update(canMove);
    }

    // Interpolate remote players
    this.remotePlayers.forEach((rp) => rp.interpolate(0.15));

    // Update React state snapshot
    const now = Date.now();
    const nearbyObjectId = this.findNearbyObject();
    const newSnapshot = {
      phase,
      timer: this.room.state.timer,
      attackCooldownMs: Math.max(0, HUNTER_ATTACK_COOLDOWN - (now - this.lastAttackTime)),
      isTransformed: this.localPlayer?.isTransformed ?? false,
      nearbyObjectId,
    };

    this.stateSnapshot = newSnapshot;
    this.onStateChange?.(newSnapshot);
  }
}

