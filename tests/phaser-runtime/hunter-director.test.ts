import { describe, expect, it } from "vitest";

import {
  advanceDronePatrolState,
  getDroneDetectionStrength,
  hasVisionOnTarget
} from "../../src/phaser/runtime/hunter-logic";
import { resolveWardenBehavior } from "../../src/phaser/runtime/warden-logic";

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

describe("getDroneDetectionStrength", () => {
  it("weights central sightings more heavily than edge sightings", () => {
    const centered = getDroneDetectionStrength({
      drone: { x: 0, y: 0 },
      target: { x: 70, y: 0 },
      range: 160,
      facingAngle: 0,
      fov: Math.PI / 3,
      hidden: false
    });
    const edge = getDroneDetectionStrength({
      drone: { x: 0, y: 0 },
      target: {
        x: Math.cos(Math.PI / 3) * 70,
        y: Math.sin(Math.PI / 3) * 70
      },
      range: 160,
      facingAngle: 0,
      fov: Math.PI / 3,
      hidden: false
    });

    expect(centered).toBeGreaterThan(0.5);
    expect(edge).toBeGreaterThan(0);
    expect(centered).toBeGreaterThan(edge);
  });

  it("drops to zero for hidden or out-of-range targets", () => {
    expect(
      getDroneDetectionStrength({
        drone: { x: 0, y: 0 },
        target: { x: 40, y: 0 },
        range: 100,
        facingAngle: 0,
        fov: Math.PI / 4,
        hidden: true
      })
    ).toBe(0);
    expect(
      getDroneDetectionStrength({
        drone: { x: 0, y: 0 },
        target: { x: 140, y: 0 },
        range: 100,
        facingAngle: 0,
        fov: Math.PI / 4,
        hidden: false
      })
    ).toBe(0);
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

describe("resolveWardenBehavior", () => {
  it("makes pulse hunt more direct and forceful than stalking", () => {
    const stalking = resolveWardenBehavior({
      phase: "stalking",
      elapsedInPhase: 2.2,
      sectorSize: { width: 1600, height: 900 },
      playerPosition: { x: 700, y: 400 },
      playerHidden: false,
      lastKnownPlayerPosition: { x: 680, y: 410 }
    });
    const pulseHunt = resolveWardenBehavior({
      phase: "pulse-hunt",
      elapsedInPhase: 2.2,
      sectorSize: { width: 1600, height: 900 },
      playerPosition: { x: 700, y: 400 },
      playerHidden: false,
      lastKnownPlayerPosition: { x: 680, y: 410 }
    });

    expect(stalking.visible).toBe(true);
    expect(pulseHunt.visible).toBe(true);
    expect(pulseHunt.movementSpeed).toBeGreaterThan(stalking.movementSpeed);
    expect(pulseHunt.desiredDistance).toBeLessThan(stalking.desiredDistance);
    expect(pulseHunt.bodyAlpha).toBeGreaterThan(stalking.bodyAlpha);
  });

  it("searches around the last known position instead of cheating toward a hidden player", () => {
    const behavior = resolveWardenBehavior({
      phase: "pulse-hunt",
      elapsedInPhase: 1.75,
      sectorSize: { width: 1600, height: 900 },
      playerPosition: { x: 960, y: 520 },
      playerHidden: true,
      lastKnownPlayerPosition: { x: 420, y: 260 }
    });

    expect(behavior.visible).toBe(true);
    expect(behavior.target).not.toEqual({ x: 960, y: 520 });
    expect(Math.hypot(behavior.target.x - 420, behavior.target.y - 260)).toBeLessThan(
      120
    );
  });

  it("fully withdraws during dormant and containment phases", () => {
    const dormant = resolveWardenBehavior({
      phase: "dormant",
      elapsedInPhase: 0.4,
      sectorSize: { width: 1600, height: 900 },
      playerPosition: { x: 400, y: 260 },
      playerHidden: false,
      lastKnownPlayerPosition: null
    });
    const containment = resolveWardenBehavior({
      phase: "containment",
      elapsedInPhase: 0.4,
      sectorSize: { width: 1600, height: 900 },
      playerPosition: { x: 400, y: 260 },
      playerHidden: false,
      lastKnownPlayerPosition: null
    });

    expect(dormant.visible).toBe(false);
    expect(containment.visible).toBe(false);
    expect(containment.haloAlpha).toBe(0);
  });
});
