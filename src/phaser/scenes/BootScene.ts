import Phaser from "phaser";

import type { GameServices } from "../../app/services";

export class BootScene extends Phaser.Scene {
  constructor(private readonly services: GameServices) {
    super("BootScene");
  }

  create(): void {
    this.services.hud.showToast("Boot sequence complete.");
    this.scene.start("GameScene");
  }
}
