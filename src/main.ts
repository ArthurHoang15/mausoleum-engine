import Phaser from "phaser";

import "./style.css";

import { AudioDirector } from "./audio/AudioDirector";
import type { GameServices } from "./app/services";
import { GameController } from "./game/simulation/controller";
import { GAME_VIEWPORT, PIXEL_RENDER_SETTINGS } from "./phaser/config/pixel";
import { BootScene } from "./phaser/scenes/BootScene";
import { GameScene } from "./phaser/scenes/GameScene";
import { Hud } from "./ui/Hud";

const gameRoot = document.getElementById("game-root");
const hudRoot = document.getElementById("hud-root");

if (!gameRoot || !hudRoot) {
  throw new Error("Missing app root nodes.");
}

const controller = new GameController();
const audio = new AudioDirector();
const hud = new Hud(hudRoot);
const services: GameServices = { controller, audio, hud };

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: gameRoot,
  width: GAME_VIEWPORT.width,
  height: GAME_VIEWPORT.height,
  backgroundColor: "#080c14",
  antialias: PIXEL_RENDER_SETTINGS.antialias,
  antialiasGL: PIXEL_RENDER_SETTINGS.antialiasGL,
  pixelArt: PIXEL_RENDER_SETTINGS.pixelArt,
  roundPixels: PIXEL_RENDER_SETTINGS.roundPixels,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [new BootScene(services), new GameScene(services)]
};

void new Phaser.Game(config);
