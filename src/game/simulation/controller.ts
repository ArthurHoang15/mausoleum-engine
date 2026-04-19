import type {
  EndingChoice,
  GameState,
  HunterPhase,
  ModuleKind,
  SectorId
} from "./state";
import {
  advanceHunterState,
  applyEnvironmentalSignal,
  applyImprovisedBench,
  applyModuleAction,
  applySurgeryPod,
  chooseEnding,
  collectMemoryFragment,
  collectObjective,
  createGameState,
  getMemoryFragmentsInRevealOrder,
  markInteractionCollected,
  reconcileGameState,
  resolveContainment,
  resolvePulseEscape,
  setCurrentSector,
  triggerContainment,
  useEnergyCell,
  useMineralRelic
} from "./state";
import type {
  DoorDefinition,
  InteractionDefinition
} from "../content/sectors";

const STORAGE_KEY = "mausoleum-engine-save-v1";

export interface ActionResult {
  ok: boolean;
  toast?: string;
  storyTitle?: string;
  storyBody?: string;
  ending?: EndingChoice;
  transitionTo?: SectorId;
}

function loadState(): GameState {
  if (typeof window === "undefined" || !window.localStorage) {
    return createGameState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createGameState();
  }

  try {
    const parsed = JSON.parse(raw) as GameState;

    if (!parsed || typeof parsed !== "object") {
      return createGameState();
    }

    return {
      ...createGameState(),
      ...parsed
    } as GameState;
  } catch {
    return createGameState();
  }
}

function hydrateState(state: GameState): GameState {
  return reconcileGameState(state);
}

function persistState(state: GameState): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export class GameController {
  private _state: GameState;

  constructor() {
    this._state = hydrateState(loadState());
  }

  get state(): GameState {
    return this._state;
  }

  get hunterPhase(): HunterPhase {
    return this._state.hunterPhase;
  }

  get memoryFragmentsInRevealOrder(): string[] {
    return getMemoryFragmentsInRevealOrder(this._state);
  }

  isInteractionCollected(interactionId: string): boolean {
    return this._state.collectedInteractionIds.includes(interactionId);
  }

  isSectorUnlocked(sectorId: SectorId): boolean {
    return this._state.unlockedSectorIds.includes(sectorId);
  }

  hasAllObjectives(): boolean {
    return this._state.objectivesCollected.length >= 4;
  }

  tick(deltaSeconds: number, environmentalSignal: number): void {
    if (environmentalSignal > 0) {
      this._state = applyEnvironmentalSignal(this._state, environmentalSignal);
    }

    this._state = advanceHunterState(this._state, deltaSeconds);
  }

  useScan(): ActionResult {
    if (this._state.modules.eyes.charge < 12) {
      return { ok: false, toast: "Eyes module charge too low." };
    }

    this._state = {
      ...this._state,
      modules: applyModuleAction(this._state.modules, {
        module: "eyes",
        chargeCost: 12,
        strain: 10,
        signal: 14
      }),
      lastEvent: "Eyes scan unfolded hidden geometry."
    };

    return { ok: true, toast: "Spectral scan active." };
  }

  useDash(): ActionResult {
    if (this._state.modules.legs.charge < 16) {
      return { ok: false, toast: "Legs module charge too low." };
    }

    this._state = {
      ...this._state,
      modules: applyModuleAction(this._state.modules, {
        module: "legs",
        chargeCost: 16,
        strain: 12,
        signal: 10
      }),
      lastEvent: "Legs module burst into a silent dash."
    };

    return { ok: true, toast: "Dash primed." };
  }

  applyPassiveStrain(module: ModuleKind, strain: number): void {
    this._state = {
      ...this._state,
      modules: applyModuleAction(this._state.modules, {
        module,
        strain
      })
    };
  }

  useOverclock(): ActionResult {
    if (this._state.modules.core.charge < 18) {
      return { ok: false, toast: "Core module charge too low." };
    }

    this._state = {
      ...this._state,
      modules: applyModuleAction(this._state.modules, {
        module: "core",
        chargeCost: 18,
        strain: 18,
        signal: 22
      }),
      lastEvent: "Core overclock flooded the chamber with sacred heat."
    };

    return { ok: true, toast: "Core overclock engaged." };
  }

  useDoor(door: DoorDefinition): ActionResult {
    if (
      door.requiresObjective &&
      !this._state.objectivesCollected.includes(door.requiresObjective)
    ) {
      return {
        ok: false,
        toast: `${door.label} remains sealed. Recover the previous rite-key.`
      };
    }

    if (door.requiresAllObjectives && !this.hasAllObjectives()) {
      return {
        ok: false,
        toast: "The cradle will not open before every rite-key is restored."
      };
    }

    this._state = setCurrentSector(this._state, door.targetSectorId);
    persistState(this._state);

    return {
      ok: true,
      toast: `Transit opened to ${door.label}.`,
      transitionTo: door.targetSectorId
    };
  }

  interact(interaction: InteractionDefinition): ActionResult {
    if (
      interaction.kind !== "pod" &&
      interaction.kind !== "bench" &&
      interaction.kind !== "ending" &&
      this.isInteractionCollected(interaction.id)
    ) {
      return { ok: false, toast: `${interaction.label} has already been claimed.` };
    }

    switch (interaction.kind) {
      case "mineral": {
        this._state = markInteractionCollected(this._state, interaction.id);
        this._state = useMineralRelic(
          this._state,
          interaction.module ?? "eyes",
          interaction.amount ?? 24
        );
        return { ok: true, toast: `${interaction.label} restored module condition.` };
      }
      case "energy": {
        this._state = markInteractionCollected(this._state, interaction.id);
        this._state = useEnergyCell(
          this._state,
          interaction.module ?? "core",
          interaction.amount ?? 20
        );
        return { ok: true, toast: `${interaction.label} restored module charge.` };
      }
      case "memory": {
        this._state = markInteractionCollected(this._state, interaction.id);
        this._state = collectMemoryFragment(
          this._state,
          interaction.fragmentId ?? interaction.id
        );
        return {
          ok: true,
          toast: `${interaction.label} remembered.`,
          storyTitle: interaction.label,
          storyBody: interaction.body ?? ""
        };
      }
      case "objective": {
        const module = interaction.module ?? "neural";

        this._state = {
          ...this._state,
          modules: applyModuleAction(this._state.modules, {
            module,
            chargeCost: 14,
            strain: 14,
            signal: 16
          })
        };
        this._state = markInteractionCollected(this._state, interaction.id);
        this._state = collectObjective(this._state, this._state.currentSectorId);
        persistState(this._state);

        return {
          ok: true,
          toast: `${interaction.label} secured.`,
          storyTitle: interaction.label,
          storyBody: interaction.body ?? ""
        };
      }
      case "pod": {
        this._state = applySurgeryPod(this._state, this._state.currentSectorId);
        persistState(this._state);
        return { ok: true, toast: "Full recalibration complete." };
      }
      case "bench": {
        this._state = applyImprovisedBench(
          this._state,
          interaction.module ?? "core"
        );
        return { ok: true, toast: "Bench repair complete. Noise increased." };
      }
      case "ending": {
        if (
          !interaction.endingChoice ||
          !this._state.availableEndings.includes(interaction.endingChoice)
        ) {
          return {
            ok: false,
            toast: "The final rites remain sealed until the living key is claimed."
          };
        }

        this._state = chooseEnding(this._state, interaction.endingChoice);
        persistState(this._state);

        return {
          ok: true,
          toast: interaction.label,
          ending: interaction.endingChoice
        };
      }
    }
  }

  triggerContainment(): void {
    this._state = triggerContainment(this._state);
    persistState(this._state);
  }

  resolveContainment(): void {
    this._state = resolveContainment(this._state);
  }

  resolvePulseEscape(): void {
    this._state = resolvePulseEscape(this._state);
  }

  resetRun(): void {
    this._state = createGameState();
    persistState(this._state);
  }
}
