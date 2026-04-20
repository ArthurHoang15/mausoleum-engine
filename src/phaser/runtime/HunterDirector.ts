import Phaser from "phaser";

import type { GameController } from "../../game/simulation/controller";
import type { HunterPhase, ModuleKind } from "../../game/simulation/state";
import type { AudioDirector } from "../../audio/AudioDirector";
import type { Hud } from "../../ui/Hud";
import type { SectorDefinition } from "../../game/content/sectors";
import { PIXEL_ANIMATION_KEYS } from "../assets/pixelManifest";
import type {
  RenderedDrone,
  RenderedProtocol,
  VectorLike,
  Warden
} from "./types";
import type { PlayerDirector } from "./PlayerDirector";
import {
  createPixelAnchor
} from "./pixelPresentation";
import {
  getPresentationFloatOffset,
  getPresentationPulseFrame
} from "./pixelPresentationMath";
import type { WorldRenderer } from "./WorldRenderer";
import {
  advanceDronePatrolState,
  getDroneDetectionStrength
} from "./hunter-logic";
import { resolveWardenBehavior } from "./warden-logic";

export class HunterDirector {
  private warden: Warden | null = null;
  private previousPhase: HunterPhase = "dormant";
  private containmentTimer = 0;
  private phaseElapsed = 0;
  private lastKnownPlayerPosition: VectorLike | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly controller: GameController,
    private readonly hud: Hud,
    private readonly audio: AudioDirector
  ) {}

  syncPhase(phase: HunterPhase): void {
    this.previousPhase = phase;
    this.phaseElapsed = 0;
  }

  onSectorLoaded(): void {
    if (this.warden) {
      this.warden.body.setVisible(false);
      this.warden.halo.setVisible(false);
    }
    this.phaseElapsed = 0;
  }

  isContainmentActive(): boolean {
    return this.containmentTimer > 0;
  }

  updateContainment(delta: number, onResolved: () => void): boolean {
    if (this.containmentTimer <= 0) {
      return false;
    }

    this.containmentTimer -= delta;
    if (this.containmentTimer <= 0) {
      this.controller.resolveContainment();
      onResolved();
    }

    return true;
  }

  updateDrones(
    delta: number,
    drones: RenderedDrone[],
    scanRevealTimer: number,
    debugEnabled: boolean
  ): void {
    for (const drone of drones) {
      this.ensureDronePresentation(drone);
      const next = advanceDronePatrolState(
        {
          position: { x: drone.body.x, y: drone.body.y },
          pathIndex: drone.pathIndex,
          direction: drone.direction
        },
        {
          path: drone.def.path,
          speed: drone.def.speed
        },
        delta
      );

      drone.body.setPosition(next.position.x, next.position.y);
      drone.halo.setPosition(next.position.x, next.position.y);
      drone.pathIndex = next.pathIndex;
      drone.direction = next.direction;

      const currentTarget =
        drone.def.path[
          Phaser.Math.Clamp(
            drone.pathIndex + drone.direction,
            0,
            drone.def.path.length - 1
          )
        ];
      drone.facingAngle = Phaser.Math.Angle.Between(
        drone.body.x,
        drone.body.y,
        currentTarget.x,
        currentTarget.y
      );

      const elapsedMs = this.scene.time.now;
      const hoverOffset = getPresentationFloatOffset(
        elapsedMs,
        2,
        1100,
        drone.pathIndex * 0.6
      );
      const pulseFrame = getPresentationPulseFrame(
        elapsedMs + drone.pathIndex * 45
      );

      drone.body.setRotation(drone.facingAngle + Math.PI / 2);
      drone.halo.setScale(0.9 + pulseFrame * 0.06);
      drone.sprite?.setY(hoverOffset);
      drone.fx
        ?.setFrame(pulseFrame)
        .setY(hoverOffset)
        .setAlpha((scanRevealTimer > 0 || debugEnabled ? 0.18 : 0.08) + pulseFrame * 0.01);

      drone.vision.clear();
      if (scanRevealTimer > 0 || debugEnabled) {
        drone.vision.fillStyle(drone.def.tint, 0.11);
        drone.vision.slice(
          drone.body.x,
          drone.body.y,
          drone.def.range,
          drone.facingAngle - drone.def.fov,
          drone.facingAngle + drone.def.fov,
          false
        );
        drone.vision.lineTo(drone.body.x, drone.body.y);
        drone.vision.closePath();
        drone.vision.fillPath();
      }
    }
  }

  calculateEnvironmentalSignal(
    delta: number,
    drones: RenderedDrone[],
    protocolZones: RenderedProtocol[],
    playerPosition: VectorLike,
    playerHidden: boolean,
    applyProtocolStrain: (module: ModuleKind, strainPerSecond: number, delta: number) => void
  ): number {
    let signal = 0;

    for (const drone of drones) {
      const strength = getDroneDetectionStrength({
        drone: { x: drone.body.x, y: drone.body.y },
        target: playerPosition,
        range: drone.def.range,
        facingAngle: drone.facingAngle,
        fov: drone.def.fov,
        hidden: playerHidden
      });
      signal += strength * 22 * delta;
      drone.halo.setAlpha(0.08 + strength * 0.12);
      drone.sprite?.setTint(
        Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(drone.def.tint),
          Phaser.Display.Color.ValueToColor(0xf4f7ff),
          100,
          22 + strength * 78
        ).color
      );
      drone.fx?.setTint(drone.def.tint).setAlpha(0.06 + strength * 0.18);
    }

    for (const zone of protocolZones) {
      const bounds = zone.object.getBounds();
      if (
        Phaser.Geom.Rectangle.Contains(bounds, playerPosition.x, playerPosition.y)
      ) {
        signal += zone.def.signalPerSecond * delta;
        if (zone.def.module) {
          applyProtocolStrain(zone.def.module, zone.def.strainPerSecond, delta);
        }
      }
    }

    return signal;
  }

  handlePhaseChange(worldRenderer: WorldRenderer): void {
    const phase = this.controller.hunterPhase;
    if (phase === this.previousPhase) {
      return;
    }

    this.audio.onPhaseChange(phase);
    if (phase === "aware") {
      this.hud.showToast("The choir has noticed.");
    } else if (phase === "stalking") {
      this.hud.showToast("The Warden Angel is drawing near.");
    } else if (phase === "pulse-hunt") {
      this.hud.showToast("Pulse hunt engaged.");
      worldRenderer.activatePulse(true);
    } else if (this.previousPhase === "pulse-hunt") {
      worldRenderer.activatePulse(false);
    }

    this.previousPhase = phase;
    this.phaseElapsed = 0;
  }

  updateWarden(
    delta: number,
    currentSector: SectorDefinition,
    playerDirector: PlayerDirector
  ): void {
    const phase = this.controller.hunterPhase;
    this.phaseElapsed += delta;

    if (!playerDirector.isHidden) {
      this.lastKnownPlayerPosition = { ...playerDirector.position };
    }

    const behavior = resolveWardenBehavior({
      phase,
      elapsedInPhase: this.phaseElapsed,
      sectorSize: currentSector.size,
      playerPosition: playerDirector.position,
      playerHidden: playerDirector.isHidden,
      lastKnownPlayerPosition: this.lastKnownPlayerPosition
    });

    if (!behavior.visible) {
      playerDirector.resetConcealment();
      if (this.warden) {
        this.warden.body.setVisible(false);
        this.warden.halo.setVisible(false);
      }
      return;
    }

    if (!this.warden) {
      const spawn = new Phaser.Math.Vector2(
        currentSector.size.width - 140,
        120
      );
      const presentation = createPixelAnchor(this.scene, {
        x: spawn.x,
        y: spawn.y,
        texture: "pixel-warden-proxy",
        animationKey: PIXEL_ANIMATION_KEYS.wardenFloat,
        depth: 25,
        scale: 1.1,
        spriteOffsetY: -4,
        fxTexture: "pixel-scan-fx-proxy",
        fxScale: 1.7,
        fxAlpha: 0.16,
        fxOffsetY: 8
      });
      this.warden = {
        body: presentation.body,
        halo: this.scene.add
          .circle(spawn.x, spawn.y, 56, 0xcab7ff, 0.16)
          .setDepth(24),
        sprite: presentation.sprite,
        fx: presentation.fx
      };
    }

    this.warden.body.setVisible(true);
    this.warden.halo.setVisible(true);
    this.warden.body.setAlpha(behavior.bodyAlpha);
    this.warden.halo.setAlpha(behavior.haloAlpha);

    const toTarget = new Phaser.Math.Vector2(
      behavior.target.x - this.warden.body.x,
      behavior.target.y - this.warden.body.y
    );
    const distanceToTarget = toTarget.length();
    if (distanceToTarget > behavior.desiredDistance) {
      toTarget
        .normalize()
        .scale(
          Math.min(
            distanceToTarget - behavior.desiredDistance,
            behavior.movementSpeed * delta
          )
        );
      this.warden.body.x += toTarget.x;
      this.warden.body.y += toTarget.y;
      this.warden.halo.x = this.warden.body.x;
      this.warden.halo.y = this.warden.body.y;
    }

    const elapsedMs = this.scene.time.now;
    const pulseFrame = getPresentationPulseFrame(elapsedMs, 4, 120);
    const hoverOffset = getPresentationFloatOffset(elapsedMs, 3, 1800, Math.PI / 6);
    const facingX = behavior.target.x - this.warden.body.x;
    this.warden.halo.setScale(1 + pulseFrame * 0.08);
    this.warden.sprite?.setFlipX(facingX < 0).setY(-4 + hoverOffset);
    this.warden.fx
      ?.setFrame(pulseFrame)
      .setY(10 + hoverOffset * 0.4)
      .setAlpha(
        phase === "pulse-hunt" ? 0.28 : phase === "stalking" ? 0.18 : 0.1
      );
    this.warden.sprite?.setTint(
      phase === "pulse-hunt" ? 0xf8f0ff : 0xd9e3ff
    );

    if (phase === "pulse-hunt" && playerDirector.isHidden) {
      playerDirector.addConcealment(delta);
      if (playerDirector.concealmentDuration > 2.5) {
        this.controller.resolvePulseEscape();
      }
    } else {
      playerDirector.resetConcealment();
    }

    if (
      phase === "pulse-hunt" &&
      !playerDirector.isHidden &&
      Phaser.Math.Distance.Between(
        this.warden.body.x,
        this.warden.body.y,
        playerDirector.position.x,
        playerDirector.position.y
      ) < 42
    ) {
      this.controller.triggerContainment();
      this.audio.onContainment();
      this.hud.showToast("Containment field engaged.");
      this.containmentTimer = 1.2;
    }
  }

  private ensureDronePresentation(drone: RenderedDrone): void {
    if (drone.sprite) {
      return;
    }

    const startX = drone.body.x;
    const startY = drone.body.y;
    drone.body.destroy();

    const presentation = createPixelAnchor(this.scene, {
      x: startX,
      y: startY,
      texture: "pixel-drone-proxy",
      animationKey: PIXEL_ANIMATION_KEYS.droneHover,
      depth: 18,
      scale: 1.8,
      fxTexture: "pixel-scan-fx-proxy",
      fxScale: 0.85,
      fxAlpha: 0.08
    });

    drone.body = presentation.body;
    drone.sprite = presentation.sprite.setTint(drone.def.tint);
    drone.fx = presentation.fx?.setTint(drone.def.tint);
  }
}
