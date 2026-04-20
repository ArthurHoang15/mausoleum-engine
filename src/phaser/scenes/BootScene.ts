import Phaser from "phaser";

import type { GameServices } from "../../app/services";
import {
  preloadPixelFoundationAssets,
  registerPixelFoundationAnimations
} from "../assets/pixelManifest";

export class BootScene extends Phaser.Scene {
  constructor(private readonly services: GameServices) {
    super("BootScene");
  }

  preload(): void {
    preloadPixelFoundationAssets(this);
  }

  create(): void {
    registerPixelFoundationAnimations(this);
    this.services.hud.showToast("Boot sequence complete.");
    this.scene.start("GameScene");
  }
}
