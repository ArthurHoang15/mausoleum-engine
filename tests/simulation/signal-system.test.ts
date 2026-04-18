import { describe, expect, test } from "vitest";

import {
  advanceHunterState,
  applyModuleAction,
  createGameState,
  getHunterPhase
} from "../../src/game/simulation/state";

describe("signal system", () => {
  test("reaches aware when cumulative signal crosses the first threshold", () => {
    const state = createGameState();
    const rack = applyModuleAction(state.modules, {
      module: "eyes",
      chargeCost: 10,
      strain: 8,
      signal: 24
    });

    const next = advanceHunterState({ ...state, modules: rack }, 0.25);

    expect(next.signalLevel).toBeGreaterThanOrEqual(24);
    expect(getHunterPhase(next)).toBe("aware");
  });

  test("enters pulse hunt when signal spikes into the top tier", () => {
    const state = createGameState();
    const first = advanceHunterState(
      {
        ...state,
        modules: applyModuleAction(state.modules, {
          module: "neural",
          chargeCost: 18,
          strain: 18,
          signal: 42
        })
      },
      0.1
    );

    const second = advanceHunterState(
      {
        ...first,
        modules: applyModuleAction(first.modules, {
          module: "core",
          chargeCost: 25,
          strain: 30,
          signal: 35
        })
      },
      0.1
    );

    expect(second.signalLevel).toBeGreaterThanOrEqual(72);
    expect(getHunterPhase(second)).toBe("pulse-hunt");
  });

  test("decays back toward dormant when the player goes quiet", () => {
    let state = createGameState();

    state = advanceHunterState(
      {
        ...state,
        modules: applyModuleAction(state.modules, {
          module: "legs",
          chargeCost: 12,
          strain: 14,
          signal: 28
        })
      },
      0.1
    );

    state = advanceHunterState(state, 12);

    expect(state.signalLevel).toBeLessThan(20);
    expect(getHunterPhase(state)).toBe("dormant");
  });
});
