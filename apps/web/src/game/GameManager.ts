import Phaser from "phaser";
import * as Colyseus from "colyseus.js";
import { PreloadScene } from "./scenes/PreloadScene";
import { GameScene } from "./scenes/GameScene";
import { MAP_WIDTH, MAP_HEIGHT } from "@prop-hunt/shared";

let game: Phaser.Game | null = null;
let gameScene: GameScene | null = null;

export function launchGame(
  container: HTMLElement,
  room: Colyseus.Room,
  sessionId: string,
  onStateChange: (snapshot: unknown) => void
): void {
  if (game) {
    game.destroy(true);
    game = null;
  }

  const gameSceneInstance = new GameScene();
  gameSceneInstance.onStateChange = onStateChange as never;
  gameScene = gameSceneInstance;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#0d0d1a",
    parent: container,
    scene: [PreloadScene, gameSceneInstance],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      preBoot: (g) => {
        // Pass room data to GameScene via registry
        g.registry.set("room", room);
        g.registry.set("sessionId", sessionId);
      },
    },
  });

  // Pass data after scene starts
  game.events.once(Phaser.Core.Events.READY, () => {
    gameSceneInstance.scene.start("GameScene", { room, sessionId });
  });
}

export function destroyGame() {
  game?.destroy(true);
  game = null;
  gameScene = null;
}
