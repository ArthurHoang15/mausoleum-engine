# MAUSOLEUM ENGINE Pixel Art Bible

## Purpose
This document is the style lock for the full pixel pass. It defines what belongs in MAUSOLEUM ENGINE and what does not.

## Core Direction
- Sacred noir sci-fi horror.
- Top-down readability first.
- 24-32 px world scale for environment language and props.
- Pixel art only, with crisp silhouette design and disciplined clusters.
- Style-only inspiration from pixel-agents: study the readability, pacing, and retro discipline, but do not copy characters, compositions, palettes, or assets.
- Style benchmark may lean `70% similar` to strong SpriteCook-like outputs: clean top-down readability, approachable proportions, selective outlines, tidy rooms, and polished pixel clusters.
- The final look must still diverge into a darker machine-cathedral identity with colder neutrals, restrained crimson-gold accents, and ritual architectural language.
- All assets must be original or fully licensed for this project.

## Non-Negotiables
- No copied sprites, tiles, UI treatments, or enemy silhouettes from existing games.
- No photorealism, painterly blending, or soft gradient-heavy rendering.
- No busy micro-detail that breaks gameplay readability at game camera distance.
- No neon cyberpunk bias. Light is ritual, surgical, and haunted.
- No gore-forward imagery. The horror is architectural, mechanical, and devotional.

## Visual Language
- Shapes should read as carved, ceremonial, and machine-built.
- Keep shapes friendlier and cleaner than the earlier procedural placeholder pass.
- Use strong value contrast and simple geometry over surface noise.
- Build most forms from 1-3 dominant masses with a few accent cuts.
- Favor spires, ribs, halos, reliquary cages, lensing rings, and fractured glyph logic.
- Effects should feel like signal, static, sanctified heat, or containment failure.

## Benchmark Translation
- Match the benchmark in readability, sprite softness, room cleanliness, and prop discipline.
- Do not match the benchmark in literal props, palettes, hairstyles, furniture, or room composition.
- Replace cozy or domestic cues with reliquaries, altars, lens shrines, ossuary shelving, furnace rails, and cathedral-machine thresholds.
- Warden and drones must read as ceremonial threats, never cute or domestic.

## Camera And Scale
- Top-down or near top-down framing is the default assumption for gameplay assets.
- The player and drones must be identifiable at a glance in motion.
- Doors, terminals, hazards, and pickups should be legible before detail.
- When in doubt, simplify a shape until it survives a fast camera read.

## Rendering Rules
- Keep outlines selective, not universal.
- Use internal contrast to describe volume before decoration.
- Avoid over-shading; 2-4 value steps per object is usually enough.
- Reserve high saturation for interactive signals, hazards, and critical UI cues.
- Preserve clean transparency edges and avoid noisy fringe pixels.

## Animation Rules
- Prefer short, readable loops over complex motion.
- Motion should communicate state: idle, patrol, alert, hunt, rupture, pulse.
- Use anticipation and settle frames sparingly to avoid muddy silhouettes.
- Do not animate detail that the camera cannot support.

## Asset Approval Standard
- Every sprite or tile set should answer three questions:
  - What is it?
  - Can the player read it instantly?
  - Does it belong to the sacred-noir machine-cathedral world?
- If any answer is unclear, the asset is too ornate or off-style.
- A fourth check now applies:
  - Would this still feel original if placed next to the SpriteCook-like benchmark image?

## Composition Tone
- Environments should feel consecrated, not generic industrial.
- Architecture should imply worship, storage, burial, and surveillance at once.
- The Warden should feel like a holy threat, not a standard boss robot.
- The player should feel fragile, modular, and slightly overexposed.

## Deliverable Quality Bar
- Clear silhouettes at gameplay scale.
- Consistent pixel grid discipline.
- Cohesive palette families across all sectors.
- No derivative references hidden in props, poses, masks, or FX motifs.
- Export-ready assets that can drop into the current pixel-safe runtime without rework.

## Final Trio Lock
- Active trio lock: `triad-b` / `Reliquary Exile`.
- Player should read as a sanctified fallen pilgrim with a hooded reliquary cowl, cyan chest gem, and pale vestment over a dark underframe.
- Drone should inherit the Warden's lineage directly through a dominant halo ring, central cyan lens, and compact white-gold shell.
- Warden is the immovable visual anchor: thick halo, dark blue helm face, large chest gem, white-gold armor, layered wings, and staff silhouette are mandatory.

## Player Final Lock 01
- The approved player source is the SpriteCook idle asset in `art/review-packs/player/character_idle.png` and `character_idle.webp`.
- The final player runtime uses `48x64` frames to preserve the SpriteCook silhouette and detail.
- Future player animations must keep the same hooded ivory cowl, dark face/underframe, cyan chest gem, burgundy cloak, muted gold trim, and compact vulnerable pilgrim body.
- Do not introduce a crown, goblin/king identity, or any new costume language when generating walk, dash, scan, or interact frames.

