# SpriteCook Character Prompts

Use these prompts to generate MAUSOLEUM ENGINE character assets in a SpriteCook-like workflow.

The goal is the same quality direction as a polished character playground preview: clean pixel clusters, readable silhouette, true-size preview, transparent-background sprite output, and animation-friendly proportions. Treat the prompts as style guidance only. Do not copy existing characters, crowns, goblins, poses, tiles, or UI from any reference image.

## Global Style Block

Paste this block at the end of every SpriteCook prompt unless the prompt says otherwise:

```text
MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

## Negative Prompt

Use this as the avoid list when SpriteCook offers a negative prompt field:

```text
photorealistic, 3D render, anime illustration, painterly blur, smooth gradients, noisy dithering, messy antialiasing, chibi exaggeration, generic fantasy goblin, generic knight, cute toy drone, sci-fi spaceship, cyberpunk neon overload, gore, blood, exposed organs, self-harm, copied sprite, existing game character, logo, text, UI, background scene.
```

## Generation Settings

- Use `transparent background` whenever possible.
- Use `single character centered` for each prompt.
- Use `consistent side-facing or three-quarter gameplay read` if SpriteCook asks for orientation.
- Use `side-view playground` only for preview/animation generation.
- Use `top-down or three-quarter top-down` if the asset will be normalized directly into the current game.
- Export with enough padding around wings, halos, capes, and staff tips.
- For animation strips, keep one facing direction per sheet.
- Prefer `6-8 FPS` for walk, hover, alert, hunt, and pulse loops.
- After generation, normalize in the repo to:
  - player: `48x64` for the locked final SpriteCook player
  - drone: `16x16`
  - Warden: `48x64`
  - memory echo: `24x32`

## Batch Order

Generate in this order:

1. `player-final-idle`
2. `player-final-walk`
3. `player-final-dash`
4. `player-final-scan`
5. `player-final-interact`
6. `drone-base-playground`
7. `drone-animation-pack`
8. `warden-base-playground`
9. `warden-animation-pack`
10. `memory-echo-base`
11. `module-state-overlays`

## Player Final Lock

The approved player source is `art/review-packs/player/character_idle.png` plus `character_idle.webp`. Match that exact design language for all future player frames.

Must keep:
- hooded ivory reliquary cowl
- dark face and underframe
- cyan chest gem
- burgundy/crimson cloak and lower cloth
- muted gold trim
- compact vulnerable pilgrim silhouette

Must avoid:
- generic fantasy king or goblin drift
- new crown motif
- costume redesign between animations
- gore or body-horror detail

### player-final-idle

Use this to regenerate the approved idle if needed.

```text
Create an 8-frame idle animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference: hooded ivory reliquary cowl, dark face and underframe, cyan chest gem, burgundy/crimson cloak and lower cloth, muted gold trim, compact vulnerable pilgrim silhouette. Keep the same proportions, same side-facing playground read, same costume, same palette, transparent background, fixed scale, no text, no UI, no scenery, no redesign.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### player-final-walk

Use this next; current runtime uses idle as a temporary walk loop until this exists.

```text
Create an 8-frame walk animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference: hooded ivory reliquary cowl, dark face and underframe, cyan chest gem, burgundy/crimson cloak and lower cloth, muted gold trim, compact vulnerable pilgrim silhouette. Keep the same proportions and costume in every frame. One facing direction, transparent background, fixed scale, no text, no UI, no scenery, no redesign.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### player-final-dash

Use this after walk is approved.

```text
Create an 8-frame dash animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference. Preserve the hooded ivory cowl, dark underframe, cyan chest gem, burgundy cloak, and muted gold trim. Add only a short crimson cloak motion and subtle cyan core streak. One facing direction, transparent background, fixed scale, no new costume details, no scenery.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### player-final-scan

Use this after walk is approved.

```text
Create an 8-frame scan animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference. Preserve the hooded ivory cowl, dark underframe, cyan chest gem, burgundy cloak, and muted gold trim. The cyan chest gem and face optics emit a clean sacred-machine scan pulse. One facing direction, transparent background, fixed scale, no new costume details, no scenery.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### player-final-interact

Use this after walk is approved.

```text
Create an 8-frame interact animation strip for the exact same MAUSOLEUM ENGINE player character shown in the approved reference. Preserve the hooded ivory cowl, dark underframe, cyan chest gem, burgundy cloak, and muted gold trim. The character makes a small terminal reach or relic-touch gesture. One facing direction, transparent background, fixed scale, no new costume details, no scenery.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

## Drone

### Drone Base Playground

```text
Create a pixel art game sprite of a compact reliquary surveillance drone. It should feel like a miniature descendant of a holy machine guardian, not a cute robot. Large thin halo ring, central cyan lens, compact white ceramic shell, gilded faceplate, small deep-blue lower point, tiny wing-like side plates, elegant cold ceremonial threat, readable at small size, centered transparent background, animation-ready.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### Drone Runtime Read

```text
Create a tiny top-down three-quarter pixel art gameplay sprite of the reliquary surveillance drone. Frame target is 16x16 pixels after normalization. Preserve the oversized halo ring, one central cyan lens, white-gold shell, and dark blue lower point. The shape must read instantly as a sacred surveillance probe at very small scale. Transparent background, centered sprite with padding, no scene.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### Drone Animation Pack

```text
Generate a consistent pixel art animation set for the same reliquary surveillance drone. Keep the same halo ring, central cyan lens, white-gold ceramic shell, deep-blue lower point, and small wing-like plates in every frame. Create hover idle, patrol drift, alert flare, and scan pulse states. The alert state should brighten the cyan lens and halo without changing the base shape. One facing direction, transparent background, fixed scale, no labels.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

## Warden

### Warden Base Playground

This is the strongest design lock. Do not let SpriteCook drift too far from these traits.

```text
Create a highly polished pixel art game boss sprite: the Warden Angel, a solemn holy-machine guardian. Massive white-gold armor, thick circular halo ring above the head, dark blue helm face, large cyan-blue chest gem, layered white wings with deep blue shadow feathers, ornate staff with blue sanctum crystal, ancient cathedral-machine authority, elegant and oppressive, not demonic, not bloody, not cute. Centered full-body sprite, transparent background, animation-ready silhouette.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### Warden Runtime Read

```text
Create a top-down three-quarter pixel art gameplay sprite of the Warden Angel. Frame target is 48x64 pixels after normalization. Preserve the thick halo ring, dark blue helm face, central blue chest gem, white-gold shoulder armor, layered wings, and staff silhouette. Simplify details for readability, but do not redesign the character. The sprite must remain the largest authority silhouette in the game. Transparent background, centered with padding.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

### Warden Animation Pack

```text
Generate a consistent pixel art sprite animation set for the same Warden Angel. Keep the exact same thick halo ring, dark blue helm face, central blue gem, white-gold armor, layered wings, and staff silhouette in every frame. Create float idle, manifestation, hunt advance, containment cast, and halo flare overlay frames. Motion should be slow, ceremonial, and oppressive, with the halo and blue gem pulsing. One facing direction, fixed scale, transparent background, no labels.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

## Memory Echo

Memory echoes are lore entities, not combat enemies.

```text
Create a small pixel art character sprite called a memory echo: a faint preserved human silhouette made from pale blue-white signal fragments and soft reliquary light. It should feel like a recorded soul inside a machine-cathedral archive, calm and sad, not a ghost monster. Simple human shape, no face detail, broken scanline edges, tiny gold memory flecks, transparent background, readable at 24x32 after normalization.

MAUSOLEUM ENGINE, original pixel art character sprite for an HTML5 game, sacred-noir machine-cathedral world, SpriteCook-like polish, clean readable silhouette, soft but crisp pixel clusters, selective dark outline, restrained animation-ready detail, transparent background, no scenery, no text, no UI, no watermark, no copied existing game character, no gore, no blood, no body-horror detail.
```

## Module Overlay Prompts

Use these if SpriteCook can generate accessories or overlay frames separately.

### Eyes Module

```text
Create a tiny pixel art overlay effect for the player Eyes module: pale cyan optical scan glint, thin sacred lens glyph, small arc of light near the hood and face, transparent background, no character body, no scenery, clean 4-frame animation feel.
```

### Legs Module

```text
Create a tiny pixel art overlay effect for the player Legs module: muted gold servo spark and short crimson dash trail near the feet, transparent background, no character body, no scenery, clean 4-frame animation feel.
```

### Neural Module

```text
Create a tiny pixel art overlay effect for the player Neural module: cold blue signal glyphs and thin vertical relay lines around the head, sacred-machine data shimmer, transparent background, no character body, no scenery, clean 4-frame animation feel.
```

### Core Module

```text
Create a tiny pixel art overlay effect for the player Core module: cyan chest flare with restrained gold containment ring, emergency overclock pulse, no explosion, no gore, transparent background, no character body, clean 4-frame animation feel.
```

## SpriteCook Review Checklist

Before accepting a generated result:

- Player, drone, and Warden must still feel like one visual family.
- Warden must stay the strongest silhouette.
- Player must remain small and vulnerable, not a full heroic knight.
- Drone must not become cute, toy-like, or spaceship-like.
- True-size preview must still read without zooming in.
- Any large concept render must be normalized later; do not drop it directly into runtime.
- Reject anything with copied fantasy/goblin/crown language unless it has been transformed into MAUSOLEUM ENGINE's machine-cathedral identity.
