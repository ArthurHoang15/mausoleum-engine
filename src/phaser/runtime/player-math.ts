import type { VectorLike } from "./types";

function clampToUnit(vector: VectorLike): VectorLike {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 1 || length === 0) {
    return vector;
  }

  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

export function combineMovementInput(
  keyboard: VectorLike,
  touch: VectorLike
): VectorLike {
  return clampToUnit({
    x: keyboard.x + touch.x,
    y: keyboard.y + touch.y
  });
}
