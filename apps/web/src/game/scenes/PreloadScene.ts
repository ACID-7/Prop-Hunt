import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    // Generate placeholder colored rectangles as textures
    // (Replace with real sprites later)
    this.generatePlaceholderTextures();
  }

  private generatePlaceholderTextures() {
    const textures: Array<{ key: string; color: number; w: number; h: number }> = [
      { key: "player_prop",    color: 0x50e090, w: 32, h: 32 },
      { key: "player_hunter",  color: 0xe05050, w: 32, h: 32 },
      { key: "player_dead",    color: 0x555555, w: 32, h: 32 },
      { key: "player_hidden",  color: 0x888888, w: 32, h: 32 },
      { key: "crate",          color: 0xb87333, w: 48, h: 48 },
      { key: "barrel",         color: 0x607080, w: 40, h: 56 },
      { key: "table",          color: 0x8b6914, w: 80, h: 40 },
      { key: "bush",           color: 0x228b22, w: 56, h: 48 },
      { key: "chair",          color: 0x8b4513, w: 36, h: 40 },
      { key: "box",            color: 0xd2b48c, w: 44, h: 44 },
      { key: "floor_tile",     color: 0x1e1e2e, w: 32, h: 32 },
      { key: "wall_tile",      color: 0x2a2a4a, w: 32, h: 32 },
      { key: "attack_flash",   color: 0xffff00, w: 96, h: 96 },
    ];

    textures.forEach(({ key, color, w, h }) => {
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({ x: 0, y: 0 }, false);
        g.fillStyle(color, 1);
        g.fillRect(0, 0, w, h);
        // Add a border
        g.lineStyle(2, 0xffffff, 0.3);
        g.strokeRect(0, 0, w, h);
        g.generateTexture(key, w, h);
        g.destroy();
      }
    });
  }

  create() {
    this.scene.start("GameScene");
  }
}

