import { describe, expect, it } from "vitest";

import {
  getPresentationPulseFrame,
  getPresentationFloatOffset
} from "../../src/phaser/runtime/pixelPresentationMath";

describe("getPresentationPulseFrame", () => {
  it("loops predictably across a fixed frame count", () => {
    expect(getPresentationPulseFrame(0)).toBe(0);
    expect(getPresentationPulseFrame(89)).toBe(0);
    expect(getPresentationPulseFrame(90)).toBe(1);
    expect(getPresentationPulseFrame(270)).toBe(3);
    expect(getPresentationPulseFrame(360)).toBe(0);
  });
});

describe("getPresentationFloatOffset", () => {
  it("stays within the requested amplitude while preserving phase shifts", () => {
    const base = getPresentationFloatOffset(250, 3, 1000, 0);
    const shifted = getPresentationFloatOffset(250, 3, 1000, Math.PI / 2);

    expect(base).toBeCloseTo(3, 5);
    expect(shifted).toBeCloseTo(0, 5);
    expect(Math.abs(getPresentationFloatOffset(125, 3, 1000, 0))).toBeLessThanOrEqual(3);
  });
});
