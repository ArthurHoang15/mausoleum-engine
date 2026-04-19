export interface HiddenMovementInput {
  hidden: boolean;
  inputMagnitude: number;
  distanceFromAnchor: number;
}

export interface HiddenMovementResult {
  reveal: boolean;
  speedMultiplier: number;
}

const MAX_HIDE_RADIUS = 18;
const MAX_HIDE_INPUT = 0.4;

export function evaluateHiddenMovement(
  input: HiddenMovementInput
): HiddenMovementResult {
  if (!input.hidden) {
    return {
      reveal: false,
      speedMultiplier: 1
    };
  }

  if (
    input.inputMagnitude > MAX_HIDE_INPUT ||
    input.distanceFromAnchor > MAX_HIDE_RADIUS
  ) {
    return {
      reveal: true,
      speedMultiplier: 1
    };
  }

  const softness = Math.max(0, 1 - input.inputMagnitude / MAX_HIDE_INPUT);
  const distancePenalty = Math.max(0, 1 - input.distanceFromAnchor / MAX_HIDE_RADIUS);

  return {
    reveal: false,
    speedMultiplier: Math.max(0.12, 0.22 + softness * distancePenalty * 0.18)
  };
}
