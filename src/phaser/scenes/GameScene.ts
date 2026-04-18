import Phaser from "phaser";

import type { GameServices } from "../../app/services";
import {
  sectorsById,
  type DoorDefinition,
  type HidingSpotDefinition,
  type InteractionDefinition,
  type ProtocolZoneDefinition,
  type SectorDefinition,
  type WallDefinition
} from "../../game/content/sectors";
import type { HunterPhase, ModuleKind } from "../../game/simulation/state";

type RenderedWall = {
  def: WallDefinition;
  object: Phaser.GameObjects.Rectangle;
};

type RenderedDoor = {
  def: DoorDefinition;
  object: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type RenderedInteraction = {
  def: InteractionDefinition;
  object: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type RenderedHideSpot = {
  def: HidingSpotDefinition;
  object: Phaser.GameObjects.Rectangle;
};

type RenderedProtocol = {
  def: ProtocolZoneDefinition;
  object: Phaser.GameObjects.Rectangle;
};

type RenderedDrone = {
  def: SectorDefinition["drones"][number];
  body: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
  vision: Phaser.GameObjects.Graphics;
  pathIndex: number;
  direction: 1 | -1;
  facingAngle: number;
};

type Warden = {
  body: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
};

export class GameScene extends Phaser.Scene {
  private currentSector!: SectorDefinition;
  private background!: Phaser.GameObjects.Rectangle;
  private starfield!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Arc;
  private playerHalo!: Phaser.GameObjects.Arc;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private walls: RenderedWall[] = [];
  private doors: RenderedDoor[] = [];
  private interactions: RenderedInteraction[] = [];
  private hidingSpots: RenderedHideSpot[] = [];
  private protocolZones: RenderedProtocol[] = [];
  private drones: RenderedDrone[] = [];
  private pulseActive = false;
  private warden: Warden | null = null;
  private scanRevealTimer = 0;
  private overclockTimer = 0;
  private dashTimer = 0;
  private dashVector = new Phaser.Math.Vector2();
  private concealmentTimer = 0;
  private containmentTimer = 0;
  private debugEnabled = false;
  private previousPhase: HunterPhase = "dormant";
  private playerHidden = false;
  private playerSpeed = 140;

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

    this.background = this.add.rectangle(0, 0, 10, 10, 0x000000).setOrigin(0);
    this.starfield = this.add.graphics();
    this.playerHalo = this.add
      .circle(0, 0, 24, 0xa9d6ff, 0.18)
      .setDepth(20);
    this.player = this.add.circle(0, 0, 16, 0xf4f7ff, 1).setDepth(21);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);

    this.input.on("pointerdown", () => {
      this.services.audio.unlock();
    });

    this.loadSector(this.services.controller.state.currentSectorId);
    this.previousPhase = this.services.controller.hunterPhase;
    this.services.hud.showStory(
      "Wake sequence complete.",
      "Move with WASD or the touch pad. Scan with Q, dash with Shift, overclock with E, interact with Space."
    );
  }

  update(_time: number, deltaMs: number): void {
    const delta = Math.min(deltaMs / 1000, 0.05);

    if (Phaser.Input.Keyboard.JustDown(this.keys.restart) &&
      this.services.controller.state.ending) {
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

    if (this.containmentTimer > 0) {
      this.containmentTimer -= delta;
      if (this.containmentTimer <= 0) {
        this.services.controller.resolveContainment();
        this.loadSector(this.services.controller.state.currentSectorId);
      }
      this.renderHud();
      return;
    }

    this.updateTimers(delta);
    const environmentalSignal = this.updateHazards(delta);
    this.updatePlayer(delta);
    this.updateDrones(delta);
    this.refreshInteractionVisibility();
    this.services.controller.tick(delta, environmentalSignal);
    this.handleHunterPhaseChange();
    this.updateWarden(delta);
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

    if (wantsDash && this.dashTimer <= 0) {
      this.services.audio.unlock();
      const move = this.getMovementVector();
      const result = this.services.controller.useDash();
      if (result.ok && move.lengthSq() > 0.01) {
        this.dashVector = move.normalize().scale(420);
        this.dashTimer = 0.18;
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
      this.tryInteract();
    }
  }

  private updateTimers(delta: number): void {
    this.scanRevealTimer = Math.max(0, this.scanRevealTimer - delta);
    this.overclockTimer = Math.max(0, this.overclockTimer - delta);
    this.dashTimer = Math.max(0, this.dashTimer - delta);
  }

  private getMovementVector(): Phaser.Math.Vector2 {
    const keyboard = new Phaser.Math.Vector2(
      Number(this.keys.right.isDown) - Number(this.keys.left.isDown),
      Number(this.keys.down.isDown) - Number(this.keys.up.isDown)
    );
    const touch = this.services.hud.getMovementVector();
    const vector = new Phaser.Math.Vector2(
      keyboard.x + touch.x,
      keyboard.y + touch.y
    );

    if (vector.lengthSq() > 1) {
      vector.normalize();
    }

    return vector;
  }

  private updatePlayer(delta: number): void {
    const move = this.getMovementVector();
    if (move.lengthSq() > 0 && this.playerHidden) {
      this.playerHidden = false;
      this.concealmentTimer = 0;
    }

    const speed =
      this.playerSpeed *
      (this.overclockTimer > 0 ? 1.35 : 1) *
      (this.playerHidden ? 0.5 : 1);

    const dash = this.dashTimer > 0 ? this.dashVector.clone() : new Phaser.Math.Vector2();
    const velocity = move.scale(speed).add(dash);

    const nextX = this.player.x + velocity.x * delta;
    const nextY = this.player.y + velocity.y * delta;
    const resolvedX = this.resolveAxis(nextX, this.player.y, true);
    const resolvedY = this.resolveAxis(resolvedX, nextY, false);

    this.player.setPosition(resolvedX, resolvedY);
    this.playerHalo.setPosition(resolvedX, resolvedY);
    this.player.setAlpha(this.playerHidden ? 0.3 : 1);
    this.playerHalo.setAlpha(this.playerHidden ? 0.12 : 0.18);
  }

  private resolveAxis(nextX: number, nextY: number, horizontal: boolean): number {
    const radius = 16;
    const min = horizontal ? radius : radius;
    const max = horizontal
      ? this.currentSector.size.width - radius
      : this.currentSector.size.height - radius;
    const candidate = Phaser.Math.Clamp(horizontal ? nextX : nextY, min, max);

    for (const wall of this.walls) {
      const bounds = wall.object.getBounds();
      const x = horizontal ? candidate : nextX;
      const y = horizontal ? nextY : candidate;
      if (
        x + radius > bounds.left &&
        x - radius < bounds.right &&
        y + radius > bounds.top &&
        y - radius < bounds.bottom
      ) {
        return horizontal
          ? this.player.x
          : this.player.y;
      }
    }

    return candidate;
  }

  private updateDrones(delta: number): void {
    for (const drone of this.drones) {
      const targetIndex = Phaser.Math.Clamp(
        drone.pathIndex + drone.direction,
        0,
        drone.def.path.length - 1
      );
      const target = drone.def.path[targetIndex];
      const vector = new Phaser.Math.Vector2(
        target.x - drone.body.x,
        target.y - drone.body.y
      );

      if (vector.length() < drone.def.speed * delta) {
        drone.body.setPosition(target.x, target.y);
        drone.halo.setPosition(target.x, target.y);
        drone.pathIndex = targetIndex;
        if (
          targetIndex === 0 ||
          targetIndex === drone.def.path.length - 1
        ) {
          drone.direction *= -1;
        }
      } else {
        vector.normalize().scale(drone.def.speed * delta);
        drone.body.x += vector.x;
        drone.body.y += vector.y;
        drone.halo.x = drone.body.x;
        drone.halo.y = drone.body.y;
      }

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
      if (this.scanRevealTimer > 0 || this.debugEnabled) {
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

  private updateHazards(delta: number): number {
    let signal = 0;
    const playerPoint = new Phaser.Math.Vector2(this.player.x, this.player.y);

    for (const drone of this.drones) {
      const distance = Phaser.Math.Distance.Between(
        drone.body.x,
        drone.body.y,
        playerPoint.x,
        playerPoint.y
      );

      const angleToPlayer = Phaser.Math.Angle.Between(
        drone.body.x,
        drone.body.y,
        playerPoint.x,
        playerPoint.y
      );
      const angleDelta = Math.abs(
        Phaser.Math.Angle.Wrap(angleToPlayer - drone.facingAngle)
      );

      if (
        !this.playerHidden &&
        distance < drone.def.range &&
        angleDelta < drone.def.fov
      ) {
        signal += 18 * delta;
      }
    }

    for (const zone of this.protocolZones) {
      const bounds = zone.object.getBounds();
      if (Phaser.Geom.Rectangle.Contains(bounds, playerPoint.x, playerPoint.y)) {
        signal += zone.def.signalPerSecond * delta;
        if (zone.def.module) {
          this.applyProtocolStrain(zone.def.module, zone.def.strainPerSecond, delta);
        }
      }
    }

    return signal;
  }

  private applyProtocolStrain(
    module: ModuleKind,
    strainPerSecond: number,
    delta: number
  ): void {
    this.services.controller.applyPassiveStrain(module, strainPerSecond * delta);
  }

  private handleHunterPhaseChange(): void {
    const phase = this.services.controller.hunterPhase;
    if (phase === this.previousPhase) {
      return;
    }

    this.services.audio.onPhaseChange(phase);
    if (phase === "aware") {
      this.services.hud.showToast("The choir has noticed.");
    } else if (phase === "stalking") {
      this.services.hud.showToast("The Warden Angel is drawing near.");
    } else if (phase === "pulse-hunt") {
      this.services.hud.showToast("Pulse hunt engaged.");
      this.activatePulse(true);
    } else if (this.previousPhase === "pulse-hunt") {
      this.activatePulse(false);
    }

    this.previousPhase = phase;
  }

  private activatePulse(active: boolean): void {
    this.pulseActive = active;
    this.starfield.setAlpha(active ? 1 : 0.25);
    for (const wall of this.walls) {
      const target = active && wall.def.pulseRect ? wall.def.pulseRect : wall.def.rect;
      this.tweens.add({
        targets: wall.object,
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
        width: target.width,
        height: target.height,
        duration: 550,
        ease: "Sine.easeInOut"
      });
    }
  }

  private updateWarden(delta: number): void {
    const phase = this.services.controller.hunterPhase;

    if (phase !== "pulse-hunt") {
      this.concealmentTimer = 0;
      if (this.warden) {
        this.warden.body.setVisible(false);
        this.warden.halo.setVisible(false);
      }
      return;
    }

    if (!this.warden) {
      const spawn = new Phaser.Math.Vector2(
        this.currentSector.size.width - 140,
        120
      );
      this.warden = {
        body: this.add.circle(spawn.x, spawn.y, 22, 0xf8f0ff, 0.95).setDepth(25),
        halo: this.add.circle(spawn.x, spawn.y, 56, 0xcab7ff, 0.16).setDepth(24)
      };
    }

    this.warden.body.setVisible(true);
    this.warden.halo.setVisible(true);

    const speed = this.playerHidden ? 80 : 165;
    const toPlayer = new Phaser.Math.Vector2(
      this.player.x - this.warden.body.x,
      this.player.y - this.warden.body.y
    );
    if (toPlayer.lengthSq() > 4) {
      toPlayer.normalize().scale(speed * delta);
      this.warden.body.x += toPlayer.x;
      this.warden.body.y += toPlayer.y;
      this.warden.halo.x = this.warden.body.x;
      this.warden.halo.y = this.warden.body.y;
    }

    if (this.playerHidden) {
      this.concealmentTimer += delta;
      if (this.concealmentTimer > 2.5) {
        this.services.controller.resolvePulseEscape();
      }
    } else {
      this.concealmentTimer = 0;
    }

    if (
      !this.playerHidden &&
      Phaser.Math.Distance.Between(
        this.warden.body.x,
        this.warden.body.y,
        this.player.x,
        this.player.y
      ) < 42
    ) {
      this.services.controller.triggerContainment();
      this.services.audio.onContainment();
      this.services.hud.showToast("Containment field engaged.");
      this.containmentTimer = 1.2;
    }
  }

  private tryInteract(): void {
    const nearbyDoor = this.findNearestDoor();
    if (nearbyDoor) {
      const result = this.services.controller.useDoor(nearbyDoor.def);
      if (result.toast) {
        this.services.hud.showToast(result.toast);
      }
      if (result.transitionTo) {
        if (this.services.controller.hunterPhase === "pulse-hunt") {
          this.services.controller.resolvePulseEscape();
        }
        this.loadSector(result.transitionTo);
      }
      return;
    }

    const hideSpot = this.findNearestHideSpot();
    if (hideSpot) {
      this.playerHidden = !this.playerHidden;
      this.concealmentTimer = 0;
      this.services.hud.showToast(
        this.playerHidden ? "Hidden in shadow." : "Left the shadow."
      );
      return;
    }

    const interaction = this.findNearestInteraction();
    if (!interaction) {
      this.services.hud.showToast("Nothing nearby responds.");
      return;
    }

    const result = this.services.controller.interact(interaction.def);
    if (result.toast) {
      this.services.hud.showToast(result.toast);
    }
    if (result.storyTitle && result.storyBody) {
      this.services.hud.showStory(result.storyTitle, result.storyBody);
      if (interaction.def.kind === "memory") {
        this.services.audio.onMemory();
      }
      if (interaction.def.kind === "objective") {
        this.services.audio.onObjective();
      }
    }
    if (result.ending) {
      this.services.audio.onEnding();
      this.services.hud.showStory(
        interaction.def.label,
        this.getEndingText(result.ending)
      );
    }
    this.loadSector(this.services.controller.state.currentSectorId, false);
  }

  private getEndingText(ending: string): string {
    if (ending === "break-the-rite") {
      return "You shatter the Mausoleum Engine and release humanity's trapped echoes into the dark between stars.";
    }

    if (ending === "become-the-caretaker") {
      return "You ascend into the Engine's choir and take the Warden's place, guardian of a dead rite.";
    }

    return "You escape alive, but the unfinished machine-organism inside you continues to hum with sacred intent.";
  }

  private findNearestDoor(): RenderedDoor | null {
    return this.findNearest(this.doors, 88);
  }

  private findNearestInteraction(): RenderedInteraction | null {
    return this.findNearest(
      this.interactions.filter((item) =>
        item.def.hiddenUntilScan ? this.scanRevealTimer > 0 : true
      ),
      84
    );
  }

  private findNearestHideSpot(): RenderedHideSpot | null {
    return this.findNearest(this.hidingSpots, 88);
  }

  private findNearest<T extends { object: Phaser.GameObjects.Rectangle }>(
    items: T[],
    radius: number
  ): T | null {
    let closest: T | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const item of items) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.object.x,
        item.object.y
      );

      if (distance < radius && distance < closestDistance) {
        closest = item;
        closestDistance = distance;
      }
    }

    return closest;
  }

  private loadSector(sectorId: SectorDefinition["id"], resetPosition = true): void {
    this.currentSector = sectorsById[sectorId];
    this.playerHidden = false;
    this.concealmentTimer = 0;

    this.background.setFillStyle(this.currentSector.floorColor, 1);
    this.background.setSize(
      this.currentSector.size.width,
      this.currentSector.size.height
    );

    this.drawStarfield();
    this.clearSectorObjects();
    this.buildWalls();
    this.buildDoors();
    this.buildHidingSpots();
    this.buildInteractions();
    this.buildProtocolZones();
    this.buildDrones();

    this.cameras.main.setBounds(
      0,
      0,
      this.currentSector.size.width,
      this.currentSector.size.height
    );

    if (resetPosition) {
      this.player.setPosition(this.currentSector.start.x, this.currentSector.start.y);
      this.playerHalo.setPosition(
        this.currentSector.start.x,
        this.currentSector.start.y
      );
    }

    this.services.hud.showToast(this.currentSector.name);
    if (this.currentSector.id !== "hub") {
      this.services.hud.showStory(this.currentSector.name, this.currentSector.introLine);
    }
  }

  private clearSectorObjects(): void {
    for (const wall of this.walls) {
      wall.object.destroy();
    }
    for (const door of this.doors) {
      door.object.destroy();
      door.label.destroy();
    }
    for (const interaction of this.interactions) {
      interaction.object.destroy();
      interaction.label.destroy();
    }
    for (const hideSpot of this.hidingSpots) {
      hideSpot.object.destroy();
    }
    for (const zone of this.protocolZones) {
      zone.object.destroy();
    }
    for (const drone of this.drones) {
      drone.body.destroy();
      drone.halo.destroy();
      drone.vision.destroy();
    }
    this.walls = [];
    this.doors = [];
    this.interactions = [];
    this.hidingSpots = [];
    this.protocolZones = [];
    this.drones = [];
  }

  private drawStarfield(): void {
    this.starfield.clear();
    this.starfield.setAlpha(this.pulseActive ? 1 : 0.25);
    this.starfield.fillStyle(this.currentSector.pulseBackdropColor, 1);
    this.starfield.fillRect(
      0,
      0,
      this.currentSector.size.width,
      this.currentSector.size.height
    );

    const random = new Phaser.Math.RandomDataGenerator([this.currentSector.id]);
    for (let index = 0; index < 120; index += 1) {
      this.starfield.fillStyle(
        random.pick([0xffffff, this.currentSector.accentColor, 0xbdd7ff]),
        random.realInRange(0.2, 0.95)
      );
      this.starfield.fillCircle(
        random.between(0, this.currentSector.size.width),
        random.between(0, this.currentSector.size.height),
        random.realInRange(0.7, 2.1)
      );
    }
  }

  private buildWalls(): void {
    this.walls = this.currentSector.walls.map((def) => ({
      def,
      object: this.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          this.currentSector.wallColor,
          0.92
        )
        .setStrokeStyle(2, this.currentSector.accentColor, 0.35)
    }));
  }

  private buildDoors(): void {
    this.doors = this.currentSector.doors.map((def) => {
      const unlocked =
        (!def.requiresObjective ||
          this.services.controller.state.objectivesCollected.includes(
            def.requiresObjective
          )) &&
        (!def.requiresAllObjectives || this.services.controller.hasAllObjectives());
      const object = this.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          unlocked ? this.currentSector.accentColor : 0x52586d,
          0.55
        )
        .setStrokeStyle(2, 0xf7fbff, 0.4);
      const label = this.add
        .text(object.x, object.y, def.label, {
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13px",
          color: "#f5f7ff",
          align: "center",
          wordWrap: { width: 140 }
        })
        .setOrigin(0.5)
        .setDepth(5);
      return { def, object, label };
    });
  }

  private buildHidingSpots(): void {
    this.hidingSpots = this.currentSector.hidingSpots.map((def) => ({
      def,
      object: this.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          0x0a0f18,
          0.35
        )
        .setStrokeStyle(1, 0xd7e8ff, 0.12)
    }));
  }

  private buildInteractions(): void {
    this.interactions = this.currentSector.interactions
      .filter((def) => {
        if (def.kind === "pod" || def.kind === "bench") {
          return true;
        }

        if (def.kind === "ending") {
          return this.services.controller.state.availableEndings.length > 0;
        }

        return !this.services.controller.isInteractionCollected(def.id);
      })
      .map((def) => {
        const color = this.getInteractionColor(def.kind);
        const object = this.add
          .rectangle(
            def.rect.x + def.rect.width / 2,
            def.rect.y + def.rect.height / 2,
            def.rect.width,
            def.rect.height,
            color,
            def.hiddenUntilScan ? 0.18 : 0.66
          )
          .setStrokeStyle(2, 0xffffff, def.hiddenUntilScan ? 0.1 : 0.35)
          .setVisible(!def.hiddenUntilScan || this.scanRevealTimer > 0);
        const label = this.add
          .text(object.x, object.y, def.label, {
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "12px",
            color: "#f7fbff",
            align: "center",
            wordWrap: { width: 120 }
          })
          .setOrigin(0.5)
          .setVisible(!def.hiddenUntilScan || this.scanRevealTimer > 0);
        return { def, object, label };
      });
  }

  private refreshInteractionVisibility(): void {
    for (const interaction of this.interactions) {
      const visible = !interaction.def.hiddenUntilScan || this.scanRevealTimer > 0;
      interaction.object.setVisible(visible);
      interaction.label.setVisible(visible);
    }
  }

  private buildProtocolZones(): void {
    this.protocolZones = this.currentSector.protocolZones.map((def) => ({
      def,
      object: this.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          def.tint,
          0.12
        )
        .setStrokeStyle(1, def.tint, 0.3)
    }));
  }

  private buildDrones(): void {
    this.drones = this.currentSector.drones.map((def) => {
      const start = def.path[0];
      return {
        def,
        body: this.add.circle(start.x, start.y, 14, def.tint, 0.88),
        halo: this.add.circle(start.x, start.y, 30, def.tint, 0.08),
        vision: this.add.graphics(),
        pathIndex: 0,
        direction: 1,
        facingAngle: 0
      };
    });
  }

  private getInteractionColor(kind: InteractionDefinition["kind"]): number {
    switch (kind) {
      case "mineral":
        return 0x68c9ff;
      case "energy":
        return 0xffd06f;
      case "memory":
        return 0xd4c6ff;
      case "objective":
        return 0xa5ffce;
      case "pod":
        return 0x9bf1ff;
      case "bench":
        return 0xffae7f;
      case "ending":
        return 0xfff0b5;
    }
  }

  private renderHud(): void {
    const state = this.services.controller.state;
    const prompt = this.getPromptText();
    this.services.hud.render({
      state,
      sector: this.currentSector,
      objective: this.getObjectiveText(),
      prompt,
      debugEnabled: this.debugEnabled,
      debugText: JSON.stringify(
        {
          sector: this.currentSector.id,
          signal: Number(state.signalLevel.toFixed(1)),
          phase: state.hunterPhase,
          objectives: state.objectivesCollected,
          memory: state.memoryFragments,
          hidden: this.playerHidden
        },
        null,
        2
      )
    });
  }

  private getPromptText(): string {
    const interaction = this.findNearestInteraction();
    if (interaction) {
      return interaction.def.prompt;
    }
    const door = this.findNearestDoor();
    if (door) {
      return door.def.prompt;
    }
    const hideSpot = this.findNearestHideSpot();
    if (hideSpot) {
      return this.playerHidden ? "Leave shadow" : `Hide in ${hideSpot.def.label}`;
    }

    return "Move, scan, and follow the rite.";
  }

  private getObjectiveText(): string {
    if (this.currentSector.id === "hub") {
      const next = this.currentSector.doors.find((door) => {
        if (
          this.services.controller.state.objectivesCollected.includes(
            door.targetSectorId
          )
        ) {
          return false;
        }

        if (!door.requiresObjective) {
          return true;
        }
        return this.services.controller.state.objectivesCollected.includes(
          door.requiresObjective
        );
      });
      return next?.label
        ? `Return to the nave and continue through ${next.label}.`
        : this.currentSector.objectiveLabel;
    }

    if (
      this.currentSector.id === "reliquary-furnace" &&
      this.services.controller.state.availableEndings.length > 0
    ) {
      return "The living key is yours. Choose a final rite at the altar below.";
    }

    if (
      this.services.controller.state.objectivesCollected.includes(
        this.currentSector.id
      )
    ) {
      return "Objective secured. Return to the Hollow Spine or keep exploring for relics.";
    }

    return this.currentSector.objectiveHint;
  }
}
