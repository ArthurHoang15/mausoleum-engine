# MAUSOLEUM ENGINE

A browser-first 2D stealth survival prototype built for the `Machines` jam theme and the GitHub Open Source challenge.

You wake inside an alien machine-cathedral that preserves fallen civilizations as ritualized mechanical memory. Every ability uses and degrades your own body modules while the facility's `Warden Angel` hunts high-signal intrusions through reconfiguring sacred corridors.

## Why This Repo Exists

This project is built to be playable, readable, and easy to judge:

- browser-native and fully end-to-end
- open-source friendly with a clear architecture story
- lightweight enough for jam constraints and future asset upgrades
- documented so judges can understand the loop without reading every file

The current implementation focuses on:

- one central `signal management` stealth loop
- four degradable body modules: `Eyes`, `Legs`, `Neural`, `Core`
- one apex hunter with escalating phases
- one hub plus four authored sectors
- touch-ready HUD controls layered over a Phaser scene
- zero gore or self-harm presentation

## Bun-First Workflow

This repo is intentionally set up around `Bun`.

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

## Architecture

The repo is intentionally split so simulation, runtime orchestration, and presentation stay readable.

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
  - lightweight procedural audio cues and phase-reactive states

The scene stays thin by delegating logic into the simulation and runtime directors. That keeps the rules testable, the rendering code focused, and the audio hooks reusable.

## How the Warden Works

The `Warden Angel` reacts to signal, not just distance.

- `Dormant`
  - the hunter is quiet while signal stays low
- `Aware`
  - scans, noisy movement, and environmental pressure begin to matter
- `Stalking`
  - sustained signal keeps the hunter active and more persistent
- `Pulse Hunt`
  - the Warden directly enters the map and pushes toward the player
- `Containment`
  - triggered when the Warden reaches the player during the pulse hunt

The audio director and HUD both react to those state changes so the player gets a clearer sense of escalation even before the Warden appears on screen.

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

The hunter is fed by environmental signal: drone vision, protocol zones, noisy movement, scans, and overclock flares.

### Debug overlay

Press `` ` `` to show:

- current sector
- signal level
- hunter phase
- collected objectives
- collected memory fragments
- current hidden state

## Screenshots / GIFs

Replace these placeholders with the final challenge captures:

- `![Title screen](docs/media/title-screen.png)`
- `![Warden stalking sequence](docs/media/warden-stalking.gif)`
- `![Containment ending](docs/media/containment-ending.gif)`

## Asset strategy

This prototype intentionally uses:

- procedural shapes
- generated color scripts
- DOM UI
- lightweight synthesized audio cues

That keeps the HTML5 build lean and lets the team layer final art/audio on top without rewriting the systems.

## License

Code in this repository is licensed under the `MIT License`.

If the team adds external or custom art/audio later, keep those licenses documented separately from the code license and list any required attribution alongside the asset source.
