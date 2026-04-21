# SpriteCook Jobs 01

This pack is the SpriteCook production queue for the next character asset pass.

The current Codex session has the SpriteCook plugin files and workflow skills available, but the live MCP tools (`generate_game_art`, `animate_game_art`, `get_credit_balance`, `check_job_status`) are not exposed in the callable tool list. This pack keeps the work SpriteCook-ready without pretending generation has already happened.

## Goal

Generate the missing production sprites while preserving the locked player design from:

- `art/review-packs/player/character_idle.png`
- `art/review-packs/player/character_idle.webp`
- `art/review-packs/player-final-lock-01/player-final-lock-metadata.json`

The highest priority is replacing the temporary player walk loop with a real SpriteCook walk strip. Drone and Warden jobs follow the same style lock and runtime contract.

## SpriteCook Setup

Use SpriteCook MCP when available:

1. Check credits with `get_credit_balance`.
2. Import the locked player source image and save the returned `asset_id` in `spritecook-assets.json`.
3. Run player animation jobs against that exact player `asset_id`.
4. Generate or import canonical drone and Warden assets, then animate those canonical `asset_id` values.
5. Save SpriteCook `asset_id`, `job_id`, and downloaded file paths back into this pack.

Never paste SpriteCook API keys into chat, source files, prompts, or shell commands.

## Job Order

Run these in order:

1. `player-final-walk`
2. `player-final-dash`
3. `player-final-scan`
4. `player-final-interact`
5. `drone-base-runtime`
6. `drone-hover`
7. `drone-patrol`
8. `drone-alert`
9. `warden-base-runtime`
10. `warden-float`
11. `warden-manifest`
12. `warden-hunt`
13. `warden-containment`
14. `warden-halo-overlay`

## Download Layout

Place downloaded SpriteCook outputs here before normalization:

- `downloads/player/final-walk/`
- `downloads/player/final-dash/`
- `downloads/player/final-scan/`
- `downloads/player/final-interact/`
- `downloads/drone/base-runtime/`
- `downloads/drone/hover/`
- `downloads/drone/patrol/`
- `downloads/drone/alert/`
- `downloads/warden/base-runtime/`
- `downloads/warden/float/`
- `downloads/warden/manifest/`
- `downloads/warden/hunt/`
- `downloads/warden/containment/`
- `downloads/warden/halo-overlay/`

## Runtime Targets

Do not update runtime paths until the outputs pass review.

- Player current fallback target: `public/assets/pixel/sprites/player/player-runtime-strip-v6.png`
- Player next SpriteCook replacement target: `public/assets/pixel/sprites/player/player-runtime-strip-v7.png`
- Drone next target: `public/assets/pixel/sprites/drone/drone-runtime-strip-v4.png`
- Warden next target: `public/assets/pixel/sprites/warden/warden-runtime-strip-v3.png`
- Warden containment target: `public/assets/pixel/sprites/warden/warden-containment-strip-v3.png`
- Warden halo target: `public/assets/pixel/fx/warden-halo-overlay-strip-v3.png`

## Acceptance Checks

- Player remains recognizably the locked ivory cowl, cyan gem, crimson cloak design.
- Player walk is a real movement loop, not idle reuse.
- Drone reads clearly at `16x16` and feels Warden-blooded, not cute or spaceship-like.
- Warden keeps halo, helm, central blue gem, white-gold armor, wings, and staff.
- All downloaded outputs have transparent backgrounds or clean removable mattes.
- No gore, blood, self-harm, copied game characters, UI labels, or background scenery.
