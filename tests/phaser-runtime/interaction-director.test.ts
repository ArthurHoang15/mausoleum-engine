import { describe, expect, it } from "vitest";

import {
  pickNearestByRadius,
  resolveObjectiveText,
  resolvePromptText
} from "../../src/phaser/runtime/InteractionDirector";

describe("pickNearestByRadius", () => {
  it("chooses the closest item within the interaction radius", () => {
    const nearest = pickNearestByRadius(
      { x: 100, y: 100 },
      [
        { id: "far", x: 160, y: 100 },
        { id: "near", x: 120, y: 100 }
      ],
      80
    );

    expect(nearest?.id).toBe("near");
  });

  it("returns null when nothing falls within the radius", () => {
    const nearest = pickNearestByRadius(
      { x: 100, y: 100 },
      [{ id: "far", x: 220, y: 220 }],
      60
    );

    expect(nearest).toBeNull();
  });
});

describe("resolvePromptText", () => {
  it("prioritizes interactions, then doors, then hiding spots", () => {
    expect(
      resolvePromptText({
        interactionPrompt: "Recover spectral lens key",
        doorPrompt: "Return to the Hollow Spine",
        hideSpotLabel: "Mirrored Alcove",
        playerHidden: false
      })
    ).toBe("Recover spectral lens key");

    expect(
      resolvePromptText({
        interactionPrompt: null,
        doorPrompt: "Return to the Hollow Spine",
        hideSpotLabel: "Mirrored Alcove",
        playerHidden: false
      })
    ).toBe("Return to the Hollow Spine");

    expect(
      resolvePromptText({
        interactionPrompt: null,
        doorPrompt: null,
        hideSpotLabel: "Mirrored Alcove",
        playerHidden: true
      })
    ).toBe("Leave shadow");
  });
});

describe("resolveObjectiveText", () => {
  it("guides hub players toward the next unlocked sector", () => {
    expect(
      resolveObjectiveText({
        currentSectorId: "hub",
        currentSectorObjectiveLabel: "Traverse the unlocked sectors and recover each rite-key.",
        currentSectorObjectiveHint: "The Lens Basilica is open. Recover the first relic and return here.",
        objectiveSectorIds: ["lens-basilica"],
        availableEndings: [],
        hubDoorTargets: [
          {
            label: "Lens Basilica",
            targetSectorId: "lens-basilica"
          },
          {
            label: "Ossuary Shafts",
            targetSectorId: "ossuary-shafts",
            requiresObjective: "lens-basilica"
          }
        ]
      })
    ).toBe("Return to the nave and continue through Ossuary Shafts.");
  });

  it("switches the furnace objective once endings are available", () => {
    expect(
      resolveObjectiveText({
        currentSectorId: "reliquary-furnace",
        currentSectorObjectiveLabel: "Reach the exit cradle.",
        currentSectorObjectiveHint: "Recover the living key.",
        objectiveSectorIds: [
          "lens-basilica",
          "ossuary-shafts",
          "choir-archives",
          "reliquary-furnace"
        ],
        availableEndings: ["break-the-rite"],
        hubDoorTargets: []
      })
    ).toBe("The living key is yours. Choose a final rite at the altar below.");
  });
});
