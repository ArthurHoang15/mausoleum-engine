import { describe, expect, it } from "vitest";

import { combineMovementInput } from "../../src/phaser/runtime/player-math";
import { evaluateHiddenMovement } from "../../src/phaser/runtime/stealth-logic";

describe("combineMovementInput", () => {
  it("combines keyboard and touch input and normalizes overflow", () => {
    const vector = combineMovementInput({ x: 1, y: 1 }, { x: 1, y: 0 });

    expect(vector.x).toBeCloseTo(0.8944, 3);
    expect(vector.y).toBeCloseTo(0.4472, 3);
  });

  it("keeps vectors unchanged when their combined length stays within one unit", () => {
    const vector = combineMovementInput({ x: 0, y: 0.5 }, { x: 0.25, y: 0 });

    expect(vector).toEqual({ x: 0.25, y: 0.5 });
  });
});

describe("evaluateHiddenMovement", () => {
  it("lets the player make slight corrective movement without dropping concealment", () => {
    const result = evaluateHiddenMovement({
      hidden: true,
      inputMagnitude: 0.18,
      distanceFromAnchor: 8
    });

    expect(result.reveal).toBe(false);
    expect(result.speedMultiplier).toBeLessThan(0.5);
    expect(result.speedMultiplier).toBeGreaterThan(0);
  });

  it("reveals the player when they push too far out of the hiding pocket", () => {
    expect(
      evaluateHiddenMovement({
        hidden: true,
        inputMagnitude: 0.65,
        distanceFromAnchor: 10
      }).reveal
    ).toBe(true);
    expect(
      evaluateHiddenMovement({
        hidden: true,
        inputMagnitude: 0.12,
        distanceFromAnchor: 22
      }).reveal
    ).toBe(true);
  });
});
