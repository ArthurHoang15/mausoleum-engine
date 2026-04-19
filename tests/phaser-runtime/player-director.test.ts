import { describe, expect, it } from "vitest";

import { combineMovementInput } from "../../src/phaser/runtime/player-math";

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
