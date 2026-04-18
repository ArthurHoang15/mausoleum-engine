import { describe, expect, test } from "vitest";

import {
  applyImprovisedBench,
  applySurgeryPod,
  collectMemoryFragment,
  createGameState,
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
});
