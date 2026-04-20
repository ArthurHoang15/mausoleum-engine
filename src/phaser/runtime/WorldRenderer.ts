import Phaser from "phaser";

import { sectorsById, type InteractionDefinition, type SectorDefinition } from "../../game/content/sectors";
import { getSectorVisualTheme } from "../../game/content/visualThemes";
import type { GameController } from "../../game/simulation/controller";
import type {
  RenderedDoor,
  RenderedDrone,
  RenderedHideSpot,
  RenderedInteraction,
  RenderedProtocol,
  RenderedWall
} from "./types";
import {
  getPulseTweenProfile,
  getVisibleWallRect,
  isInteractionVisible
} from "./world-logic";

export class WorldRenderer {
  private readonly background: Phaser.GameObjects.TileSprite;
  private readonly starfield: Phaser.GameObjects.Graphics;
  private _currentSector!: SectorDefinition;
  private pulseActive = false;
  private _walls: RenderedWall[] = [];
  private _doors: RenderedDoor[] = [];
  private _interactions: RenderedInteraction[] = [];
  private _hidingSpots: RenderedHideSpot[] = [];
  private _protocolZones: RenderedProtocol[] = [];
  private _drones: RenderedDrone[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly controller: GameController
  ) {
    this.background = this.scene.add
      .tileSprite(0, 0, 32, 32, "pixel-floor-tile")
      .setOrigin(0)
      .setDepth(-10);
    this.starfield = this.scene.add.graphics();
  }

  get currentSector(): SectorDefinition {
    return this._currentSector;
  }

  get walls(): RenderedWall[] {
    return this._walls;
  }

  get doors(): RenderedDoor[] {
    return this._doors;
  }

  get interactions(): RenderedInteraction[] {
    return this._interactions;
  }

  get hidingSpots(): RenderedHideSpot[] {
    return this._hidingSpots;
  }

  get protocolZones(): RenderedProtocol[] {
    return this._protocolZones;
  }

  get drones(): RenderedDrone[] {
    return this._drones;
  }

  loadSector(
    sectorId: SectorDefinition["id"],
    options: {
      resetPosition?: boolean;
      onPlayerStart?: (point: SectorDefinition["start"]) => void;
    } = {}
  ): SectorDefinition {
    this._currentSector = sectorsById[sectorId];
    const theme = getSectorVisualTheme(this._currentSector.visualThemeId);

    this.background.setTint(theme.palette.floorBase);
    this.background.setSize(
      this._currentSector.size.width,
      this._currentSector.size.height
    );

    this.drawStarfield();
    this.clearSectorObjects();
    this.buildWalls();
    this.buildDoors();
    this.buildHidingSpots();
    this.buildInteractions();
    this.buildProtocolZones();
    this.buildDrones();

    this.scene.cameras.main.setBounds(
      0,
      0,
      this._currentSector.size.width,
      this._currentSector.size.height
    );

    if (options.resetPosition !== false) {
      options.onPlayerStart?.(this._currentSector.start);
    }

    return this._currentSector;
  }

  activatePulse(active: boolean): void {
    this.pulseActive = active;
    this.starfield.setAlpha(active ? 1 : 0.25);

    for (const wall of this._walls) {
      const target = getVisibleWallRect(
        wall.def.rect,
        wall.def.pulseRect,
        active
      );
      const profile = getPulseTweenProfile(
        {
          id: wall.def.id,
          ...wall.def.rect
        },
        target
      );
      this.scene.tweens.add({
        targets: wall.object,
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
        width: target.width,
        height: target.height,
        duration: profile.duration,
        delay: profile.delay,
        ease: "Sine.easeInOut"
      });
    }
  }

  refreshInteractionVisibility(scanRevealTimer: number): void {
    for (const interaction of this._interactions) {
      const visible = isInteractionVisible(
        interaction.def.hiddenUntilScan,
        scanRevealTimer
      );
      interaction.object.setVisible(visible);
      interaction.label.setVisible(visible);
    }
  }

  private clearSectorObjects(): void {
    for (const wall of this._walls) {
      wall.object.destroy();
    }
    for (const door of this._doors) {
      door.object.destroy();
      door.label.destroy();
    }
    for (const interaction of this._interactions) {
      interaction.object.destroy();
      interaction.label.destroy();
    }
    for (const hideSpot of this._hidingSpots) {
      hideSpot.object.destroy();
    }
    for (const zone of this._protocolZones) {
      zone.object.destroy();
    }
    for (const drone of this._drones) {
      drone.body.destroy();
      drone.halo.destroy();
      drone.vision.destroy();
    }

    this._walls = [];
    this._doors = [];
    this._interactions = [];
    this._hidingSpots = [];
    this._protocolZones = [];
    this._drones = [];
  }

  private drawStarfield(): void {
    this.starfield.clear();
    this.starfield.setAlpha(this.pulseActive ? 1 : 0.25);
    const theme = getSectorVisualTheme(this._currentSector.visualThemeId);
    this.starfield.fillStyle(theme.palette.pulseBackdrop, 1);
    this.starfield.fillRect(
      0,
      0,
      this._currentSector.size.width,
      this._currentSector.size.height
    );

    const random = new Phaser.Math.RandomDataGenerator([this._currentSector.id]);
    for (let index = 0; index < 120; index += 1) {
      this.starfield.fillStyle(
        random.pick(theme.palette.starfield),
        random.realInRange(0.2, 0.95)
      );
      this.starfield.fillCircle(
        random.between(0, this._currentSector.size.width),
        random.between(0, this._currentSector.size.height),
        random.realInRange(0.7, 2.1)
      );
    }
  }

  private buildWalls(): void {
    const theme = getSectorVisualTheme(this._currentSector.visualThemeId);
    this._walls = this._currentSector.walls.map((def) => ({
      def,
      object: this.scene.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          theme.palette.wallBase,
          0.92
        )
        .setStrokeStyle(2, theme.palette.wallTrim, 0.35)
    }));
  }

  private buildDoors(): void {
    const theme = getSectorVisualTheme(this._currentSector.visualThemeId);
    this._doors = this._currentSector.doors.map((def) => {
      const unlocked =
        (!def.requiresObjective ||
          this.controller.state.objectivesCollected.includes(def.requiresObjective)) &&
        (!def.requiresAllObjectives || this.controller.hasAllObjectives());
      const object = this.scene.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          unlocked ? theme.palette.accent : 0x52586d,
          0.55
        )
        .setStrokeStyle(2, theme.palette.glow, 0.4);
      const label = this.scene.add
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
    this._hidingSpots = this._currentSector.hidingSpots.map((def) => ({
      def,
      object: this.scene.add
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
    this._interactions = this._currentSector.interactions
      .filter((def) => {
        if (def.kind === "pod" || def.kind === "bench") {
          return true;
        }

        if (def.kind === "ending") {
          return this.controller.state.availableEndings.length > 0;
        }

        return !this.controller.isInteractionCollected(def.id);
      })
      .map((def) => {
        const visible = isInteractionVisible(def.hiddenUntilScan, 0);
        const object = this.scene.add
          .rectangle(
            def.rect.x + def.rect.width / 2,
            def.rect.y + def.rect.height / 2,
            def.rect.width,
            def.rect.height,
            this.getInteractionColor(def.kind),
            def.hiddenUntilScan ? 0.18 : 0.66
          )
          .setStrokeStyle(2, 0xffffff, def.hiddenUntilScan ? 0.1 : 0.35)
          .setVisible(visible);
        const label = this.scene.add
          .text(object.x, object.y, def.label, {
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "12px",
            color: "#f7fbff",
            align: "center",
            wordWrap: { width: 120 }
          })
          .setOrigin(0.5)
          .setVisible(visible);
        return { def, object, label };
      });
  }

  private buildProtocolZones(): void {
    const theme = getSectorVisualTheme(this._currentSector.visualThemeId);
    this._protocolZones = this._currentSector.protocolZones.map((def) => ({
      def,
      object: this.scene.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          def.tint,
          0.12
        )
        .setStrokeStyle(
          1,
          Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(def.tint),
            Phaser.Display.Color.ValueToColor(theme.palette.glow),
            100,
            40
          ).color,
          0.3
        )
    }));
  }

  private buildDrones(): void {
    this._drones = this._currentSector.drones.map((def) => {
      const start = def.path[0];
      return {
        def,
        body: this.scene.add.circle(start.x, start.y, 14, def.tint, 0.88),
        halo: this.scene.add.circle(start.x, start.y, 30, def.tint, 0.08),
        vision: this.scene.add.graphics(),
        pathIndex: 0,
        direction: 1 as 1 | -1,
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
}
