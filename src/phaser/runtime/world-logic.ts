import type { Rect } from "../../game/content/sectors";

interface WallSnapshot extends Rect {
  id: string;
}

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

function hashString(value: string): number {
  return [...value].reduce(
    (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
    7
  );
}

export function getPulseTweenProfile(
  baseRect: WallSnapshot,
  targetRect: Rect
): { duration: number; delay: number } {
  const distance =
    Math.abs(baseRect.x - targetRect.x) +
    Math.abs(baseRect.y - targetRect.y) +
    Math.abs(baseRect.width - targetRect.width) +
    Math.abs(baseRect.height - targetRect.height);
  const delay = hashString(baseRect.id) % 110;

  return {
    duration: Math.max(360, Math.min(820, 380 + distance * 1.4)),
    delay
  };
}
