# MAUSOLEUM ENGINE Pixel Asset Spec

## Scope
This spec defines the first production asset set for the pixel pass.

## Style Benchmark
- Target feel: `70% similar` to a strong SpriteCook-like top-down pixel scene.
- Match: readable silhouettes, soft-but-crisp cluster work, tidy layouts, selective outlines, polished sprite proportions.
- Diverge: colder sacred-noir palette, machine-cathedral props, ritual lighting, ceremonial threat silhouettes.
- Originality rule: no direct copying of props, palettes, room layouts, furniture, hairstyles, or tile rhythms from reference material.

## World Scale
- Primary environment language: 24-32 px per structural module.
- Player: 48x64 px frame size for the final SpriteCook-locked runtime.
- Drones: 16x16 px frame size.
- Warden: 48x64 px frame size.
- FX: 16x16 px, 24x24 px, or 32x32 px depending on the effect.
- UI icons: 8x8 px, 12x12 px, 16x16 px, or 24x24 px depending on use.

## Asset Inventory

### 1. Environment Kit
Needed pieces:
- Floor tile set
- Wall / pillar tile set
- Door and gate frames
- Corner and edge variations
- Ritual floor markings
- Catwalk or grate variants
- Terminal / altar / console props
- Hazard markers and broken-state variants

Requirements:
- Must tile cleanly.
- Must hold up at both medium and close gameplay zooms.
- Must preserve clear pathing and collision reads.
- Must survive a `style test room` benchmark before mass production.

### 2. Player
Needed pieces:
- Idle
- Walk
- Dash or burst
- Scan
- Interact
- Damage / strain cue
- Death / collapse if needed for final pass

Requirements:
- Small, modular silhouette.
- Readable facing direction from top-down camera.
- Body modules should be distinct by color or highlight language.
- Should feel closer to a polished SpriteCook-like protagonist in readability, while still reading as a fragile machine pilgrim.

### 3. Drones
Needed pieces:
- Hover idle
- Patrol loop
- Alert loop
- Scan pulse
- Disabled / shut down

Requirements:
- High readability at 16x16.
- Vision cone and alert state should be easy to visualize in motion.
- Shape should feel like a sacred surveillance probe, not a generic sci-fi drone.
- Should be elegant and deliberate, never cute or toy-like.

### 4. Warden
Needed pieces:
- Float idle
- Hunt advance
- Alert / manifestation
- Containment burst
- Halo or aura overlay

Requirements:
- Largest silhouette authority in the game.
- Must feel holy, ancient, and oppressive.
- Halo language should separate the Warden from all other entities.
- Must remain legible even when simplified toward the cleaner benchmark style.

### 5. FX
Needed pieces:
- Scan pulse
- Signal flare
- Door activation
- Objective pickup
- Alert burst
- Containment / failure burst

Requirements:
- FX should be punchy, not noisy.
- Prefer 2-6 frame loops.
- Keep the effect language distinct for scan, damage, and hunter escalation.

### 6. UI
Needed pieces:
- Frame borders
- Panel corners
- Icon set for modules, signal, objectives, and warnings
- Small status markers
- Button states for default, hover, active, and disabled

Requirements:
- UI must remain readable over moving backgrounds.
- UI art should be modular and reusable across HUD surfaces.

## File Naming
Use stable lowercase hyphenated names.

Examples:
- `env-floor-tile.png`
- `env-wall-tile.png`
- `env-door-frame.png`
- `player-idle.png`
- `player-walk.png`
- `drone-hover.png`
- `warden-float.png`
- `fx-scan-pulse.png`
- `ui-frame.png`

Rules:
- One asset family per prefix.
- Use version suffixes only when necessary, such as `-v2`.
- Do not mix spaces, camelCase, or descriptive paragraphs in file names.

## Frame And Sheet Rules
- Keep frame size fixed within a sheet.
- One animation family per sheet unless a sheet is intentionally a single static atlas.
- Preserve transparent padding only when needed for motion clarity.
- Align to a consistent baseline or anchor point for each family.
- Export each sheet with predictable row order and documented frame count.

## Palette Guidance By Sector

### Hollow Spine
- Tone: neutral bone, cold iron, muted ash.
- Accent: weak amber and restrained cyan.
- Use this as the baseline palette for hub readability.

### Lens Basilica
- Tone: pale glass, surgical white, tarnished teal.
- Accent: light gold, optic blue, restrained violet shadows.
- Prioritize reflective and refractive cues.

### Ossuary Shafts
- Tone: dusty bone, deep umber, oxidized metal.
- Accent: red-brown warning notes and dead brass.
- Keep values compressed for vertical depth and burial weight.

### Choir Archives
- Tone: parchment gray, smoked plum, old ink black.
- Accent: washed crimson and spectral indigo.
- Favor stacked forms, archives, shelves, and ritual glyph contrast.

### Reliquary Furnace
- Tone: soot black, furnace orange, hot steel.
- Accent: toxic ember, molten gold, high-contrast warning red.
- Use the most aggressive value range here, but keep silhouettes clean.

## Handoff Criteria
An asset drop is ready when:
- file names match the convention,
- frame sizes match the spec,
- silhouettes read at gameplay zoom,
- sector palette intent is visible,
- no source material was copied,
- and the art fits the sacred-noir contract in `pixel-art-bible.md`.

## Style Test Room Gate
Before broad environment production, build and review one benchmark room containing:
- one player sprite
- one drone
- one Warden seed
- one dark sacred room with 3-5 props

The room passes when:
- it feels visually close to the readability/polish benchmark,
- it still feels unmistakably like MAUSOLEUM ENGINE,
- sprites remain more readable than props or floor detail,
- and nothing reads as a copied office/domestic scene.

### Final Trio Lock
- Selected concept lock: `Reliquary Exile`.
- Player production pass must preserve the hood, cyan chest gem, and pale outer vestment while simplifying small relic trims.
- Drone production pass must preserve the oversized halo and single cyan lens so it reads as Warden lineage at 16x16.
- Warden production pass must stay benchmark-faithful: halo, helm, blue gem, white-gold armor, wing hierarchy, and staff may be simplified, but never redesigned.
- Runtime strip versions currently wired in-game: `player-runtime-strip-v6.png`, `drone-runtime-strip-v3.png`, `warden-runtime-strip-v2.png`, `warden-containment-strip-v2.png`, `warden-halo-overlay-strip-v2.png`.

### Player Final Lock 01
- Approved source assets: `art/review-packs/player/character_idle.png` and `character_idle.webp`.
- Runtime target: `48x64`, `bottom-center`, `pixel-player-proxy`.
- Must preserve hooded ivory reliquary cowl, dark face/underframe, cyan chest gem, burgundy cloak/lower cloth, muted gold trim, and compact vulnerable pilgrim silhouette.
- Current runtime pack: `art/review-packs/player-final-animations-02/`.
- Current player strip: `public/assets/pixel/sprites/player/player-runtime-strip-v6.png`.
- Current player families: `idle`, `walk-down`, `walk-up`, `walk-left`, `walk-right`, `dash`, `scan`, and `interact`.
- These are repo-normalized directional fallbacks from the locked SpriteCook idle source. Replace them with SpriteCook animation outputs when credits are available.

