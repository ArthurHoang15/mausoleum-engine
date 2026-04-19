import type { Rect } from "../../game/content/sectors";

export function getVisibleWallRect(
  rect: Rect,
  pulseRect: Rect | undefined,
  pulseActive: boolean
): Rect {
  return pulseActive && pulseRect ? pulseRect : rect;
}

export function isInteractionVisible(
  hiddenUntilScan: boolean | undefined,
  scanRevealTimer: number
): boolean {
  return !hiddenUntilScan || scanRevealTimer > 0;
}
