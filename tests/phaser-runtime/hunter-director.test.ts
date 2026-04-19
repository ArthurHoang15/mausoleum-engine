import { describe, expect, it } from "vitest";

import {
  advanceDronePatrolState,
  hasVisionOnTarget
} from "../../src/phaser/runtime/hunter-logic";

describe("hasVisionOnTarget", () => {
  it("detects a visible target inside range and field of view", () => {
    expect(
      hasVisionOnTarget({
        drone: { x: 0, y: 0 },
        target: { x: 80, y: 0 },
        range: 120,
        facingAngle: 0,
        fov: Math.PI / 4,
        hidden: false
      })
    ).toBe(true);
  });

  it("ignores hidden targets even inside the vision cone", () => {
    expect(
      hasVisionOnTarget({
        drone: { x: 0, y: 0 },
        target: { x: 60, y: 0 },
        range: 120,
        facingAngle: 0,
        fov: Math.PI / 4,
        hidden: true
      })
    ).toBe(false);
  });
});

describe("advanceDronePatrolState", () => {
  it("snaps to the next patrol point and preserves forward direction mid-route", () => {
    const next = advanceDronePatrolState(
      {
        position: { x: 0, y: 0 },
        pathIndex: 0,
        direction: 1
      },
      {
        path: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 }
        ],
        speed: 80
      },
      1
    );

    expect(next.position).toEqual({ x: 50, y: 0 });
    expect(next.pathIndex).toBe(1);
    expect(next.direction).toBe(1);
  });

  it("reverses direction when the drone reaches the end of its patrol route", () => {
    const next = advanceDronePatrolState(
      {
        position: { x: 50, y: 0 },
        pathIndex: 1,
        direction: 1
      },
      {
        path: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 }
        ],
        speed: 80
      },
      1
    );

    expect(next.position).toEqual({ x: 100, y: 0 });
    expect(next.pathIndex).toBe(2);
    expect(next.direction).toBe(-1);
  });
});
