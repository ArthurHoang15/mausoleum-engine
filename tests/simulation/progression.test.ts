import { describe, expect, test } from "vitest";

import {
  collectObjective,
  createGameState,
  getAvailableEndings,
  getUnlockedSectorIds
} from "../../src/game/simulation/state";

describe("progression", () => {
  test("unlocks sectors in sequence as objectives are collected", () => {
    let state = createGameState();

    expect(getUnlockedSectorIds(state)).toEqual(["hub", "lens-basilica"]);

    state = collectObjective(state, "lens-basilica");
    expect(getUnlockedSectorIds(state)).toEqual([
      "hub",
      "lens-basilica",
      "ossuary-shafts"
    ]);

    state = collectObjective(state, "ossuary-shafts");
    state = collectObjective(state, "choir-archives");

    expect(getUnlockedSectorIds(state)).toEqual([
      "hub",
      "lens-basilica",
      "ossuary-shafts",
      "choir-archives",
      "reliquary-furnace"
    ]);
  });

  test("offers all endings after the furnace objective is complete", () => {
    let state = createGameState();

    state = collectObjective(state, "lens-basilica");
    state = collectObjective(state, "ossuary-shafts");
    state = collectObjective(state, "choir-archives");
    state = collectObjective(state, "reliquary-furnace");

    expect(getAvailableEndings(state)).toEqual([
      "break-the-rite",
      "become-the-caretaker",
      "escape-incomplete"
    ]);
  });
});
