import type { Rect } from "../../game/content/sectors";
import type { SectorVisualTheme } from "../../game/content/visualThemes";

export interface EnvironmentFloorBand extends Rect {
  tint: number;
  alpha: number;
  outlineTint: number;
  outlineAlpha: number;
}

export interface EnvironmentRenderPlan {
  baseFloorTint: number;
  detailFloorTint: number;
  detailFloorAlpha: number;
  bandShadowTint: number;
  bandShadowAlpha: number;
  floorBands: EnvironmentFloorBand[];
}

export interface WallTreatment {
  faceTint: number;
  faceAlpha: number;
  capTint: number;
  capAlpha: number;
  capHeight: number;
  trimTint: number;
  trimAlpha: number;
  trimThickness: number;
  shadowTint: number;
  shadowAlpha: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

const round = (value: number): number => Math.round(value);

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const mixColor = (start: number, end: number, ratio: number): number => {
  const safeRatio = clamp(ratio, 0, 1);
  const sr = (start >> 16) & 0xff;
  const sg = (start >> 8) & 0xff;
  const sb = start & 0xff;
  const er = (end >> 16) & 0xff;
  const eg = (end >> 8) & 0xff;
  const eb = end & 0xff;
  const rr = round(sr + (er - sr) * safeRatio);
  const rg = round(sg + (eg - sg) * safeRatio);
  const rb = round(sb + (eb - sb) * safeRatio);

  return (rr << 16) | (rg << 8) | rb;
};

const createBand = (
  x: number,
  y: number,
  width: number,
  height: number,
  tint: number,
  alpha: number,
  outlineTint: number,
  outlineAlpha: number
): EnvironmentFloorBand => ({
  x: round(x),
  y: round(y),
  width: round(width),
  height: round(height),
  tint,
  alpha,
  outlineTint,
  outlineAlpha
});

export function buildEnvironmentRenderPlan(
  theme: SectorVisualTheme,
  sectorSize: { width: number; height: number }
): EnvironmentRenderPlan {
  const accentSoft = mixColor(theme.palette.floorGrid, theme.palette.accent, 0.38);
  const accentGlow = mixColor(theme.palette.wallTrim, theme.palette.glow, 0.45);
  const shadowTint = mixColor(theme.palette.background, 0x000000, 0.35);
  const width = sectorSize.width;
  const height = sectorSize.height;

  switch (theme.environmentSet) {
    case "spine":
      return {
        baseFloorTint: mixColor(theme.palette.floorBase, theme.palette.floorGrid, 0.18),
        detailFloorTint: accentSoft,
        detailFloorAlpha: 0.2,
        bandShadowTint: shadowTint,
        bandShadowAlpha: 0.2,
        floorBands: [
          createBand(
            width * 0.35,
            0,
            width * 0.3,
            height,
            accentSoft,
            0.18,
            accentGlow,
            0.22
          ),
          createBand(
            width * 0.18,
            height * 0.22,
            width * 0.64,
            height * 0.12,
            accentSoft,
            0.16,
            accentGlow,
            0.18
          ),
          createBand(
            width * 0.24,
            height * 0.74,
            width * 0.52,
            height * 0.1,
            accentSoft,
            0.16,
            accentGlow,
            0.18
          )
        ]
      };
    case "lens":
      return {
        baseFloorTint: mixColor(theme.palette.floorBase, theme.palette.floorGrid, 0.22),
        detailFloorTint: accentSoft,
        detailFloorAlpha: 0.22,
        bandShadowTint: shadowTint,
        bandShadowAlpha: 0.22,
        floorBands: [
          createBand(
            width * 0.42,
            0,
            width * 0.16,
            height,
            accentSoft,
            0.2,
            accentGlow,
            0.22
          ),
          createBand(
            width * 0.14,
            height * 0.42,
            width * 0.72,
            height * 0.16,
            accentSoft,
            0.2,
            accentGlow,
            0.22
          ),
          createBand(
            width * 0.28,
            height * 0.12,
            width * 0.44,
            height * 0.1,
            accentSoft,
            0.17,
            accentGlow,
            0.18
          )
        ]
      };
    case "ossuary":
      return {
        baseFloorTint: mixColor(theme.palette.floorBase, theme.palette.floorGrid, 0.24),
        detailFloorTint: accentSoft,
        detailFloorAlpha: 0.18,
        bandShadowTint: shadowTint,
        bandShadowAlpha: 0.24,
        floorBands: [
          createBand(
            width * 0.18,
            0,
            width * 0.18,
            height,
            accentSoft,
            0.16,
            accentGlow,
            0.18
          ),
          createBand(
            width * 0.64,
            0,
            width * 0.18,
            height,
            accentSoft,
            0.16,
            accentGlow,
            0.18
          ),
          createBand(
            width * 0.3,
            height * 0.72,
            width * 0.4,
            height * 0.12,
            accentSoft,
            0.18,
            accentGlow,
            0.2
          )
        ]
      };
    case "choir":
      return {
        baseFloorTint: mixColor(theme.palette.floorBase, theme.palette.floorGrid, 0.2),
        detailFloorTint: accentSoft,
        detailFloorAlpha: 0.22,
        bandShadowTint: shadowTint,
        bandShadowAlpha: 0.18,
        floorBands: [
          createBand(
            width * 0.16,
            height * 0.18,
            width * 0.68,
            height * 0.1,
            accentSoft,
            0.18,
            accentGlow,
            0.2
          ),
          createBand(
            width * 0.16,
            height * 0.44,
            width * 0.68,
            height * 0.1,
            accentSoft,
            0.18,
            accentGlow,
            0.2
          ),
          createBand(
            width * 0.16,
            height * 0.7,
            width * 0.68,
            height * 0.1,
            accentSoft,
            0.18,
            accentGlow,
            0.2
          )
        ]
      };
    case "furnace":
      return {
        baseFloorTint: mixColor(theme.palette.floorBase, theme.palette.floorGrid, 0.28),
        detailFloorTint: accentSoft,
        detailFloorAlpha: 0.24,
        bandShadowTint: shadowTint,
        bandShadowAlpha: 0.26,
        floorBands: [
          createBand(
            width * 0.38,
            0,
            width * 0.24,
            height,
            accentSoft,
            0.22,
            accentGlow,
            0.24
          ),
          createBand(
            width * 0.12,
            height * 0.68,
            width * 0.76,
            height * 0.16,
            accentSoft,
            0.2,
            accentGlow,
            0.22
          ),
          createBand(
            width * 0.22,
            height * 0.14,
            width * 0.56,
            height * 0.1,
            accentSoft,
            0.16,
            accentGlow,
            0.18
          )
        ]
      };
  }
}

export function getWallTreatment(
  theme: SectorVisualTheme,
  rect: Rect
): WallTreatment {
  const scale = Math.min(rect.width, rect.height);
  const capHeight = clamp(round(scale / 10), 4, 12);
  const trimThickness = clamp(round(scale / 22), 2, 5);
  const shadowOffset = clamp(round(scale / 9), 4, 12);

  return {
    faceTint: mixColor(theme.palette.wallBase, theme.palette.wallTrim, 0.14),
    faceAlpha: 0.94,
    capTint: mixColor(theme.palette.wallTrim, theme.palette.glow, 0.24),
    capAlpha: 0.92,
    capHeight,
    trimTint: mixColor(theme.palette.wallTrim, theme.palette.glow, 0.4),
    trimAlpha: 0.34,
    trimThickness,
    shadowTint: mixColor(theme.palette.background, 0x000000, 0.42),
    shadowAlpha: 0.3,
    shadowOffsetX: shadowOffset,
    shadowOffsetY: shadowOffset
  };
}
