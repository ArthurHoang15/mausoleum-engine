import type { VectorLike } from "./types";

export interface VisionCheck {
  drone: VectorLike;
  target: VectorLike;
  range: number;
  facingAngle: number;
  fov: number;
  hidden: boolean;
}

export interface PatrolState {
  position: VectorLike;
  pathIndex: number;
  direction: 1 | -1;
}

export interface PatrolDefinition {
  path: VectorLike[];
  speed: number;
}

function wrapAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let wrapped = ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  if (wrapped <= -Math.PI) {
    wrapped += twoPi;
  }
  return wrapped;
}

export function hasVisionOnTarget({
  drone,
  target,
  range,
  facingAngle,
  fov,
  hidden
}: VisionCheck): boolean {
  if (hidden) {
    return false;
  }

  const dx = target.x - drone.x;
  const dy = target.y - drone.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range) {
    return false;
  }

  const angleToTarget = Math.atan2(dy, dx);
  const angleDelta = Math.abs(wrapAngle(angleToTarget - facingAngle));

  return angleDelta <= fov;
}

export function getDroneDetectionStrength(input: VisionCheck): number {
  if (!hasVisionOnTarget(input)) {
    return 0;
  }

  const dx = input.target.x - input.drone.x;
  const dy = input.target.y - input.drone.y;
  const distance = Math.hypot(dx, dy);
  const angleToTarget = Math.atan2(dy, dx);
  const angleDelta = Math.abs(wrapAngle(angleToTarget - input.facingAngle));
  const distanceWeight = Math.max(0, 1 - distance / input.range);
  const centerWeight = Math.max(0, 1 - angleDelta / Math.max(input.fov, 0.0001));

  return Math.max(0, Math.min(1, distanceWeight * 0.38 + centerWeight * 0.62));
}

export function advanceDronePatrolState(
  state: PatrolState,
  definition: PatrolDefinition,
  delta: number
): PatrolState {
  const targetIndex = Math.max(
    0,
    Math.min(definition.path.length - 1, state.pathIndex + state.direction)
  );
  const target = definition.path[targetIndex];
  const dx = target.x - state.position.x;
  const dy = target.y - state.position.y;
  const distance = Math.hypot(dx, dy);

  if (distance < definition.speed * delta) {
    return {
      position: { x: target.x, y: target.y },
      pathIndex: targetIndex,
      direction:
        targetIndex === 0 || targetIndex === definition.path.length - 1
          ? ((state.direction * -1) as 1 | -1)
          : state.direction
    };
  }

  const scale = (definition.speed * delta) / distance;
  return {
    position: {
      x: state.position.x + dx * scale,
      y: state.position.y + dy * scale
    },
    pathIndex: state.pathIndex,
    direction: state.direction
  };
}
