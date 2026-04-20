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
});

describe("PIXEL_ANIMATION_KEYS", () => {
  it("uses unique animation ids", () => {
    const keys = Object.values(PIXEL_ANIMATION_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
