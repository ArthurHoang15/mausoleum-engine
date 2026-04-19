export type ModuleKind = "eyes" | "legs" | "neural" | "core";
export type ModuleStateLabel = "stable" | "degraded" | "critical";
export type HunterPhase =
  | "dormant"
  | "aware"
  | "stalking"
  | "pulse-hunt"
  | "containment";
export type SectorId =
  | "hub"
  | "lens-basilica"
  | "ossuary-shafts"
  | "choir-archives"
  | "reliquary-furnace";
export type EndingChoice =
  | "break-the-rite"
  | "become-the-caretaker"
  | "escape-incomplete";

export interface ModuleStatus {
  charge: number;
  condition: number;
  recentSignal: number;
}

export interface ModuleRack {
  eyes: ModuleStatus;
  legs: ModuleStatus;
  neural: ModuleStatus;
  core: ModuleStatus;
}

export interface GameState {
  modules: ModuleRack;
  signalLevel: number;
  hunterPhase: HunterPhase;
  unlockedSectorIds: SectorId[];
  objectivesCollected: SectorId[];
  memoryFragments: string[];
  collectedInteractionIds: string[];
  availableEndings: EndingChoice[];
  checkpointSectorId: SectorId;
  currentSectorId: SectorId;
  pulseTimer: number;
  totalElapsed: number;
  lastEvent: string;
  ending: EndingChoice | null;
  containmentCount: number;
}

export interface ModuleAction {
  module: ModuleKind;
  chargeCost?: number;
  chargeGain?: number;
  strain?: number;
  conditionGain?: number;
  signal?: number;
}

const MAX_STAT = 100;
const AWARE_THRESHOLD = 20;
const STALKING_THRESHOLD = 45;
const PULSE_THRESHOLD = 70;
const SIGNAL_DECAY_PER_SECOND = 3;
const PULSE_DURATION_SECONDS = 7;
const CONTAINMENT_CHARGE_TAX = 12;
const CONTAINMENT_CONDITION_TAX = 8;
const MEMORY_FRAGMENT_REVEAL_ORDER = [
  "hub-echo",
  "memory-lens",
  "memory-ossuary",
  "memory-choir",
  "memory-furnace"
];

const memoryFragmentOrderIndex = new Map(
  MEMORY_FRAGMENT_REVEAL_ORDER.map((fragmentId, index) => [fragmentId, index])
);

const sectorUnlockOrder: SectorId[] = [
  "lens-basilica",
  "ossuary-shafts",
  "choir-archives",
  "reliquary-furnace"
];

function clamp(value: number, min = 0, max = MAX_STAT): number {
  return Math.max(min, Math.min(max, value));
}

function createModuleStatus(): ModuleStatus {
  return {
    charge: MAX_STAT,
    condition: MAX_STAT,
    recentSignal: 0
  };
}

function mapRack(
  rack: ModuleRack,
  mapper: (status: ModuleStatus, module: ModuleKind) => ModuleStatus
): ModuleRack {
  return {
    eyes: mapper(rack.eyes, "eyes"),
    legs: mapper(rack.legs, "legs"),
    neural: mapper(rack.neural, "neural"),
    core: mapper(rack.core, "core")
  };
}

function sortMemoryFragments(fragments: string[]): string[] {
  return [...fragments].sort((left, right) => {
    const leftIndex = memoryFragmentOrderIndex.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = memoryFragmentOrderIndex.get(right) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.localeCompare(right);
  });
}

export function reconcileGameState(state: GameState): GameState {
  const collectedObjectives = new Set(state.objectivesCollected);
  const unlocked = new Set<SectorId>(state.unlockedSectorIds);

  unlocked.add("hub");
  unlocked.add("lens-basilica");

  for (const sectorId of sectorUnlockOrder) {
    if (!collectedObjectives.has(sectorId)) {
      continue;
    }

    unlocked.add(sectorId);

    const sectorIndex = sectorUnlockOrder.indexOf(sectorId);
    const nextSectorId = sectorUnlockOrder[sectorIndex + 1];
    if (nextSectorId) {
      unlocked.add(nextSectorId);
    }
  }

  return {
    ...state,
    unlockedSectorIds: [
      "hub",
      ...sectorUnlockOrder.filter((sectorId) => unlocked.has(sectorId))
    ],
    availableEndings: collectedObjectives.has("reliquary-furnace")
      ? ([
          "break-the-rite",
          "become-the-caretaker",
          "escape-incomplete"
        ] as EndingChoice[])
      : state.availableEndings,
    memoryFragments: sortMemoryFragments(state.memoryFragments)
  };
}

export function createModuleRack(): ModuleRack {
  return {
    eyes: createModuleStatus(),
    legs: createModuleStatus(),
    neural: createModuleStatus(),
    core: createModuleStatus()
  };
}

export function createGameState(): GameState {
  return {
    modules: createModuleRack(),
    signalLevel: 0,
    hunterPhase: "dormant",
    unlockedSectorIds: ["hub", "lens-basilica"],
    objectivesCollected: [],
    memoryFragments: [],
    collectedInteractionIds: [],
    availableEndings: [],
    checkpointSectorId: "hub",
    currentSectorId: "hub",
    pulseTimer: 0,
    totalElapsed: 0,
    lastEvent: "Wake in the Hollow Spine.",
    ending: null,
    containmentCount: 0
  };
}

export function getModuleStateLabel(module: ModuleStatus): ModuleStateLabel {
  if (module.condition >= 67) {
    return "stable";
  }

  if (module.condition >= 34) {
    return "degraded";
  }

  return "critical";
}

export function applyModuleAction(
  rack: ModuleRack,
  action: ModuleAction
): ModuleRack {
  return mapRack(rack, (status, module) => {
    if (module !== action.module) {
      return { ...status };
    }

    return {
      charge: clamp(
        status.charge - (action.chargeCost ?? 0) + (action.chargeGain ?? 0)
      ),
      condition: clamp(
        status.condition - (action.strain ?? 0) + (action.conditionGain ?? 0)
      ),
      recentSignal: clamp(status.recentSignal + (action.signal ?? 0), 0, 999)
    };
  });
}

function drainPendingSignal(rack: ModuleRack): {
  rack: ModuleRack;
  signal: number;
} {
  let signal = 0;

  const cleared = mapRack(rack, (status) => {
    signal += status.recentSignal;

    return {
      ...status,
      recentSignal: 0
    };
  });

  return { rack: cleared, signal };
}

function resolveHunterPhase(signalLevel: number, pulseTimer: number): HunterPhase {
  if (pulseTimer > 0) {
    return "pulse-hunt";
  }

  if (signalLevel >= STALKING_THRESHOLD) {
    return "stalking";
  }

  if (signalLevel >= AWARE_THRESHOLD) {
    return "aware";
  }

  return "dormant";
}

export function advanceHunterState(state: GameState, deltaSeconds: number): GameState {
  const drained = drainPendingSignal(state.modules);
  const decay =
    drained.signal > 0 ? 0 : deltaSeconds * SIGNAL_DECAY_PER_SECOND;
  const signalAfterInput = Math.max(0, state.signalLevel + drained.signal - decay);
  const pulseTimer =
    signalAfterInput >= PULSE_THRESHOLD
      ? PULSE_DURATION_SECONDS
      : Math.max(0, state.pulseTimer - deltaSeconds);

  return {
    ...state,
    modules: drained.rack,
    signalLevel: signalAfterInput,
    pulseTimer,
    hunterPhase: resolveHunterPhase(signalAfterInput, pulseTimer),
    totalElapsed: state.totalElapsed + deltaSeconds
  };
}

export function getHunterPhase(state: GameState): HunterPhase {
  return state.hunterPhase;
}

export function getUnlockedSectorIds(state: GameState): SectorId[] {
  return [...state.unlockedSectorIds];
}

export function getAvailableEndings(state: GameState): EndingChoice[] {
  return [...state.availableEndings];
}

export function getMemoryFragmentsInRevealOrder(state: GameState): string[] {
  return sortMemoryFragments(state.memoryFragments);
}

export function collectObjective(state: GameState, sectorId: SectorId): GameState {
  if (state.objectivesCollected.includes(sectorId)) {
    return reconcileGameState({
      ...state,
      lastEvent: `Objective recovered in ${sectorId}.`
    });
  }

  const objectivesCollected = [...state.objectivesCollected, sectorId];

  return reconcileGameState({
    ...state,
    objectivesCollected,
    lastEvent: `Objective recovered in ${sectorId}.`
  });
}

export function useMineralRelic(
  state: GameState,
  module: ModuleKind,
  amount: number
): GameState {
  return {
    ...state,
    modules: applyModuleAction(state.modules, {
      module,
      conditionGain: amount
    }),
    lastEvent: `Mineral relic recalibrated ${module}.`
  };
}

export function useEnergyCell(
  state: GameState,
  module: ModuleKind,
  amount: number
): GameState {
  return {
    ...state,
    modules: applyModuleAction(state.modules, {
      module,
      chargeGain: amount
    }),
    lastEvent: `Energy cell restored ${module} charge.`
  };
}

export function applySurgeryPod(
  state: GameState,
  checkpointSectorId: SectorId
): GameState {
  return {
    ...state,
    modules: createModuleRack(),
    checkpointSectorId,
    currentSectorId: checkpointSectorId,
    signalLevel: 0,
    hunterPhase: "dormant",
    pulseTimer: 0,
    lastEvent: `Surgery pod completed a full recalibration in ${checkpointSectorId}.`
  };
}

export function applyImprovisedBench(
  state: GameState,
  module: ModuleKind
): GameState {
  const updated = applyModuleAction(state.modules, {
    module,
    chargeGain: 16,
    conditionGain: 12,
    signal: 10
  });

  return {
    ...state,
    modules: updated,
    signalLevel: state.signalLevel + 5,
    lastEvent: `Improvised bench stabilized ${module}, but the chamber noticed.`
  };
}

export function collectMemoryFragment(
  state: GameState,
  fragmentId: string
): GameState {
  if (state.memoryFragments.includes(fragmentId)) {
    return state;
  }

  return {
    ...state,
    memoryFragments: sortMemoryFragments([...state.memoryFragments, fragmentId]),
    lastEvent: `Memory fragment recovered: ${fragmentId}.`
  };
}

export function markInteractionCollected(
  state: GameState,
  interactionId: string
): GameState {
  if (state.collectedInteractionIds.includes(interactionId)) {
    return state;
  }

  return {
    ...state,
    collectedInteractionIds: [...state.collectedInteractionIds, interactionId]
  };
}

export function setCurrentSector(state: GameState, sectorId: SectorId): GameState {
  return {
    ...state,
    currentSectorId: sectorId,
    lastEvent: `Entered ${sectorId}.`
  };
}

export function applyEnvironmentalSignal(
  state: GameState,
  amount: number
): GameState {
  return {
    ...state,
    signalLevel: clamp(state.signalLevel + amount, 0, 999),
    hunterPhase: resolveHunterPhase(
      clamp(state.signalLevel + amount, 0, 999),
      state.pulseTimer
    )
  };
}

export function triggerContainment(state: GameState): GameState {
  const taxedModules = mapRack(state.modules, (status) => ({
    ...status,
    charge: clamp(status.charge - CONTAINMENT_CHARGE_TAX),
    condition: clamp(status.condition - CONTAINMENT_CONDITION_TAX),
    recentSignal: 0
  }));

  return {
    ...state,
    modules: taxedModules,
    currentSectorId: state.checkpointSectorId,
    signalLevel: 0,
    hunterPhase: "containment",
    pulseTimer: 0,
    containmentCount: state.containmentCount + 1,
    lastEvent: "Containment field engaged. Returned to checkpoint with a recovery tax."
  };
}

export function resolveContainment(state: GameState): GameState {
  return {
    ...state,
    hunterPhase: "dormant",
    currentSectorId: state.checkpointSectorId
  };
}

export function resolvePulseEscape(state: GameState): GameState {
  if (state.hunterPhase !== "pulse-hunt") {
    return state;
  }

  return {
    ...state,
    signalLevel: Math.min(state.signalLevel, 30),
    hunterPhase: "aware",
    pulseTimer: 0,
    lastEvent: "The Warden Angel lost the trail, but the signal still lingers."
  };
}

export function chooseEnding(
  state: GameState,
  ending: EndingChoice
): GameState {
  return {
    ...state,
    ending,
    lastEvent: `Ending chosen: ${ending}.`
  };
}
