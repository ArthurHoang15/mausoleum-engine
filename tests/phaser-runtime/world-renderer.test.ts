import { describe, expect, it } from "vitest";

import {
  getVisibleWallRect,
  isInteractionVisible
} from "../../src/phaser/runtime/world-logic";

describe("getVisibleWallRect", () => {
  it("uses pulse geometry while a hunt pulse is active", () => {
    expect(
      getVisibleWallRect(
        {
          x: 10,
          y: 20,
          width: 100,
          height: 40
        },
        {
          x: 15,
          y: 30,
          width: 110,
          height: 50
        },
        true
      )
    ).toEqual({ x: 15, y: 30, width: 110, height: 50 });
  });
});

describe("isInteractionVisible", () => {
  it("reveals hidden interactions only while scan is active", () => {
    expect(isInteractionVisible(false, 0)).toBe(true);
    expect(isInteractionVisible(true, 0)).toBe(false);
    expect(isInteractionVisible(true, 2.4)).toBe(true);
  });
});
