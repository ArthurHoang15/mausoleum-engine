import Phaser from "phaser";

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const imageAsset = (key: string, svg: string) => ({
  kind: "image" as const,
  key,
  source: svgToDataUri(svg)
});

const spritesheetAsset = (
  key: string,
  source: string,
  frameWidth: number,
  frameHeight: number
) => ({
  kind: "spritesheet" as const,
  key,
  source,
  frameConfig: { frameWidth, frameHeight }
});

export const PIXEL_ANIMATION_KEYS = {
  playerIdle: "pixel-player-idle",
  playerWalk: "pixel-player-walk",
  playerWalkDown: "pixel-player-walk-down",
  playerWalkUp: "pixel-player-walk-up",
  playerWalkLeft: "pixel-player-walk-left",
  playerWalkRight: "pixel-player-walk-right",
  playerDash: "pixel-player-dash",
  playerScan: "pixel-player-scan",
  playerInteract: "pixel-player-interact",
  droneHover: "pixel-drone-hover",
  dronePatrol: "pixel-drone-patrol",
  droneAlert: "pixel-drone-alert",
  wardenFloat: "pixel-warden-float",
  wardenManifest: "pixel-warden-manifest",
  wardenHunt: "pixel-warden-hunt",
  wardenContainment: "pixel-warden-containment",
  wardenHalo: "pixel-warden-halo",
  scanPulse: "pixel-scan-pulse"
} as const;

const floorTileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
  <rect width="32" height="32" fill="#11192a"/>
  <rect x="0" y="0" width="32" height="1" fill="#243553"/>
  <rect x="0" y="16" width="32" height="1" fill="#243553"/>
  <rect x="0" y="31" width="32" height="1" fill="#243553"/>
  <rect x="0" y="0" width="1" height="32" fill="#243553"/>
  <rect x="16" y="0" width="1" height="32" fill="#243553"/>
  <rect x="31" y="0" width="1" height="32" fill="#243553"/>
  <rect x="8" y="8" width="2" height="2" fill="#3b5d8f"/>
  <rect x="22" y="22" width="2" height="2" fill="#3b5d8f"/>
</svg>`;

const wallTileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
  <rect width="32" height="32" fill="#324665"/>
  <rect x="0" y="0" width="32" height="3" fill="#7ca6da"/>
  <rect x="0" y="29" width="32" height="3" fill="#182335"/>
  <rect x="3" y="6" width="10" height="6" fill="#445d83"/>
  <rect x="18" y="16" width="10" height="6" fill="#445d83"/>
</svg>`;

const frameSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" shape-rendering="crispEdges">
  <rect width="16" height="16" fill="#0d1220"/>
  <rect x="1" y="1" width="14" height="14" fill="#111a2a"/>
  <rect x="0" y="0" width="16" height="1" fill="#ddeeff"/>
  <rect x="0" y="15" width="16" height="1" fill="#40506f"/>
  <rect x="0" y="0" width="1" height="16" fill="#ddeeff"/>
  <rect x="15" y="0" width="1" height="16" fill="#40506f"/>
  <rect x="4" y="4" width="8" height="8" fill="#7ba3d9"/>
</svg>`;

const playerRuntimeStrip = "/assets/pixel/sprites/player/player-runtime-strip-v6.png";
const droneRuntimeStrip = "/assets/pixel/sprites/drone/drone-runtime-strip-v3.png";
const wardenRuntimeStrip = "/assets/pixel/sprites/warden/warden-runtime-strip-v2.png";
const wardenContainmentStrip = "/assets/pixel/sprites/warden/warden-containment-strip-v2.png";
const wardenHaloOverlayStrip = "/assets/pixel/fx/warden-halo-overlay-strip-v2.png";
const scanFxRuntimeStrip = "/assets/pixel/fx/scan-fx-runtime-strip.png";

export const pixelAssetManifest = [
  imageAsset("pixel-floor-tile", floorTileSvg),
  imageAsset("pixel-wall-tile", wallTileSvg),
  imageAsset("pixel-ui-frame", frameSvg),
  spritesheetAsset("pixel-player-proxy", playerRuntimeStrip, 48, 64),
  spritesheetAsset("pixel-drone-proxy", droneRuntimeStrip, 16, 16),
  spritesheetAsset("pixel-warden-proxy", wardenRuntimeStrip, 48, 64),
  spritesheetAsset("pixel-warden-containment", wardenContainmentStrip, 48, 64),
  spritesheetAsset("pixel-warden-halo-overlay", wardenHaloOverlayStrip, 48, 64),
  spritesheetAsset("pixel-scan-fx-proxy", scanFxRuntimeStrip, 32, 32)
] as const;

export function preloadPixelFoundationAssets(scene: Phaser.Scene): void {
  for (const asset of pixelAssetManifest) {
    if (asset.kind === "image") {
      if (!scene.textures.exists(asset.key)) {
        scene.load.image(asset.key, asset.source);
      }
      continue;
    }

    if (!scene.textures.exists(asset.key)) {
      scene.load.spritesheet(asset.key, asset.source, asset.frameConfig);
    }
  }
}

export function registerPixelFoundationAnimations(scene: Phaser.Scene): void {
  const frameRange = (start: number, count: number) =>
    Array.from({ length: count }, (_, index) => start + index);

  const ensureAnimation = (
    key: string,
    texture: string,
    frames: number[],
    frameRate = 6,
    repeat = -1
  ) => {
    if (scene.anims.exists(key)) {
      return;
    }

    scene.anims.create({
      key,
      frames: frames.map((frame) => ({ key: texture, frame })),
      frameRate,
      repeat
    });
  };

  ensureAnimation(PIXEL_ANIMATION_KEYS.playerIdle, "pixel-player-proxy", frameRange(0, 8), 6);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerWalk, "pixel-player-proxy", frameRange(8, 8), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerWalkDown, "pixel-player-proxy", frameRange(8, 8), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerWalkUp, "pixel-player-proxy", frameRange(16, 8), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerWalkLeft, "pixel-player-proxy", frameRange(24, 8), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerWalkRight, "pixel-player-proxy", frameRange(32, 8), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerDash, "pixel-player-proxy", frameRange(40, 8), 12, 0);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerScan, "pixel-player-proxy", frameRange(48, 8), 10, 0);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerInteract, "pixel-player-proxy", frameRange(56, 8), 8, 0);
  ensureAnimation(PIXEL_ANIMATION_KEYS.droneHover, "pixel-drone-proxy", frameRange(0, 4), 5);
  ensureAnimation(PIXEL_ANIMATION_KEYS.dronePatrol, "pixel-drone-proxy", frameRange(4, 4), 6);
  ensureAnimation(PIXEL_ANIMATION_KEYS.droneAlert, "pixel-drone-proxy", frameRange(8, 4), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.wardenFloat, "pixel-warden-proxy", frameRange(0, 4), 4);
  ensureAnimation(PIXEL_ANIMATION_KEYS.wardenManifest, "pixel-warden-proxy", frameRange(4, 4), 5);
  ensureAnimation(PIXEL_ANIMATION_KEYS.wardenHunt, "pixel-warden-proxy", frameRange(8, 6), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.wardenContainment, "pixel-warden-containment", frameRange(0, 4), 6, 0);
  ensureAnimation(PIXEL_ANIMATION_KEYS.wardenHalo, "pixel-warden-halo-overlay", frameRange(0, 6), 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.scanPulse, "pixel-scan-fx-proxy", [0, 1, 2, 3], 10, 0);
}
