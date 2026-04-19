import type { SectorDefinition } from "../game/content/sectors";
import type {
  GameState,
  HunterPhase,
  ModuleKind,
  ModuleStateLabel
} from "../game/simulation/state";

interface QueuedActions {
  scan: boolean;
  dash: boolean;
  interact: boolean;
  overclock: boolean;
}

type StoryState = "onboarding" | "story" | "ending";
type EndingVariant = "break-the-rite" | "become-the-caretaker" | "escape-incomplete" | null;

interface StoryPresentation {
  state: StoryState;
  eyebrow: string;
  endingVariant: EndingVariant;
}

export interface HudRenderPayload {
  state: GameState;
  sector: SectorDefinition;
  objective: string;
  prompt: string;
  debugEnabled: boolean;
  debugText: string;
}

export class Hud {
  private readonly root: HTMLElement;
  private readonly sectorTitle: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly signalPanel: HTMLElement;
  private readonly objective: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly hunterPhase: HTMLElement;
  private readonly signalFill: HTMLElement;
  private readonly storyPanel: HTMLElement;
  private readonly storyEyebrow: HTMLElement;
  private readonly storyTitle: HTMLElement;
  private readonly storyBody: HTMLElement;
  private readonly modules: Record<
    ModuleKind,
    { element: HTMLElement; label: HTMLElement; values: HTMLElement }
  >;
  private readonly toast: HTMLElement;
  private readonly debugPanel: HTMLElement;
  private readonly movement = { up: false, down: false, left: false, right: false };
  private queuedActions: QueuedActions = {
    scan: false,
    dash: false,
    interact: false,
    overclock: false
  };

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.innerHTML = `
      <div class="hud-shell">
        <div class="hud-top">
          <div class="hud-brand">
            <p class="eyebrow">MAUSOLEUM ENGINE</p>
            <h1 id="sector-title"></h1>
            <p id="sector-subtitle" class="sector-subtitle"></p>
          </div>
          <div class="signal-panel" id="signal-panel">
            <div class="signal-head">
              <span class="signal-label">Hunter state</span>
              <span id="hunter-phase" class="signal-state"></span>
            </div>
            <div class="signal-bar"><div id="signal-fill"></div></div>
            <p class="signal-note">Signal rises as you act. Keep moving when the hunt wakes up.</p>
          </div>
        </div>
        <div class="hud-middle">
          <div class="objective-panel">
            <p class="eyebrow">Objective</p>
            <div class="objective-block">
              <p class="panel-label">Current objective</p>
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
          <p id="story-body">Move with WASD or the touch pad. Tap Scan to reveal hidden paths, Dash to cross sightlines, Use to interact, and Core when the hunt tightens.</p>
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

    this.sectorTitle = this.root.querySelector("#sector-title") as HTMLElement;
    this.subtitle = this.root.querySelector("#sector-subtitle") as HTMLElement;
    this.signalPanel = this.root.querySelector("#signal-panel") as HTMLElement;
    this.objective = this.root.querySelector("#objective-text") as HTMLElement;
    this.prompt = this.root.querySelector("#prompt-text") as HTMLElement;
    this.hunterPhase = this.root.querySelector("#hunter-phase") as HTMLElement;
    this.signalFill = this.root.querySelector("#signal-fill") as HTMLElement;
    this.storyPanel = this.root.querySelector("#story-panel") as HTMLElement;
    this.storyEyebrow = this.root.querySelector("#story-eyebrow") as HTMLElement;
    this.storyTitle = this.root.querySelector("#story-title") as HTMLElement;
    this.storyBody = this.root.querySelector("#story-body") as HTMLElement;
    this.toast = this.root.querySelector("#toast") as HTMLElement;
    this.debugPanel = this.root.querySelector("#debug-panel") as HTMLElement;
    this.modules = {
      eyes: this.getModuleCard("eyes"),
      legs: this.getModuleCard("legs"),
      neural: this.getModuleCard("neural"),
      core: this.getModuleCard("core")
    };

    this.bindTouchControls();
  }

  private getModuleCard(module: ModuleKind) {
    const element = this.root.querySelector(
      `.module-card[data-module="${module}"]`
    ) as HTMLElement;

    return {
      element,
      label: element.querySelector("p") as HTMLElement,
      values: element.querySelector("span") as HTMLElement
    };
  }

  private bindMoveButton(
    button: HTMLButtonElement,
    direction: keyof typeof this.movement
  ) {
    const down = (event: Event) => {
      event.preventDefault();
      this.movement[direction] = true;
    };
    const up = (event: Event) => {
      event.preventDefault();
      this.movement[direction] = false;
    };

    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointerleave", up);
    button.addEventListener("pointercancel", up);
  }

  private bindTouchControls(): void {
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-move]")
      .forEach((button) => {
        const direction = button.dataset.move as keyof typeof this.movement;
        this.bindMoveButton(button, direction);
      });

    this.root
      .querySelectorAll<HTMLButtonElement>("[data-action]")
      .forEach((button) => {
        button.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          const action = button.dataset.action as keyof QueuedActions;
          this.queuedActions[action] = true;
        });
      });
  }

  private setModuleCard(
    module: ModuleKind,
    charge: number,
    condition: number,
    stateLabel: ModuleStateLabel
  ): void {
    const card = this.modules[module];
    card.element.dataset.state = stateLabel;
    card.label.textContent = stateLabel.toUpperCase();
    card.values.textContent = `Charge ${Math.round(charge)} / Condition ${Math.round(condition)}`;
  }

  private formatPhase(phase: HunterPhase): string {
    return phase.replace("-", " ").toUpperCase();
  }

  consumeActions(): QueuedActions {
    const snapshot = { ...this.queuedActions };
    this.queuedActions = {
      scan: false,
      dash: false,
      interact: false,
      overclock: false
    };

    return snapshot;
  }

  getMovementVector(): { x: number; y: number } {
    return {
      x: Number(this.movement.right) - Number(this.movement.left),
      y: Number(this.movement.down) - Number(this.movement.up)
    };
  }

  showStory(title: string, body: string): void {
    const presentation = this.resolveStoryPresentation(title, body);

    this.storyPanel.dataset.storyState = presentation.state;
    if (presentation.endingVariant) {
      this.storyPanel.dataset.endingVariant = presentation.endingVariant;
    } else {
      delete this.storyPanel.dataset.endingVariant;
    }

    this.storyEyebrow.textContent = presentation.eyebrow;
    this.storyTitle.textContent = title;
    this.storyBody.textContent = body;
  }

  showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.dataset.visible = "true";

    window.clearTimeout((this.toast as HTMLElement & { __timeout?: number }).__timeout);
    (this.toast as HTMLElement & { __timeout?: number }).__timeout = window.setTimeout(() => {
      this.toast.dataset.visible = "false";
    }, 2400);
  }

  render(payload: HudRenderPayload): void {
    const { state, sector, objective, prompt, debugEnabled, debugText } = payload;

    this.sectorTitle.textContent = sector.name;
    this.subtitle.textContent = sector.subtitle;
    this.signalPanel.dataset.phase = state.hunterPhase;
    this.objective.textContent = objective;
    this.prompt.textContent = prompt;
    this.hunterPhase.textContent = this.formatPhase(state.hunterPhase);
    this.signalFill.style.width = `${Math.min(100, state.signalLevel)}%`;
    this.debugPanel.textContent = debugText;
    this.debugPanel.dataset.visible = debugEnabled ? "true" : "false";

    this.setModuleCard(
      "eyes",
      state.modules.eyes.charge,
      state.modules.eyes.condition,
      this.getStateLabel(state.modules.eyes.condition)
    );
    this.setModuleCard(
      "legs",
      state.modules.legs.charge,
      state.modules.legs.condition,
      this.getStateLabel(state.modules.legs.condition)
    );
    this.setModuleCard(
      "neural",
      state.modules.neural.charge,
      state.modules.neural.condition,
      this.getStateLabel(state.modules.neural.condition)
    );
    this.setModuleCard(
      "core",
      state.modules.core.charge,
      state.modules.core.condition,
      this.getStateLabel(state.modules.core.condition)
    );
  }

  private getStateLabel(condition: number): ModuleStateLabel {
    if (condition >= 67) {
      return "stable";
    }

    if (condition >= 34) {
      return "degraded";
    }

    return "critical";
  }

  private resolveStoryPresentation(title: string, body: string): StoryPresentation {
    const titleText = title.toLowerCase();
    const normalized = `${title} ${body}`.toLowerCase();

    if (
      titleText.includes("break the rite") ||
      normalized.includes("shatter the mausoleum engine")
    ) {
      return {
        state: "ending",
        eyebrow: "Final rite",
        endingVariant: "break-the-rite"
      };
    }

    if (
      titleText.includes("become the caretaker") ||
      normalized.includes("guardian of a dead rite")
    ) {
      return {
        state: "ending",
        eyebrow: "Final rite",
        endingVariant: "become-the-caretaker"
      };
    }

    if (
      titleText.includes("escape incomplete") ||
      normalized.includes("escape alive")
    ) {
      return {
        state: "ending",
        eyebrow: "Final rite",
        endingVariant: "escape-incomplete"
      };
    }

    return {
      state: "story",
      eyebrow: "Echo",
      endingVariant: null
    };
  }
}
