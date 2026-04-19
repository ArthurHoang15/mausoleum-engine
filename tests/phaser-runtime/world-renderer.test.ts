import { describe, expect, it } from "vitest";

import {
  getVisibleWallRect,
  getPulseTweenProfile,
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

describe("getPulseTweenProfile", () => {
  it("stays deterministic for the same wall geometry", () => {
    const profileA = getPulseTweenProfile(
      {
        id: "wall-a",
        x: 10,
        y: 20,
        width: 100,
        height: 40
      },
      {
        x: 30,
        y: 10,
        width: 140,
        height: 48
      }
    );
    const profileB = getPulseTweenProfile(
      {
        id: "wall-a",
        x: 10,
        y: 20,
        width: 100,
        height: 40
      },
      {
        x: 30,
        y: 10,
        width: 140,
        height: 48
      }
    );

    expect(profileA).toEqual(profileB);
  });

  it("stretches larger reconfigurations with more dramatic timing", () => {
    const subtle = getPulseTweenProfile(
      {
        id: "wall-subtle",
        x: 10,
        y: 20,
        width: 100,
        height: 40
      },
      {
        x: 12,
        y: 20,
        width: 104,
        height: 40
      }
    );
    const dramatic = getPulseTweenProfile(
      {
        id: "wall-dramatic",
        x: 10,
        y: 20,
        width: 100,
        height: 40
      },
      {
        x: 80,
        y: 60,
        width: 220,
        height: 90
      }
    );

    expect(dramatic.duration).toBeGreaterThan(subtle.duration);
    expect(dramatic.delay).toBeGreaterThanOrEqual(0);
  });
});
