import Phaser from "phaser";
import { MapObjectDef } from "@prop-hunt/shared";

export class MapObject extends Phaser.GameObjects.Image {
  objectDef: MapObjectDef;

  constructor(scene: Phaser.Scene, def: MapObjectDef) {
    super(scene, def.x + def.width / 2, def.y + def.height / 2, def.spriteKey);
    this.objectDef = def;
    this.setDisplaySize(def.width, def.height);
    scene.add.existing(this);
  }
}

