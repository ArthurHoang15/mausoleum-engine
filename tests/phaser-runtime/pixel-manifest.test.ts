import { describe, expect, it } from "vitest";

import {
  PIXEL_ANIMATION_KEYS,
  pixelAssetManifest
} from "../../src/phaser/assets/pixelManifest";

describe("pixelAssetManifest", () => {
  it("uses unique asset keys", () => {
    const keys = pixelAssetManifest.map((asset) => asset.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("defines valid frame sizes for spritesheets", () => {
    for (const asset of pixelAssetManifest) {
      if (asset.kind === "spritesheet") {
        expect(asset.frameConfig.frameWidth).toBeGreaterThan(0);
        expect(asset.frameConfig.frameHeight).toBeGreaterThan(0);
      }
    }
  });

  it("locks the final player runtime animation strip at 48x64", () => {
    const player = pixelAssetManifest.find(
      (asset) => asset.key === "pixel-player-proxy"
    );

    expect(player?.kind).toBe("spritesheet");
    if (player?.kind !== "spritesheet") {
      return;
    }

    expect(player.source).toContain("player-runtime-strip-v6.png");
    expect(player.frameConfig).toEqual({ frameWidth: 48, frameHeight: 64 });
  });

  it("registers the complete player animation family keys", () => {
    expect(PIXEL_ANIMATION_KEYS.playerIdle).toBe("pixel-player-idle");
    expect(PIXEL_ANIMATION_KEYS.playerWalk).toBe("pixel-player-walk");
    expect(PIXEL_ANIMATION_KEYS.playerWalkDown).toBe("pixel-player-walk-down");
    expect(PIXEL_ANIMATION_KEYS.playerWalkUp).toBe("pixel-player-walk-up");
    expect(PIXEL_ANIMATION_KEYS.playerWalkLeft).toBe("pixel-player-walk-left");
    expect(PIXEL_ANIMATION_KEYS.playerWalkRight).toBe("pixel-player-walk-right");
    expect(PIXEL_ANIMATION_KEYS.playerDash).toBe("pixel-player-dash");
    expect(PIXEL_ANIMATION_KEYS.playerScan).toBe("pixel-player-scan");
    expect(PIXEL_ANIMATION_KEYS.playerInteract).toBe("pixel-player-interact");
  });
});

describe("PIXEL_ANIMATION_KEYS", () => {
  it("uses unique animation ids", () => {
    const keys = Object.values(PIXEL_ANIMATION_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
