import type { HunterPhase } from "../../game/simulation/state";
import type { VectorLike } from "./types";

interface WardenBehaviorInput {
  phase: HunterPhase;
  elapsedInPhase: number;
  sectorSize: { width: number; height: number };
  playerPosition: VectorLike;
  playerHidden: boolean;
  lastKnownPlayerPosition: VectorLike | null;
}

interface WardenBehavior {
  visible: boolean;
  target: VectorLike;
  movementSpeed: number;
  desiredDistance: number;
  bodyAlpha: number;
  haloAlpha: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveSearchTarget(
  elapsedInPhase: number,
  sectorSize: { width: number; height: number },
  fallback: VectorLike
): VectorLike {
  const radius = 54 + Math.sin(elapsedInPhase * 1.1) * 28;
  const angle = elapsedInPhase * 1.7;

  return {
    x: clamp(fallback.x + Math.cos(angle) * radius, 64, sectorSize.width - 64),
    y: clamp(fallback.y + Math.sin(angle * 0.9) * radius, 64, sectorSize.height - 64)
  };
}

export function resolveWardenBehavior(
  input: WardenBehaviorInput
): WardenBehavior {
  if (input.phase === "dormant" || input.phase === "containment") {
    return {
      visible: false,
      target: input.playerPosition,
      movementSpeed: 0,
      desiredDistance: 999,
      bodyAlpha: 0,
      haloAlpha: 0
    };
  }

  const fallbackTarget =
    input.lastKnownPlayerPosition ?? input.playerPosition;
  const trackedTarget =
    input.playerHidden && input.lastKnownPlayerPosition
      ? resolveSearchTarget(
          input.elapsedInPhase,
          input.sectorSize,
          input.lastKnownPlayerPosition
        )
      : input.playerPosition;

  if (input.phase === "stalking") {
    return {
      visible: true,
      target: input.playerHidden ? trackedTarget : fallbackTarget,
      movementSpeed: 118,
      desiredDistance: 88,
      bodyAlpha: 0.42,
      haloAlpha: 0.1
    };
  }

  return {
    visible: true,
    target: trackedTarget,
    movementSpeed: 178,
    desiredDistance: 18,
    bodyAlpha: 0.96,
    haloAlpha: 0.18
  };
}
