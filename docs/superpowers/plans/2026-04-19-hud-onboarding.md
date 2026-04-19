# HUD Onboarding and Touch UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the HUD easier to parse in the first 90 seconds, improve touch affordances on mobile, and present the three endings with clearer emotional hierarchy.

**Architecture:** Keep the simulation and scene runtime untouched. Update the owned HUD component to add clearer section labels, stronger onboarding copy, and story-state-aware presentation, then use CSS to reflow the panels for narrow and landscape frames. The changes stay confined to `src/ui/Hud.ts` and `src/style.css`.

**Tech Stack:** TypeScript, DOM rendering, CSS Grid/Flexbox, existing Phaser integration.

---

### Task 1: Restructure the HUD markup and state hooks

**Files:**
- Modify: `src/ui/Hud.ts`

- [ ] **Step 1: Update the HUD template**

Replace the current markup with a slightly richer hierarchy:

```ts
this.root.innerHTML = `
  <div class="hud-shell">
    <div class="hud-top">
      <div class="hud-brand">
        <p class="eyebrow">MAUSOLEUM ENGINE</p>
        <h1 id="sector-title"></h1>
        <p id="sector-subtitle" class="sector-subtitle"></p>
      </div>
      <div class="signal-panel">
        <div class="signal-head">
          <span class="signal-label">Hunter state</span>
          <span id="hunter-phase" class="signal-state"></span>
        </div>
        <div class="signal-bar"><div id="signal-fill"></div></div>
        <p class="signal-note">Signal rises as you act. Stay moving when the hunt wakes up.</p>
      </div>
    </div>
    <div class="hud-middle">
      <div class="objective-panel">
        <p class="eyebrow">Current Rite</p>
        <div class="objective-block">
          <p class="panel-label">Objective</p>
          <p id="objective-text" class="objective-text"></p>
        </div>
        <div class="prompt-block">
          <p class="panel-label">Immediate prompt</p>
          <p id="prompt-text" class="prompt-text"></p>
        </div>
      </div>
      <div class="module-grid">
        <div class="module-card" data-module="eyes"><h3>Eyes</h3><p></p><span></span></div>
        <div class="module-card" data-module="legs"><h3>Legs</h3><p></p><span></span></div>
        <div class="module-card" data-module="neural"><h3>Neural</h3><p></p><span></span></div>
        <div class="module-card" data-module="core"><h3>Core</h3><p></p><span></span></div>
      </div>
    </div>
    <div class="story-panel" id="story-panel" data-story-state="onboarding">
      <p class="eyebrow" id="story-eyebrow">First steps</p>
      <h2 id="story-title">Wake sequence complete.</h2>
      <p id="story-body"></p>
      <div class="story-chips" aria-label="Control summary">
        <span>Move: WASD or touch pad</span>
        <span>Scan: Q or tap Scan</span>
        <span>Dash: Shift or tap Dash</span>
        <span>Use: Space or tap Use</span>
        <span>Core: E or tap Core</span>
      </div>
    </div>
    <div class="toast" id="toast"></div>
    <pre class="debug-panel" id="debug-panel"></pre>
    <div class="touch-controls">
      <div class="touch-pad">
        <p class="touch-label">Move</p>
        <button data-move="up" aria-label="Move up">▲</button>
        <div class="touch-row">
          <button data-move="left" aria-label="Move left">◀</button>
          <button data-move="down" aria-label="Move down">▼</button>
          <button data-move="right" aria-label="Move right">▶</button>
        </div>
      </div>
      <div class="touch-actions">
        <button data-action="scan"><span>Scan</span><small>Reveal</small></button>
        <button data-action="dash"><span>Dash</span><small>Cross</small></button>
        <button data-action="interact"><span>Use</span><small>Act</small></button>
        <button data-action="overclock"><span>Core</span><small>Flare</small></button>
      </div>
    </div>
  </div>
`;
```

- [ ] **Step 2: Add refs and helper methods**

Add `storyPanel` and `storyEyebrow` refs, plus a small helper that maps story text to one of four presentation states:

```ts
private readonly storyPanel: HTMLElement;
private readonly storyEyebrow: HTMLElement;

private classifyStory(title: string, body: string): "onboarding" | "memory" | "objective" | "ending" {
  const normalized = `${title} ${body}`.toLowerCase();

  if (
    normalized.includes("shatter the mausoleum engine") ||
    normalized.includes("guardian of a dead rite") ||
    normalized.includes("escape alive")
  ) {
    return "ending";
  }

  if (normalized.includes("remembered") || normalized.includes("echo")) {
    return "memory";
  }

  if (normalized.includes("secured") || normalized.includes("objective")) {
    return "objective";
  }

  return "onboarding";
}
```

- [ ] **Step 3: Update `showStory` and `render`**

Set the story panel dataset and eyebrow text from the classifier, keep the default onboarding copy readable on first load, and avoid touching any controller logic.

### Task 2: Refresh the CSS hierarchy and responsive layout

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Refine the panel hierarchy**

Update spacing, label styles, and cards so the objective block reads before the prompt block and the hunter state becomes a distinct top-right status surface.

- [ ] **Step 2: Strengthen touch affordances**

Increase hit targets for the touch buttons, add clear label treatment for the directional pad and action buttons, and use a two-line action layout so tapping feels deliberate instead of cramped.

- [ ] **Step 3: Add story-state and viewport-specific styling**

Add variants for `data-story-state="onboarding"`, `memory`, `objective`, and `ending`, then tighten the layout for narrow/portrait frames and compact landscape windows with mobile-first media queries.

### Task 3: Verify, commit, and push

**Files:**
- None

- [ ] **Step 1: Run unit and build checks**

Run:

```bash
bun run test
bun run build
```

- [ ] **Step 2: Commit the changes**

```bash
git add src/ui/Hud.ts src/style.css docs/superpowers/plans/2026-04-19-hud-onboarding.md
git commit -m "feat: improve onboarding hud and touch UX"
```

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feat/hud-onboarding
```
