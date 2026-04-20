import { describe, expect, it } from "vitest";

import { getSectorVisualTheme } from "../../src/game/content/visualThemes";
import {
  buildEnvironmentRenderPlan,
  getWallTreatment
} from "../../src/phaser/runtime/environment-rendering";

describe("buildEnvironmentRenderPlan", () => {
  it("stays deterministic for the same theme and sector size", () => {
    const theme = getSectorVisualTheme("hollow-spine");
    const size = { width: 1400, height: 900 };

    expect(buildEnvironmentRenderPlan(theme, size)).toEqual(
      buildEnvironmentRenderPlan(theme, size)
    );
  });

  it("creates theme-specific floor bands inside sector bounds", () => {
    const size = { width: 1280, height: 832 };
    const themes = [
      getSectorVisualTheme("hollow-spine"),
      getSectorVisualTheme("lens-basilica"),
      getSectorVisualTheme("ossuary-shafts"),
      getSectorVisualTheme("choir-archives"),
      getSectorVisualTheme("reliquary-furnace")
    ];

    const signatures = new Set<string>();

    for (const theme of themes) {
      const plan = buildEnvironmentRenderPlan(theme, size);
      expect(plan.floorBands.length).toBeGreaterThan(0);

      for (const band of plan.floorBands) {
        expect(band.x).toBeGreaterThanOrEqual(0);
        expect(band.y).toBeGreaterThanOrEqual(0);
        expect(band.x + band.width).toBeLessThanOrEqual(size.width);
        expect(band.y + band.height).toBeLessThanOrEqual(size.height);
      }

      signatures.add(
        JSON.stringify(plan.floorBands.map((band) => [band.x, band.y, band.width, band.height]))
      );
    }

    expect(signatures.size).toBe(themes.length);
  });
});

describe("getWallTreatment", () => {
  it("keeps trim and shadow values within practical bounds for small walls", () => {
    const theme = getSectorVisualTheme("choir-archives");

    expect(
      getWallTreatment(theme, {
        x: 60,
        y: 120,
        width: 32,
        height: 44
      })
    ).toMatchObject({
      capHeight: 4,
      trimThickness: 2,
      shadowOffsetX: 4,
      shadowOffsetY: 4
    });
  });

  it("scales decorative depth for larger walls without changing collision geometry", () => {
    const theme = getSectorVisualTheme("reliquary-furnace");
    const small = getWallTreatment(theme, {
      x: 40,
      y: 90,
      width: 60,
      height: 48
    });
    const large = getWallTreatment(theme, {
      x: 40,
      y: 90,
      width: 260,
      height: 120
    });

    expect(large.capHeight).toBeGreaterThan(small.capHeight);
    expect(large.shadowOffsetY).toBeGreaterThanOrEqual(small.shadowOffsetY);
    expect(large.trimThickness).toBeGreaterThanOrEqual(small.trimThickness);
  });
});
