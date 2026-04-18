# MAUSOLEUM ENGINE

A browser-first 2D stealth survival prototype built for the `Machines` jam theme.

You wake inside an alien machine-cathedral that preserves fallen civilizations as ritualized mechanical memory. Every ability uses and degrades your own body modules while the facility's `Warden Angel` hunts high-signal intrusions through reconfiguring sacred corridors.

## Why this project exists

This repo is designed to support three goals at once:

- a browser-native jam game that is playable end-to-end
- a readable open-source codebase suitable for the GitHub challenge
- a strong audiovisual hook for YouTube Playables and Wavedash

The current implementation focuses on:

- one central `signal management` stealth loop
- four degradable body modules: `Eyes`, `Legs`, `Neural`, `Core`
- one apex hunter with escalating phases
- one hub plus four authored sectors
- touch-ready HUD controls layered over a Phaser scene
- zero gore or self-harm presentation

## Controls

### Desktop

- `WASD`: move
- `Q`: Eyes scan
- `Shift`: dash
- `E`: Core overclock
- `Space`: interact / hide / use doors
- `` ` ``: toggle debug overlay
- `R`: restart after an ending

### Touch

- D-pad on the left
- `Scan`, `Dash`, `Use`, `Core` buttons on the right

## Run

This project uses `Bun`.

```bash
bun install
bun run dev
```

Run tests:

```bash
bun run test
```

Build production assets:

```bash
bun run build
```

## Architecture

The repo is intentionally split so the simulation rules stay readable.

- `src/game/simulation/state.ts`
  - pure game-state rules
  - module degradation / recovery
  - hunter phase progression
  - objective and ending unlocks
- `src/game/simulation/controller.ts`
  - runtime orchestration
  - local save persistence
  - interaction handling between scene and simulation
- `src/game/content/sectors.ts`
  - authored sector data
  - doors, drones, protocol zones, objectives, memory fragments
- `src/phaser/scenes/GameScene.ts`
  - rendering, movement, detection, pulse hunts, sector transitions
- `src/ui/Hud.ts`
  - DOM HUD and touch controls
- `src/audio/AudioDirector.ts`
  - lightweight procedural audio cues

## Gameplay systems

### Modules

- `Eyes`
  - scan hidden relics, patrol lines, and reveal spectral geometry
- `Legs`
  - dash and reposition through pressure-heavy spaces
- `Neural`
  - power narrative/objective interactions tied to decoding and theft
- `Core`
  - overclock to survive high-pressure moments

Every active ability trades `Charge`, `Condition`, and `Signal`.

### Hunter phases

- `Dormant`
- `Aware`
- `Stalking`
- `Pulse Hunt`
- `Containment`

The hunter is fed by environmental signal: drone vision, protocol zones, noisy movement, scans, and overclock flares.

### Debug overlay

Press `` ` `` to show:

- current sector
- signal level
- hunter phase
- collected objectives
- collected memory fragments
- current hidden state

## Asset strategy

This prototype intentionally uses:

- procedural shapes
- generated color scripts
- DOM UI
- lightweight synthesized audio cues

That keeps the HTML5 build lean and lets the team layer final art/audio on top without rewriting the systems.

## License

Code in this repository is licensed under the `MIT License`.

If your team adds external or custom art/audio later, keep those licenses documented separately from the code license.
