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
  svg: string,
  frameWidth: number,
  frameHeight: number
) => ({
  kind: "spritesheet" as const,
  key,
  source: svgToDataUri(svg),
  frameConfig: { frameWidth, frameHeight }
});

export const PIXEL_ANIMATION_KEYS = {
  playerIdle: "pixel-player-idle",
  playerWalk: "pixel-player-walk",
  droneHover: "pixel-drone-hover",
  wardenFloat: "pixel-warden-float",
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

const playerStripSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="72" height="32" shape-rendering="crispEdges">
  <rect x="0" y="0" width="24" height="32" fill="#000000" fill-opacity="0"/>
  <rect x="24" y="0" width="24" height="32" fill="#000000" fill-opacity="0"/>
  <rect x="48" y="0" width="24" height="32" fill="#000000" fill-opacity="0"/>
  <rect x="8" y="3" width="8" height="8" fill="#e8edf8"/>
  <rect x="7" y="10" width="10" height="2" fill="#30394a"/>
  <rect x="7" y="12" width="10" height="8" fill="#b54a4a"/>
  <rect x="6" y="14" width="2" height="6" fill="#30394a"/>
  <rect x="16" y="14" width="2" height="6" fill="#30394a"/>
  <rect x="8" y="20" width="3" height="8" fill="#30394a"/>
  <rect x="13" y="20" width="3" height="8" fill="#30394a"/>

  <rect x="32" y="3" width="8" height="8" fill="#e8edf8"/>
  <rect x="31" y="10" width="10" height="2" fill="#30394a"/>
  <rect x="31" y="12" width="10" height="8" fill="#b54a4a"/>
  <rect x="30" y="14" width="2" height="7" fill="#30394a"/>
  <rect x="40" y="14" width="2" height="5" fill="#30394a"/>
  <rect x="32" y="20" width="3" height="8" fill="#30394a"/>
  <rect x="37" y="20" width="3" height="7" fill="#30394a"/>

  <rect x="56" y="3" width="8" height="8" fill="#e8edf8"/>
  <rect x="55" y="10" width="10" height="2" fill="#30394a"/>
  <rect x="55" y="12" width="10" height="8" fill="#b54a4a"/>
  <rect x="54" y="14" width="2" height="5" fill="#30394a"/>
  <rect x="64" y="14" width="2" height="7" fill="#30394a"/>
  <rect x="56" y="20" width="3" height="7" fill="#30394a"/>
  <rect x="61" y="20" width="3" height="8" fill="#30394a"/>
</svg>`;

const droneStripSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" shape-rendering="crispEdges">
  <rect x="4" y="4" width="8" height="8" fill="#8fd0ff"/>
  <rect x="2" y="6" width="2" height="4" fill="#dff6ff"/>
  <rect x="12" y="6" width="2" height="4" fill="#dff6ff"/>
  <rect x="6" y="2" width="4" height="2" fill="#dff6ff"/>

  <rect x="20" y="5" width="8" height="6" fill="#8fd0ff"/>
  <rect x="18" y="6" width="2" height="4" fill="#dff6ff"/>
  <rect x="28" y="6" width="2" height="4" fill="#dff6ff"/>
  <rect x="22" y="3" width="4" height="2" fill="#dff6ff"/>
</svg>`;

const wardenStripSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64" shape-rendering="crispEdges">
  <rect x="18" y="8" width="12" height="12" fill="#f4f7ff"/>
  <rect x="15" y="20" width="18" height="18" fill="#d9e3ff"/>
  <rect x="6" y="22" width="8" height="18" fill="#8ea4ff"/>
  <rect x="34" y="22" width="8" height="18" fill="#8ea4ff"/>
  <rect x="18" y="38" width="12" height="18" fill="#7d8ae0"/>

  <rect x="66" y="7" width="12" height="12" fill="#f4f7ff"/>
  <rect x="63" y="20" width="18" height="18" fill="#d9e3ff"/>
  <rect x="54" y="20" width="8" height="20" fill="#8ea4ff"/>
  <rect x="82" y="20" width="8" height="20" fill="#8ea4ff"/>
  <rect x="66" y="38" width="12" height="18" fill="#7d8ae0"/>
</svg>`;

const scanFxStripSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="32" shape-rendering="crispEdges">
  <rect x="14" y="14" width="4" height="4" fill="#a8d1ff"/>
  <rect x="46" y="12" width="8" height="8" fill="#a8d1ff" fill-opacity="0.7"/>
  <rect x="42" y="10" width="16" height="12" fill="#dceeff" fill-opacity="0.2"/>
  <rect x="74" y="8" width="12" height="16" fill="#a8d1ff" fill-opacity="0.45"/>
  <rect x="70" y="6" width="20" height="20" fill="#dceeff" fill-opacity="0.16"/>
  <rect x="100" y="4" width="24" height="24" fill="#a8d1ff" fill-opacity="0.35"/>
  <rect x="96" y="2" width="32" height="28" fill="#dceeff" fill-opacity="0.12"/>
</svg>`;

export const pixelAssetManifest = [
  imageAsset("pixel-floor-tile", floorTileSvg),
  imageAsset("pixel-wall-tile", wallTileSvg),
  imageAsset("pixel-ui-frame", frameSvg),
  spritesheetAsset("pixel-player-proxy", playerStripSvg, 24, 32),
  spritesheetAsset("pixel-drone-proxy", droneStripSvg, 16, 16),
  spritesheetAsset("pixel-warden-proxy", wardenStripSvg, 48, 64),
  spritesheetAsset("pixel-scan-fx-proxy", scanFxStripSvg, 32, 32)
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

  ensureAnimation(PIXEL_ANIMATION_KEYS.playerIdle, "pixel-player-proxy", [0, 1], 3);
  ensureAnimation(PIXEL_ANIMATION_KEYS.playerWalk, "pixel-player-proxy", [0, 1, 2], 8);
  ensureAnimation(PIXEL_ANIMATION_KEYS.droneHover, "pixel-drone-proxy", [0, 1], 4);
  ensureAnimation(PIXEL_ANIMATION_KEYS.wardenFloat, "pixel-warden-proxy", [0, 1], 2);
  ensureAnimation(PIXEL_ANIMATION_KEYS.scanPulse, "pixel-scan-fx-proxy", [0, 1, 2, 3], 10, 0);
}
