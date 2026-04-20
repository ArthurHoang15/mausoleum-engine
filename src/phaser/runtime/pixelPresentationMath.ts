export function getPresentationPulseFrame(
  elapsedMs: number,
  frameCount = 4,
  frameDurationMs = 90
): number {
  if (frameCount <= 0 || frameDurationMs <= 0) {
    return 0;
  }

  return Math.floor(Math.max(0, elapsedMs) / frameDurationMs) % frameCount;
}

export function getPresentationFloatOffset(
  elapsedMs: number,
  amplitude: number,
  periodMs: number,
  phase = 0
): number {
  if (periodMs <= 0 || amplitude === 0) {
    return 0;
  }

  return (
    Math.sin((Math.max(0, elapsedMs) / periodMs) * Math.PI * 2 + phase) *
    amplitude
  );
}
