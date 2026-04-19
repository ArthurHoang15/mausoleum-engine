import Phaser from "phaser";

import type { GameServices } from "../../app/services";
import type { ModuleKind, SectorId } from "../../game/simulation/state";
import { HunterDirector } from "../runtime/HunterDirector";
import { InteractionDirector } from "../runtime/InteractionDirector";
import { PlayerDirector } from "../runtime/PlayerDirector";
import { combineMovementInput } from "../runtime/player-math";
import { WorldRenderer } from "../runtime/WorldRenderer";

export class GameScene extends Phaser.Scene {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private worldRenderer!: WorldRenderer;
  private playerDirector!: PlayerDirector;
  private hunterDirector!: HunterDirector;
  private interactionDirector!: InteractionDirector;
  private scanRevealTimer = 0;
  private overclockTimer = 0;
  private debugEnabled = false;

  constructor(private readonly services: GameServices) {
    super("GameScene");
  }

  create(): void {
    this.keys = {
      up: this.input.keyboard!.addKey("W"),
      down: this.input.keyboard!.addKey("S"),
      left: this.input.keyboard!.addKey("A"),
      right: this.input.keyboard!.addKey("D"),
      scan: this.input.keyboard!.addKey("Q"),
      dash: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      interact: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      overclock: this.input.keyboard!.addKey("E"),
      debug: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK),
      restart: this.input.keyboard!.addKey("R")
    };

    this.worldRenderer = new WorldRenderer(this, this.services.controller);
    this.playerDirector = new PlayerDirector(this);
    this.hunterDirector = new HunterDirector(
      this,
      this.services.controller,
      this.services.hud,
      this.services.audio
    );
    this.interactionDirector = new InteractionDirector(
      this.services.controller,
      this.services.hud,
      this.services.audio
    );

    this.cameras.main.startFollow(this.playerDirector.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);

    this.input.on("pointerdown", () => {
      this.services.audio.unlock();
    });

    this.loadSector(this.services.controller.state.currentSectorId);
    this.services.hud.showStory(
      "Wake sequence complete.",
      "Move with WASD or the touch pad. Scan with Q, dash with Shift, overclock with E, interact with Space."
    );
  }

  update(_time: number, deltaMs: number): void {
    const delta = Math.min(deltaMs / 1000, 0.05);

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.restart) &&
      this.services.controller.state.ending
    ) {
      this.services.controller.resetRun();
      this.loadSector("hub");
      this.services.hud.showStory(
        "Wake sequence complete.",
        "The rite rewinds. The Hollow Spine waits for another run."
      );
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.debug)) {
      this.debugEnabled = !this.debugEnabled;
    }

    const actions = this.services.hud.consumeActions();
    this.handleActionInput(actions);

    if (
      this.hunterDirector.updateContainment(delta, () => {
        this.loadSector(this.services.controller.state.currentSectorId);
      })
    ) {
      this.renderHud();
      return;
    }

    this.updateTimers(delta);

    const movementVector = this.getMovementVector();
    const environmentalSignal = this.hunterDirector.calculateEnvironmentalSignal(
      delta,
      this.worldRenderer.drones,
      this.worldRenderer.protocolZones,
      this.playerDirector.position,
      this.playerDirector.isHidden,
      this.applyProtocolStrain.bind(this)
    );

    this.playerDirector.update(
      delta,
      movementVector,
      this.worldRenderer.walls,
      this.worldRenderer.currentSector.size,
      this.overclockTimer > 0
    );
    this.hunterDirector.updateDrones(
      delta,
      this.worldRenderer.drones,
      this.scanRevealTimer,
      this.debugEnabled
    );
    this.worldRenderer.refreshInteractionVisibility(this.scanRevealTimer);
    this.services.controller.tick(delta, environmentalSignal);
    this.hunterDirector.handlePhaseChange(this.worldRenderer);
    this.hunterDirector.updateWarden(
      delta,
      this.worldRenderer.currentSector,
      this.playerDirector
    );
    this.hunterDirector.handlePhaseChange(this.worldRenderer);
    this.renderHud();
  }

  private handleActionInput(actions: {
    scan: boolean;
    dash: boolean;
    interact: boolean;
    overclock: boolean;
  }): void {
    const wantsScan =
      Phaser.Input.Keyboard.JustDown(this.keys.scan) || actions.scan;
    const wantsDash =
      Phaser.Input.Keyboard.JustDown(this.keys.dash) || actions.dash;
    const wantsInteract =
      Phaser.Input.Keyboard.JustDown(this.keys.interact) || actions.interact;
    const wantsOverclock =
      Phaser.Input.Keyboard.JustDown(this.keys.overclock) || actions.overclock;

    if (wantsScan) {
      this.services.audio.unlock();
      const result = this.services.controller.useScan();
      if (result.ok) {
        this.scanRevealTimer = 4;
        this.services.audio.onScan();
      }
      if (result.toast) {
        this.services.hud.showToast(result.toast);
      }
    }

    if (wantsDash) {
      this.services.audio.unlock();
      const movementVector = this.getMovementVector();
      const result = this.services.controller.useDash();
      if (result.ok && this.playerDirector.primeDash(movementVector)) {
        this.services.audio.onDash();
      }
      if (result.toast) {
        this.services.hud.showToast(result.toast);
      }
    }

    if (wantsOverclock) {
      this.services.audio.unlock();
      const result = this.services.controller.useOverclock();
      if (result.ok) {
        this.overclockTimer = 4;
        this.services.audio.onOverclock();
      }
      if (result.toast) {
        this.services.hud.showToast(result.toast);
      }
    }

    if (wantsInteract) {
      this.services.audio.unlock();
      this.interactionDirector.tryInteract({
        interactions: this.worldRenderer.interactions,
        doors: this.worldRenderer.doors,
        hidingSpots: this.worldRenderer.hidingSpots,
        playerPosition: this.playerDirector.position,
        playerHidden: this.playerDirector.isHidden,
        scanRevealTimer: this.scanRevealTimer,
        onToggleHidden: () => this.playerDirector.toggleHidden(),
        onSectorTransition: (sectorId) => this.loadSector(sectorId),
        onRefreshCurrentSector: () =>
          this.loadSector(this.services.controller.state.currentSectorId, false),
        onPulseEscape: () => this.services.controller.resolvePulseEscape()
      });
    }
  }

  private updateTimers(delta: number): void {
    this.scanRevealTimer = Math.max(0, this.scanRevealTimer - delta);
    this.overclockTimer = Math.max(0, this.overclockTimer - delta);
  }

  private getMovementVector(): { x: number; y: number } {
    const keyboard = {
      x: Number(this.keys.right.isDown) - Number(this.keys.left.isDown),
      y: Number(this.keys.down.isDown) - Number(this.keys.up.isDown)
    };

    return combineMovementInput(keyboard, this.services.hud.getMovementVector());
  }

  private applyProtocolStrain(
    module: ModuleKind,
    strainPerSecond: number,
    delta: number
  ): void {
    this.services.controller.applyPassiveStrain(
      module,
      strainPerSecond * delta
    );
  }

  private loadSector(sectorId: SectorId, resetPosition = true): void {
    const sector = this.worldRenderer.loadSector(sectorId, {
      resetPosition,
      onPlayerStart: (point) => this.playerDirector.setPosition(point)
    });

    this.playerDirector.resetStealth();
    this.worldRenderer.activatePulse(
      this.services.controller.hunterPhase === "pulse-hunt"
    );
    this.hunterDirector.onSectorLoaded();
    this.hunterDirector.syncPhase(this.services.controller.hunterPhase);

    this.services.hud.showToast(sector.name);
    if (sector.id !== "hub") {
      this.services.hud.showStory(sector.name, sector.introLine);
    }
  }

  private renderHud(): void {
    const state = this.services.controller.state;
    this.services.hud.render({
      state,
      sector: this.worldRenderer.currentSector,
      objective: this.interactionDirector.getObjectiveText(
        this.worldRenderer.currentSector
      ),
      prompt: this.interactionDirector.getPromptText({
        interactions: this.worldRenderer.interactions,
        doors: this.worldRenderer.doors,
        hidingSpots: this.worldRenderer.hidingSpots,
        playerPosition: this.playerDirector.position,
        playerHidden: this.playerDirector.isHidden,
        scanRevealTimer: this.scanRevealTimer
      }),
      debugEnabled: this.debugEnabled,
      debugText: JSON.stringify(
        {
          sector: this.worldRenderer.currentSector.id,
          signal: Number(state.signalLevel.toFixed(1)),
          phase: state.hunterPhase,
          objectives: state.objectivesCollected,
          memory: state.memoryFragments,
          hidden: this.playerDirector.isHidden
        },
        null,
        2
      )
    });
  }
}
