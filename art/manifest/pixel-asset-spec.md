# MAUSOLEUM ENGINE Pixel Asset Spec

## Scope
This spec defines the first production asset set for the pixel pass.

## World Scale
- Primary environment language: 24-32 px per structural module.
- Player: 24x32 px frame size.
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
