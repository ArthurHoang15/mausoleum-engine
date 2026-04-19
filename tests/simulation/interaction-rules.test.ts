import { describe, expect, test } from "vitest";

import {
  applyImprovisedBench,
  applySurgeryPod,
  collectMemoryFragment,
  createGameState,
  getMemoryFragmentsInRevealOrder,
  resolvePulseEscape,
  triggerContainment,
  useEnergyCell,
  useMineralRelic
} from "../../src/game/simulation/state";

describe("interaction rules", () => {
  test("mineral relic restores condition for a target module", () => {
    const state = useMineralRelic(createGameState(), "eyes", 18);

    expect(state.modules.eyes.condition).toBe(100);
  });

  test("energy cell restores charge without changing condition", () => {
    const state = useEnergyCell(createGameState(), "core", 15);

    expect(state.modules.core.charge).toBe(100);
    expect(state.modules.core.condition).toBe(100);
  });

  test("surgery pod restores all modules and updates checkpoint", () => {
    const repaired = applySurgeryPod(createGameState(), "choir-archives");

    expect(repaired.checkpointSectorId).toBe("choir-archives");
    expect(repaired.modules.eyes.charge).toBe(100);
    expect(repaired.modules.core.condition).toBe(100);
  });

  test("improvised bench partially repairs but spikes signal", () => {
    const repaired = applyImprovisedBench(createGameState(), "legs");

    expect(repaired.modules.legs.condition).toBeGreaterThan(100 - 1);
    expect(repaired.signalLevel).toBeGreaterThan(0);
  });

  test("memory fragments are collected once", () => {
    const once = collectMemoryFragment(createGameState(), "memory-1");
    const twice = collectMemoryFragment(once, "memory-1");

    expect(twice.memoryFragments).toEqual(["memory-1"]);
  });

  test("containment returns to the checkpoint with a small recovery tax", () => {
    const state = {
      ...createGameState(),
      modules: {
        ...createGameState().modules,
        eyes: {
          charge: 72,
          condition: 58,
          recentSignal: 12
        }
      }
    };

    const contained = triggerContainment(state);

    expect(contained.currentSectorId).toBe("hub");
    expect(contained.signalLevel).toBe(0);
    expect(contained.hunterPhase).toBe("containment");
    expect(contained.containmentCount).toBe(1);
    expect(contained.modules.eyes.charge).toBeLessThan(72);
    expect(contained.modules.eyes.charge).toBeGreaterThan(50);
    expect(contained.modules.eyes.condition).toBeLessThan(58);
    expect(contained.modules.eyes.condition).toBeGreaterThan(45);
  });

  test("pulse escape only softens an active pulse hunt", () => {
    const escaped = resolvePulseEscape(createGameState());

    expect(escaped.hunterPhase).toBe("dormant");
    expect(escaped.signalLevel).toBe(0);
  });

  test("memory fragments follow the sector reveal order", () => {
    let state = createGameState();

    state = collectMemoryFragment(state, "memory-choir");
    state = collectMemoryFragment(state, "hub-echo");
    state = collectMemoryFragment(state, "memory-furnace");
    state = collectMemoryFragment(state, "memory-lens");

    expect(getMemoryFragmentsInRevealOrder(state)).toEqual([
      "hub-echo",
      "memory-lens",
      "memory-choir",
      "memory-furnace"
    ]);
  });
});
