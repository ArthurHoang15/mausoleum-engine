# Pixel Assets Manual Test

Use this checklist after changing runtime pixel assets.

## Start The Game

```powershell
bun run dev
```

Open the local Vite URL, usually `http://localhost:5173/`.

If the browser has stale assets, hard refresh once.

## Basic Asset Smoke Test

1. Wait for the game to load into `The Hollow Spine`.
2. Confirm the HUD no longer covers the center or lower-middle playfield on desktop.
3. Confirm touch controls are hidden on desktop-width, non-touch viewports.
4. Confirm the onboarding echo panel dismisses automatically after a few seconds, or with its `Dismiss` button.
5. Confirm the player uses the large hooded ivory/crimson final sprite.
6. Press `W`, `A`, `S`, and `D` separately.
7. Confirm the player switches to walk-up, walk-left, walk-down, and walk-right animations.
8. Hold diagonal movement and confirm the dominant direction picks the walk animation.
9. Press `Shift` while moving and confirm the dash animation plays.
10. Press `Q` with enough Eyes charge and confirm the scan animation plus scan FX/readability state.
11. Press `Space` near the hub pod, bench, door, or hiding spot and confirm the interact animation plays.

## World Asset Smoke Test

1. Walk to the upper door in the hub and press `Space` to enter `Lens Basilica`.
2. Confirm drones render as pixel sprites and their scan FX/vision cones are readable.
3. Stand in or near drone sightlines long enough to raise signal.
4. Confirm hunter phase toasts appear as signal rises.
5. Keep raising signal until the Warden appears.
6. Confirm the Warden uses the pixel sprite and switches into hunt animation during `Pulse Hunt`.
7. Hide in an alcove during a pulse hunt and confirm the Warden remains readable while the player alpha/tint changes.

## HUD And Debug

1. Press the backtick key `` ` `` to toggle debug.
2. Confirm debug text shows sector, signal, phase, objectives, memory, and hidden state.
3. Use touch controls in browser device emulation or a narrow viewport.
4. Confirm movement and action buttons still trigger the same animations.

## Pass Criteria

- No missing-texture boxes.
- Player strip uses `player-runtime-strip-v6.png`.
- Four-direction movement is visibly distinct.
- Scan and interact animations do not get stuck.
- Drone, Warden, scan FX, containment, and halo assets render without frame drift.
- `bun run test` and `bun run build` pass after the visual check.
