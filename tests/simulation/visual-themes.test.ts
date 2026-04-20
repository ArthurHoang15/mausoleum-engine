import { describe, expect, it } from "vitest";

import {
  getSectorVisualTheme,
  sectorVisualThemes
} from "../../src/game/content/visualThemes";

describe("sectorVisualThemes", () => {
  it("returns a theme with a complete palette for every id", () => {
    for (const themeId of Object.keys(sectorVisualThemes)) {
      const theme = getSectorVisualTheme(
        themeId as keyof typeof sectorVisualThemes
      );

      expect(theme.palette.floorBase).toBeGreaterThan(0);
      expect(theme.palette.wallBase).toBeGreaterThan(0);
      expect(theme.palette.accent).toBeGreaterThan(0);
      expect(theme.palette.starfield.length).toBeGreaterThanOrEqual(3);
    }
  });
});
