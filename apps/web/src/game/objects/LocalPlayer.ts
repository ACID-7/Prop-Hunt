import Phaser from "phaser";
import { sendMessage } from "../network/ColyseusClient";
import { MAP_OBJECTS, MapObjectDef, TRANSFORM_RANGE } from "@prop-hunt/shared";

export class LocalPlayer extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private rangeCircle: Phaser.GameObjects.Graphics;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  } | null = null;
  private eKey: Phaser.Input.Keyboard.Key | null = null;
  private fKey: Phaser.Input.Keyboard.Key | null = null;

  role: "prop" | "hunter" = "prop";
  isAlive: boolean = true;
  isTransformed: boolean = false;
  transformedObjectId: string = "";

  // Track last sent velocity to avoid spam
  private lastVx: number = 0;
  private lastVy: number = 0;

  onAttack?: () => void;
  onTransform?: (objectId: string | null) => void;
  getNearbyObject?: () => string | null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    role: "prop" | "hunter"
  ) {
    super(scene, x, y);
    this.role = role;

    this.sprite = scene.add.image(0, 0, `player_${role}`);
    this.sprite.setDisplaySize(32, 32);

    this.nameText = scene.add
      .text(0, -28, `${name} (you)`, {
        fontSize: "8px",
        color: "#f0c040",
        fontFamily: "'Press Start 2P'",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.rangeCircle = scene.add.graphics();

    this.add([this.rangeCircle, this.sprite, this.nameText]);
    scene.add.existing(this);

    // Input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.fKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }
  }

  updateRole(role: "prop" | "hunter", isAlive: boolean, isTransformed: boolean, transformedObjectId: string) {
    this.role = role;
    this.isAlive = isAlive;
    this.isTransformed = isTransformed;
    this.transformedObjectId = transformedObjectId;

    if (!isAlive) {
      this.sprite.setTexture("player_dead");
      this.setAlpha(0.5);
    } else if (isTransformed) {
      this.sprite.setTexture(transformedObjectId.split("_")[0] || "crate");
      this.sprite.setDisplaySize(48, 48);
    } else {
      this.sprite.setTexture(`player_${role}`);
      this.sprite.setDisplaySize(32, 32);
      this.setAlpha(1);
    }
  }

  update(canMove: boolean) {
    this.rangeCircle.clear();

    if (!canMove || !this.isAlive) {
      if (this.lastVx !== 0 || this.lastVy !== 0) {
        sendMessage({ type: "move", vx: 0, vy: 0 });
        this.lastVx = 0;
        this.lastVy = 0;
      }
      return;
    }

    // Read input
    let vx = 0, vy = 0;
    if (this.cursors?.left.isDown || this.wasd?.left.isDown) vx = -1;
    if (this.cursors?.right.isDown || this.wasd?.right.isDown) vx = 1;
    if (this.cursors?.up.isDown || this.wasd?.up.isDown) vy = -1;
    if (this.cursors?.down.isDown || this.wasd?.down.isDown) vy = 1;

    // Send movement if changed
    if (vx !== this.lastVx || vy !== this.lastVy) {
      sendMessage({ type: "move", vx, vy });
      this.lastVx = vx;
      this.lastVy = vy;
    }

    // Attack (E key) for hunters
    if (this.role === "hunter" && Phaser.Input.Keyboard.JustDown(this.eKey!)) {
      this.onAttack?.();
    }

    // Transform (F key) for props
    if (this.role === "prop" && Phaser.Input.Keyboard.JustDown(this.fKey!)) {
      if (this.isTransformed) {
        this.onTransform?.(null);
      } else {
        const nearbyId = this.getNearbyObject?.();
        if (nearbyId) {
          this.onTransform?.(nearbyId);
        }
      }
    }

    // Draw range indicator for props
    if (this.role === "prop" && !this.isTransformed) {
      const nearbyId = this.getNearbyObject?.();
      if (nearbyId) {
        this.rangeCircle.lineStyle(1, 0x50e090, 0.5);
        this.rangeCircle.strokeCircle(0, 0, TRANSFORM_RANGE);
      }
    }
  }

  // Server updates authoritative position
  setServerPosition(x: number, y: number) {
    // For local player: snap to server (or light lerp to handle lag)
    this.x = Phaser.Math.Linear(this.x, x, 0.3);
    this.y = Phaser.Math.Linear(this.y, y, 0.3);
  }
}

