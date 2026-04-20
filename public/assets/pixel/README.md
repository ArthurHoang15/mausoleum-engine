# Pixel Asset Handoff

This folder is the runtime drop point for final pixel art assets.

## Expectations
- Keep exported files in predictable lowercase hyphenated names.
- Match the frame sizes and family names defined in `art/manifest/pixel-asset-spec.md`.
- Preserve transparent backgrounds where the runtime expects layered sprites.
- Use pixel-art-safe exports with no filtering, no smoothing, and no unexpected scaling.

## Suggested Layout
- `sprites/` for character and enemy sheets
- `tiles/` for environment tiles and props
- `ui/` for HUD frames and icons
- `fx/` for scan, pulse, and alert effects

## Drop-in Rule
If an asset cannot be named, sized, and categorized against the spec above, it is not ready for runtime use yet.
