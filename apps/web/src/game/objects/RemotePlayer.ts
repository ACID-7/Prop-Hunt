import Phaser from "phaser";

export class RemotePlayer extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private roleText: Phaser.GameObjects.Text;

  // Interpolation targets
  targetX: number;
  targetY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    role: "prop" | "hunter"
  ) {
    super(scene, x, y);
    this.targetX = x;
    this.targetY = y;

    this.sprite = scene.add.image(0, 0, `player_${role}`);
    this.sprite.setDisplaySize(32, 32);

    this.nameText = scene.add.text(0, -28, name, {
      fontSize: "8px",
      color: "#ffffff",
      fontFamily: "'Press Start 2P'", // Phaser doesn't care about fallback here
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.roleText = scene.add.text(0, 24, role === "hunter" ? "🏹" : "🎭", {
      fontSize: "12px",
    }).setOrigin(0.5);

    this.add([this.sprite, this.nameText, this.roleText]);
    scene.add.existing(this);
  }

  update(
    isAlive: boolean,
    isTransformed: boolean,
    role: "prop" | "hunter",
    transformedObjectId: string
  ) {
    if (!isAlive) {
      this.sprite.setTexture("player_dead");
      this.setAlpha(0.4);
    } else if (isTransformed) {
      this.sprite.setTexture(transformedObjectId.split("_")[0] || "crate");
      this.sprite.setDisplaySize(48, 48);
    } else {
      this.sprite.setTexture(`player_${role}`);
      this.sprite.setDisplaySize(32, 32);
      this.setAlpha(1);
    }
  }

  interpolate(t: number) {
    // Lerp toward server position
    this.x = Phaser.Math.Linear(this.x, this.targetX, t);
    this.y = Phaser.Math.Linear(this.y, this.targetY, t);
  }
}

