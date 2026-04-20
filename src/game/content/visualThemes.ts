export type VisualThemeId =
  | "hollow-spine"
  | "lens-basilica"
  | "ossuary-shafts"
  | "choir-archives"
  | "reliquary-furnace";

export interface SectorVisualTheme {
  id: VisualThemeId;
  label: string;
  environmentSet: "spine" | "lens" | "ossuary" | "choir" | "furnace";
  palette: {
    background: number;
    floorBase: number;
    floorGrid: number;
    wallBase: number;
    wallTrim: number;
    accent: number;
    glow: number;
    pulseBackdrop: number;
    starfield: number[];
  };
}

export const sectorVisualThemes: Record<VisualThemeId, SectorVisualTheme> = {
  "hollow-spine": {
    id: "hollow-spine",
    label: "Hollow Spine",
    environmentSet: "spine",
    palette: {
      background: 0x070b12,
      floorBase: 0x12192a,
      floorGrid: 0x1b2740,
      wallBase: 0x314465,
      wallTrim: 0x7ba3d9,
      accent: 0xa8d1ff,
      glow: 0xdceeff,
      pulseBackdrop: 0x12162b,
      starfield: [0xffffff, 0xbdd7ff, 0x8faef7]
    }
  },
  "lens-basilica": {
    id: "lens-basilica",
    label: "Lens Basilica",
    environmentSet: "lens",
    palette: {
      background: 0x080b13,
      floorBase: 0x182033,
      floorGrid: 0x29395d,
      wallBase: 0x45546f,
      wallTrim: 0xc7d89a,
      accent: 0xcde7a9,
      glow: 0xf2ffd6,
      pulseBackdrop: 0x0f1325,
      starfield: [0xffffff, 0xe6f5bf, 0xb8dcff]
    }
  },
  "ossuary-shafts": {
    id: "ossuary-shafts",
    label: "Ossuary Shafts",
    environmentSet: "ossuary",
    palette: {
      background: 0x0a0a10,
      floorBase: 0x1a161f,
      floorGrid: 0x312733,
      wallBase: 0x5a4856,
      wallTrim: 0xe0b88f,
      accent: 0xffc58f,
      glow: 0xffe4c9,
      pulseBackdrop: 0x140f17,
      starfield: [0xffffff, 0xffcbad, 0xe6b0ff]
    }
  },
  "choir-archives": {
    id: "choir-archives",
    label: "Choir Archives",
    environmentSet: "choir",
    palette: {
      background: 0x070914,
      floorBase: 0x11182f,
      floorGrid: 0x253a5a,
      wallBase: 0x384f80,
      wallTrim: 0x96b7ff,
      accent: 0xb6c9ff,
      glow: 0xe3ebff,
      pulseBackdrop: 0x0b1021,
      starfield: [0xffffff, 0x8fc4ff, 0xdbc6ff]
    }
  },
  "reliquary-furnace": {
    id: "reliquary-furnace",
    label: "Reliquary Furnace",
    environmentSet: "furnace",
    palette: {
      background: 0x0d0709,
      floorBase: 0x261418,
      floorGrid: 0x4d2425,
      wallBase: 0x6d3734,
      wallTrim: 0xffc38e,
      accent: 0xffae6f,
      glow: 0xffeed6,
      pulseBackdrop: 0x1e0d10,
      starfield: [0xffffff, 0xffbe92, 0xffe2b3]
    }
  }
};

export function getSectorVisualTheme(
  themeId: VisualThemeId
): SectorVisualTheme {
  return sectorVisualThemes[themeId];
}
