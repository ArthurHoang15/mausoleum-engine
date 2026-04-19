import Phaser from "phaser";

import type { GameController } from "../../game/simulation/controller";
import type { HunterPhase, ModuleKind } from "../../game/simulation/state";
import type { AudioDirector } from "../../audio/AudioDirector";
import type { Hud } from "../../ui/Hud";
import type { SectorDefinition } from "../../game/content/sectors";
import type {
  RenderedDrone,
  RenderedProtocol,
  VectorLike,
  Warden
} from "./types";
import type { PlayerDirector } from "./PlayerDirector";
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
      const spawn = new Phaser.Math.Vector2(currentSector.size.width - 140, 120);
      this.warden = {
        body: this.scene.add.circle(spawn.x, spawn.y, 22, 0xf8f0ff, 0.95).setDepth(25),
        halo: this.scene.add.circle(spawn.x, spawn.y, 56, 0xcab7ff, 0.16).setDepth(24)
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
}
