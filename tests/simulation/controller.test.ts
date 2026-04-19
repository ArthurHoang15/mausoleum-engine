// @vitest-environment jsdom

import { afterEach, describe, expect, test } from "vitest";

import { GameController } from "../../src/game/simulation/controller";
import { createGameState, type SectorId } from "../../src/game/simulation/state";

const SAVE_KEY = "mausoleum-engine-save-v1";

afterEach(() => {
  window.localStorage.clear();
});

describe("game controller", () => {
  test("rehydrates stale saves into an endings-ready final sector state", () => {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...createGameState(),
        objectivesCollected: [
          "lens-basilica",
          "ossuary-shafts",
          "choir-archives",
          "reliquary-furnace"
        ] as SectorId[],
        unlockedSectorIds: ["hub", "lens-basilica"] as SectorId[],
        availableEndings: []
      })
    );

    const controller = new GameController();

    expect(controller.state.unlockedSectorIds).toEqual([
      "hub",
      "lens-basilica",
      "ossuary-shafts",
      "choir-archives",
      "reliquary-furnace"
    ]);
    expect(controller.state.availableEndings).toEqual([
      "break-the-rite",
      "become-the-caretaker",
      "escape-incomplete"
    ]);
  });
});
