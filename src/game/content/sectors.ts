import type {
  EndingChoice,
  ModuleKind,
  SectorId
} from "../simulation/state";
import type { VisualThemeId } from "./visualThemes";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WallDefinition {
  id: string;
  rect: Rect;
  pulseRect?: Rect;
}

export interface HidingSpotDefinition {
  id: string;
  label: string;
  rect: Rect;
}

export interface DoorDefinition {
  id: string;
  label: string;
  prompt: string;
  rect: Rect;
  targetSectorId: SectorId;
  requiresObjective?: SectorId;
  requiresAllObjectives?: boolean;
}

export type InteractionKind =
  | "mineral"
  | "energy"
  | "memory"
  | "objective"
  | "pod"
  | "bench"
  | "ending";

export interface InteractionDefinition {
  id: string;
  kind: InteractionKind;
  label: string;
  prompt: string;
  rect: Rect;
  module?: ModuleKind;
  amount?: number;
  fragmentId?: string;
  body?: string;
  hiddenUntilScan?: boolean;
  endingChoice?: EndingChoice;
  memoryBeat?: number;
}

export interface DroneDefinition {
  id: string;
  path: Point[];
  speed: number;
  range: number;
  fov: number;
  tint: number;
}

export interface ProtocolZoneDefinition {
  id: string;
  label: string;
  rect: Rect;
  module?: ModuleKind;
  signalPerSecond: number;
  strainPerSecond: number;
  tint: number;
}

export interface SectorDefinition {
  id: SectorId;
  name: string;
  subtitle: string;
  moduleFocus: ModuleKind;
  visualThemeId: VisualThemeId;
  introLine: string;
  objectiveLabel: string;
  objectiveHint: string;
  size: { width: number; height: number };
  start: Point;
  walls: WallDefinition[];
  doors: DoorDefinition[];
  hidingSpots: HidingSpotDefinition[];
  interactions: InteractionDefinition[];
  drones: DroneDefinition[];
  protocolZones: ProtocolZoneDefinition[];
}

const hub: SectorDefinition = {
  id: "hub",
  name: "The Hollow Spine",
  subtitle: "A maintenance nave humming with dead prayers.",
  moduleFocus: "core",
  visualThemeId: "hollow-spine",
  introLine:
    "The spine of the Mausoleum Engine is quiet, but never truly safe.",
  objectiveLabel: "Traverse the unlocked sectors and recover each rite-key.",
  objectiveHint:
    "The Lens Basilica is open. Recover the first relic and return here.",
  size: { width: 1400, height: 900 },
  start: { x: 700, y: 700 },
  walls: [
    { id: "hub-altar", rect: { x: 560, y: 250, width: 280, height: 60 } },
    { id: "hub-left-wall", rect: { x: 220, y: 250, width: 80, height: 400 } },
    { id: "hub-right-wall", rect: { x: 1100, y: 250, width: 80, height: 400 } },
    { id: "hub-lower-left", rect: { x: 370, y: 650, width: 180, height: 60 } },
    { id: "hub-lower-right", rect: { x: 850, y: 650, width: 180, height: 60 } }
  ],
  doors: [
    {
      id: "door-lens",
      label: "Lens Basilica",
      prompt: "Enter Lens Basilica",
      rect: { x: 640, y: 60, width: 120, height: 60 },
      targetSectorId: "lens-basilica"
    },
    {
      id: "door-ossuary",
      label: "Ossuary Shafts",
      prompt: "Enter Ossuary Shafts",
      rect: { x: 60, y: 400, width: 60, height: 120 },
      targetSectorId: "ossuary-shafts",
      requiresObjective: "lens-basilica"
    },
    {
      id: "door-choir",
      label: "Choir Archives",
      prompt: "Enter Choir Archives",
      rect: { x: 1280, y: 400, width: 60, height: 120 },
      targetSectorId: "choir-archives",
      requiresObjective: "ossuary-shafts"
    },
    {
      id: "door-furnace",
      label: "Reliquary Furnace",
      prompt: "Enter Reliquary Furnace",
      rect: { x: 640, y: 800, width: 120, height: 60 },
      targetSectorId: "reliquary-furnace",
      requiresObjective: "choir-archives"
    }
  ],
  hidingSpots: [
    {
      id: "hub-shadow-left",
      label: "Choir Shadow",
      rect: { x: 320, y: 720, width: 120, height: 80 }
    },
    {
      id: "hub-shadow-right",
      label: "Choir Shadow",
      rect: { x: 960, y: 720, width: 120, height: 80 }
    }
  ],
  interactions: [
    {
      id: "hub-pod",
      kind: "pod",
      label: "Trusted Surgery Pod",
      prompt: "Recalibrate at surgery pod",
      rect: { x: 610, y: 150, width: 180, height: 70 }
    },
    {
      id: "hub-bench",
      kind: "bench",
      label: "Improvised Bench",
      prompt: "Use improvised bench",
      rect: { x: 590, y: 720, width: 220, height: 60 },
      module: "core"
    },
    {
      id: "hub-memory",
      kind: "memory",
      label: "Assembly Reliquary",
      prompt: "Review assembled memory echoes",
      rect: { x: 1060, y: 150, width: 140, height: 80 },
      fragmentId: "hub-echo",
      memoryBeat: 1,
      body:
        "The reliquary catalogs civilizations as liturgies, not corpses. Humanity is filed under 'Incomplete Chorus', and the file is marked active."
    }
  ],
  drones: [],
  protocolZones: [
    {
      id: "hub-core-zone",
      label: "Resonant floor",
      rect: { x: 560, y: 320, width: 280, height: 80 },
      module: "core",
      signalPerSecond: 0.8,
      strainPerSecond: 0.25,
      tint: 0x89a4ff
    }
  ]
};

const lensBasilica: SectorDefinition = {
  id: "lens-basilica",
  name: "Lens Basilica",
  subtitle: "Mirrored aisles and saint-machines of sight.",
  moduleFocus: "eyes",
  visualThemeId: "lens-basilica",
  introLine:
    "The basilica keeps looking at you, even when every lens is cracked.",
  objectiveLabel: "Recover the spectral lens key and reveal the first truth.",
  objectiveHint: "Use Eyes scans to reveal a hidden mineral seam and patrol lines.",
  size: { width: 1600, height: 900 },
  start: { x: 140, y: 460 },
  walls: [
    { id: "lens-center-left", rect: { x: 430, y: 180, width: 70, height: 500 } },
    {
      id: "lens-center-right",
      rect: { x: 1100, y: 180, width: 70, height: 500 }
    },
    {
      id: "lens-middle-altar",
      rect: { x: 660, y: 340, width: 280, height: 80 },
      pulseRect: { x: 620, y: 280, width: 360, height: 80 }
    },
    {
      id: "lens-upper-screen",
      rect: { x: 640, y: 140, width: 320, height: 50 },
      pulseRect: { x: 640, y: 90, width: 320, height: 50 }
    }
  ],
  doors: [
    {
      id: "lens-to-hub",
      label: "Return to Hollow Spine",
      prompt: "Return to the Hollow Spine",
      rect: { x: 30, y: 390, width: 50, height: 140 },
      targetSectorId: "hub"
    }
  ],
  hidingSpots: [
    {
      id: "lens-shadow-left",
      label: "Mirrored Alcove",
      rect: { x: 250, y: 700, width: 130, height: 90 }
    },
    {
      id: "lens-shadow-right",
      label: "Mirrored Alcove",
      rect: { x: 1220, y: 700, width: 130, height: 90 }
    }
  ],
  interactions: [
    {
      id: "lens-mineral",
      kind: "mineral",
      label: "Hidden Mineral Seam",
      prompt: "Harvest mineral seam",
      rect: { x: 1280, y: 140, width: 80, height: 80 },
      module: "eyes",
      amount: 28,
      hiddenUntilScan: true
    },
    {
      id: "lens-energy",
      kind: "energy",
      label: "Funerary Battery",
      prompt: "Recover energy cell",
      rect: { x: 240, y: 170, width: 70, height: 70 },
      module: "eyes",
      amount: 24
    },
    {
      id: "lens-memory",
      kind: "memory",
      label: "Constellation Glass",
      prompt: "Read memory echo",
      rect: { x: 770, y: 720, width: 90, height: 90 },
      fragmentId: "memory-lens",
      memoryBeat: 2,
      body:
        "Earth's final sky was mapped in machine constellations before the first cities went dark. The first truth was observation."
    },
    {
      id: "lens-bench",
      kind: "bench",
      label: "Field Recalibration Bench",
      prompt: "Use recalibration bench",
      rect: { x: 500, y: 730, width: 160, height: 60 },
      module: "eyes"
    },
    {
      id: "lens-objective",
      kind: "objective",
      label: "Spectral Lens Key",
      prompt: "Recover spectral lens key",
      rect: { x: 1390, y: 380, width: 110, height: 110 },
      module: "eyes",
      body:
        "Preservation was the stated doctrine. Selection was the hidden rite."
    }
  ],
  drones: [
    {
      id: "lens-drone-1",
      path: [
        { x: 250, y: 300 },
        { x: 700, y: 250 },
        { x: 1100, y: 280 }
      ],
      speed: 80,
      range: 240,
      fov: 0.78,
      tint: 0x9bd3ff
    },
    {
      id: "lens-drone-2",
      path: [
        { x: 1300, y: 620 },
        { x: 980, y: 650 },
        { x: 620, y: 610 }
      ],
      speed: 72,
      range: 220,
      fov: 0.82,
      tint: 0xcde8ff
    }
  ],
  protocolZones: [
    {
      id: "lens-heat-window",
      label: "Thermal window",
      rect: { x: 1320, y: 290, width: 150, height: 250 },
      module: "eyes",
      signalPerSecond: 2.4,
      strainPerSecond: 1.3,
      tint: 0x6dc9ff
    }
  ]
};

const ossuaryShafts: SectorDefinition = {
  id: "ossuary-shafts",
  name: "Ossuary Shafts",
  subtitle: "Vertical graves and transport coffins in endless suspension.",
  moduleFocus: "legs",
  visualThemeId: "ossuary-shafts",
  introLine: "Every rail here was built to move bodies upward or away.",
  objectiveLabel: "Claim the ascent sigil and unlock the upper route.",
  objectiveHint: "Dash through sightlines and use shadows between the hanging ossuaries.",
  size: { width: 1600, height: 900 },
  start: { x: 150, y: 760 },
  walls: [
    { id: "ossuary-column-left", rect: { x: 460, y: 140, width: 90, height: 620 } },
    {
      id: "ossuary-column-right",
      rect: { x: 1030, y: 140, width: 90, height: 620 }
    },
    {
      id: "ossuary-bridge",
      rect: { x: 610, y: 350, width: 380, height: 50 },
      pulseRect: { x: 610, y: 450, width: 380, height: 50 }
    },
    {
      id: "ossuary-lower-rib",
      rect: { x: 620, y: 620, width: 360, height: 60 },
      pulseRect: { x: 740, y: 620, width: 360, height: 60 }
    }
  ],
  doors: [
    {
      id: "ossuary-to-hub",
      label: "Return to Hollow Spine",
      prompt: "Return to the Hollow Spine",
      rect: { x: 30, y: 390, width: 50, height: 140 },
      targetSectorId: "hub"
    }
  ],
  hidingSpots: [
    {
      id: "ossuary-shadow-bottom",
      label: "Coffin Shadow",
      rect: { x: 280, y: 760, width: 140, height: 80 }
    },
    {
      id: "ossuary-shadow-top",
      label: "Rail Shadow",
      rect: { x: 1220, y: 130, width: 140, height: 80 }
    }
  ],
  interactions: [
    {
      id: "ossuary-mineral",
      kind: "mineral",
      label: "Dense Mobility Crystal",
      prompt: "Extract mobility crystal",
      rect: { x: 1210, y: 170, width: 80, height: 80 },
      module: "legs",
      amount: 26
    },
    {
      id: "ossuary-energy",
      kind: "energy",
      label: "Rail Capacitor",
      prompt: "Claim rail capacitor",
      rect: { x: 780, y: 180, width: 70, height: 70 },
      module: "legs",
      amount: 24
    },
    {
      id: "ossuary-memory",
      kind: "memory",
      label: "Procession Coffin",
      prompt: "Read procession record",
      rect: { x: 1260, y: 640, width: 90, height: 90 },
      fragmentId: "memory-ossuary",
      memoryBeat: 3,
      body:
        "The coffins did not carry mourners. They carried candidates sorted by compatibility score, raised and lowered like inventory."
    },
    {
      id: "ossuary-bench",
      kind: "bench",
      label: "Lift Maintenance Bench",
      prompt: "Use maintenance bench",
      rect: { x: 660, y: 760, width: 180, height: 60 },
      module: "legs"
    },
    {
      id: "ossuary-objective",
      kind: "objective",
      label: "Ascent Sigil",
      prompt: "Secure ascent sigil",
      rect: { x: 1390, y: 330, width: 110, height: 110 },
      module: "legs",
      body:
        "Humanity was not evacuated. It was filtered, stacked, and carried deeper into the Engine."
    }
  ],
  drones: [
    {
      id: "ossuary-drone-1",
      path: [
        { x: 280, y: 220 },
        { x: 820, y: 220 },
        { x: 1280, y: 260 }
      ],
      speed: 90,
      range: 250,
      fov: 0.85,
      tint: 0xd7c1ff
    },
    {
      id: "ossuary-drone-2",
      path: [
        { x: 1260, y: 740 },
        { x: 850, y: 720 },
        { x: 300, y: 700 }
      ],
      speed: 78,
      range: 230,
      fov: 0.72,
      tint: 0xf1e4ff
    }
  ],
  protocolZones: [
    {
      id: "ossuary-pressure",
      label: "Pressure bridge",
      rect: { x: 640, y: 420, width: 320, height: 80 },
      module: "legs",
      signalPerSecond: 2.2,
      strainPerSecond: 1.2,
      tint: 0xa87cff
    }
  ]
};

const choirArchives: SectorDefinition = {
  id: "choir-archives",
  name: "Choir Archives",
  subtitle: "Language organs and signal liturgies whisper through the walls.",
  moduleFocus: "neural",
  visualThemeId: "choir-archives",
  introLine:
    "The archives do not store facts. They rehearse them until they become doctrine.",
  objectiveLabel: "Decode the catastrophe hymn and steal the archive key.",
  objectiveHint: "Neural actions are strong here, but the facility can hear every one of them.",
  size: { width: 1600, height: 900 },
  start: { x: 160, y: 430 },
  walls: [
    { id: "choir-column-left", rect: { x: 470, y: 150, width: 80, height: 560 } },
    {
      id: "choir-column-right",
      rect: { x: 1040, y: 150, width: 80, height: 560 }
    },
    {
      id: "choir-organ-top",
      rect: { x: 660, y: 140, width: 280, height: 60 },
      pulseRect: { x: 660, y: 80, width: 280, height: 60 }
    },
    {
      id: "choir-organ-bottom",
      rect: { x: 660, y: 640, width: 280, height: 60 },
      pulseRect: { x: 660, y: 700, width: 280, height: 60 }
    }
  ],
  doors: [
    {
      id: "choir-to-hub",
      label: "Return to Hollow Spine",
      prompt: "Return to the Hollow Spine",
      rect: { x: 30, y: 390, width: 50, height: 140 },
      targetSectorId: "hub"
    }
  ],
  hidingSpots: [
    {
      id: "choir-shadow-left",
      label: "Signal Niche",
      rect: { x: 260, y: 130, width: 140, height: 80 }
    },
    {
      id: "choir-shadow-right",
      label: "Signal Niche",
      rect: { x: 1210, y: 700, width: 140, height: 80 }
    }
  ],
  interactions: [
    {
      id: "choir-mineral",
      kind: "mineral",
      label: "Signal Crystal",
      prompt: "Harvest signal crystal",
      rect: { x: 1260, y: 150, width: 80, height: 80 },
      module: "neural",
      amount: 26
    },
    {
      id: "choir-energy",
      kind: "energy",
      label: "Archive Capacitor",
      prompt: "Recover archive capacitor",
      rect: { x: 720, y: 750, width: 70, height: 70 },
      module: "neural",
      amount: 24
    },
    {
      id: "choir-memory",
      kind: "memory",
      label: "Catastrophe Hymn",
      prompt: "Decode catastrophe hymn",
      rect: { x: 800, y: 250, width: 90, height: 90 },
      fragmentId: "memory-choir",
      memoryBeat: 4,
      body:
        "The collapse on Earth was synchronized to one compatibility signature. Yours. The machine was waiting for the note."
    },
    {
      id: "choir-pod",
      kind: "pod",
      label: "Archive Surgery Pod",
      prompt: "Use surgery pod",
      rect: { x: 270, y: 740, width: 170, height: 70 }
    },
    {
      id: "choir-objective",
      kind: "objective",
      label: "Archive Key",
      prompt: "Steal archive key",
      rect: { x: 1380, y: 380, width: 110, height: 110 },
      module: "neural",
      body:
        "You were not the last compatible survivor. You were the intended product."
    }
  ],
  drones: [
    {
      id: "choir-drone-1",
      path: [
        { x: 240, y: 450 },
        { x: 760, y: 450 },
        { x: 1260, y: 450 }
      ],
      speed: 88,
      range: 240,
      fov: 0.8,
      tint: 0x9df5d3
    },
    {
      id: "choir-drone-2",
      path: [
        { x: 1250, y: 240 },
        { x: 850, y: 320 },
        { x: 360, y: 240 }
      ],
      speed: 68,
      range: 220,
      fov: 0.78,
      tint: 0xd6fff0
    }
  ],
  protocolZones: [
    {
      id: "choir-neural-zone",
      label: "Choir resonance",
      rect: { x: 700, y: 350, width: 220, height: 180 },
      module: "neural",
      signalPerSecond: 2.8,
      strainPerSecond: 1.5,
      tint: 0x4fe4bf
    }
  ]
};

const reliquaryFurnace: SectorDefinition = {
  id: "reliquary-furnace",
  name: "Reliquary Furnace",
  subtitle: "The hot sacred heart where choice becomes rite.",
  moduleFocus: "core",
  visualThemeId: "reliquary-furnace",
  introLine:
    "The furnace knows your shape. It has been preparing a place for you.",
  objectiveLabel: "Seize the living key, survive the final hunt, then choose the rite.",
  objectiveHint: "Core overclock keeps you alive here, but every flare calls the Warden.",
  size: { width: 1600, height: 900 },
  start: { x: 150, y: 440 },
  walls: [
    { id: "furnace-left-pillar", rect: { x: 490, y: 150, width: 80, height: 550 } },
    {
      id: "furnace-right-pillar",
      rect: { x: 1030, y: 150, width: 80, height: 550 }
    },
    {
      id: "furnace-core-shell",
      rect: { x: 700, y: 320, width: 200, height: 180 },
      pulseRect: { x: 660, y: 270, width: 280, height: 240 }
    }
  ],
  doors: [
    {
      id: "furnace-to-hub",
      label: "Return to Hollow Spine",
      prompt: "Return to the Hollow Spine",
      rect: { x: 30, y: 390, width: 50, height: 140 },
      targetSectorId: "hub"
    }
  ],
  hidingSpots: [
    {
      id: "furnace-shadow-left",
      label: "Cooling Chapel",
      rect: { x: 250, y: 720, width: 140, height: 80 }
    },
    {
      id: "furnace-shadow-right",
      label: "Cooling Chapel",
      rect: { x: 1210, y: 120, width: 140, height: 80 }
    }
  ],
  interactions: [
    {
      id: "furnace-energy",
      kind: "energy",
      label: "Primary Capacitor",
      prompt: "Claim primary capacitor",
      rect: { x: 290, y: 160, width: 80, height: 80 },
      module: "core",
      amount: 28
    },
    {
      id: "furnace-mineral",
      kind: "mineral",
      label: "Heartglass Relic",
      prompt: "Extract heartglass relic",
      rect: { x: 1240, y: 700, width: 80, height: 80 },
      module: "core",
      amount: 30
    },
    {
      id: "furnace-memory",
      kind: "memory",
      label: "Final Litany",
      prompt: "Hear the final litany",
      rect: { x: 800, y: 140, width: 90, height: 90 },
      fragmentId: "memory-furnace",
      memoryBeat: 5,
      body:
        "The Mausoleum Engine was never asked to save humanity. It was asked to complete you, and the final chamber never hid that fact."
    },
    {
      id: "furnace-pod",
      kind: "pod",
      label: "Core Surgery Pod",
      prompt: "Use surgery pod",
      rect: { x: 250, y: 730, width: 170, height: 70 }
    },
    {
      id: "furnace-objective",
      kind: "objective",
      label: "Living Key",
      prompt: "Take the living key",
      rect: { x: 1240, y: 360, width: 120, height: 120 },
      module: "core",
      body:
        "The rite is complete. Only your decision remains."
    },
    {
      id: "ending-break",
      kind: "ending",
      label: "Break the Rite",
      prompt: "Choose Break the Rite",
      rect: { x: 560, y: 760, width: 120, height: 80 },
      endingChoice: "break-the-rite"
    },
    {
      id: "ending-caretaker",
      kind: "ending",
      label: "Become the Caretaker",
      prompt: "Choose Become the Caretaker",
      rect: { x: 740, y: 760, width: 120, height: 80 },
      endingChoice: "become-the-caretaker"
    },
    {
      id: "ending-escape",
      kind: "ending",
      label: "Escape Incomplete",
      prompt: "Choose Escape Incomplete",
      rect: { x: 920, y: 760, width: 120, height: 80 },
      endingChoice: "escape-incomplete"
    }
  ],
  drones: [
    {
      id: "furnace-drone-1",
      path: [
        { x: 300, y: 300 },
        { x: 800, y: 240 },
        { x: 1280, y: 300 }
      ],
      speed: 94,
      range: 260,
      fov: 0.88,
      tint: 0xffbc8f
    }
  ],
  protocolZones: [
    {
      id: "furnace-core-bleed",
      label: "Core flare conduit",
      rect: { x: 650, y: 250, width: 300, height: 300 },
      module: "core",
      signalPerSecond: 3.2,
      strainPerSecond: 1.7,
      tint: 0xff824f
    }
  ]
};

export const sectorsById: Record<SectorId, SectorDefinition> = {
  hub,
  "lens-basilica": lensBasilica,
  "ossuary-shafts": ossuaryShafts,
  "choir-archives": choirArchives,
  "reliquary-furnace": reliquaryFurnace
};

export const sectorOrder: SectorId[] = [
  "hub",
  "lens-basilica",
  "ossuary-shafts",
  "choir-archives",
  "reliquary-furnace"
];
