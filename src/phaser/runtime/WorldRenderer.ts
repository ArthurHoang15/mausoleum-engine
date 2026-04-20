import Phaser from "phaser";

import {
  sectorsById,
  type InteractionDefinition,
  type Rect,
  type SectorDefinition
} from "../../game/content/sectors";
import {
  getSectorVisualTheme,
  type SectorVisualTheme
} from "../../game/content/visualThemes";
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
  buildEnvironmentRenderPlan,
  getWallTreatment,
  type EnvironmentFloorBand,
  type EnvironmentRenderPlan
} from "./environment-rendering";
import {
  getPulseTweenProfile,
  getVisibleWallRect,
  isInteractionVisible
} from "./world-logic";

type FloorBandPresentation = {
  band: EnvironmentFloorBand;
  shadow: Phaser.GameObjects.Rectangle;
  tile: Phaser.GameObjects.TileSprite;
  outline: Phaser.GameObjects.Rectangle;
};

type WallPresentation = {
  shadow: Phaser.GameObjects.Rectangle;
  tile: Phaser.GameObjects.TileSprite;
  cap: Phaser.GameObjects.Rectangle;
  leftTrim: Phaser.GameObjects.Rectangle;
  rightTrim: Phaser.GameObjects.Rectangle;
};

export class WorldRenderer {
  private readonly background: Phaser.GameObjects.TileSprite;
  private readonly floorDetail: Phaser.GameObjects.TileSprite;
  private readonly starfield: Phaser.GameObjects.Graphics;
  private environmentPlan!: EnvironmentRenderPlan;
  private _currentSector!: SectorDefinition;
  private pulseActive = false;
  private floorBands: FloorBandPresentation[] = [];
  private wallPresentation = new Map<string, WallPresentation>();
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
      .setDepth(-30)
      .setAlpha(0.98);
    this.floorDetail = this.scene.add
      .tileSprite(0, 0, 32, 32, "pixel-floor-tile")
      .setOrigin(0)
      .setDepth(-24)
      .setAlpha(0.2);
    this.starfield = this.scene.add.graphics().setDepth(-27);
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
    this.environmentPlan = buildEnvironmentRenderPlan(
      theme,
      this._currentSector.size
    );

    this.background
      .setTint(this.environmentPlan.baseFloorTint)
      .setSize(this._currentSector.size.width, this._currentSector.size.height);
    this.floorDetail
      .setTint(this.environmentPlan.detailFloorTint)
      .setAlpha(this.environmentPlan.detailFloorAlpha)
      .setSize(this._currentSector.size.width, this._currentSector.size.height);

    this.drawStarfield();
    this.clearSectorObjects();
    this.buildFloorBands();
    this.buildWalls(theme);
    this.buildDoors();
    this.buildHidingSpots();
    this.buildInteractions();
    this.buildProtocolZones();
    this.buildDrones();
    this.refreshEnvironmentPulseState();

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
    this.refreshEnvironmentPulseState();

    const theme = getSectorVisualTheme(this._currentSector.visualThemeId);
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
      const treatment = getWallTreatment(theme, target);

      wall.object.setStrokeStyle(
        treatment.trimThickness,
        treatment.trimTint,
        treatment.trimAlpha
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

      this.animateWallPresentation(wall.def.id, target, theme, profile);
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

  private refreshEnvironmentPulseState(): void {
    this.starfield.setAlpha(this.pulseActive ? 1 : 0.25);
    this.floorDetail.setAlpha(
      this.pulseActive
        ? Math.min(0.34, this.environmentPlan.detailFloorAlpha + 0.08)
        : this.environmentPlan.detailFloorAlpha
    );

    for (const band of this.floorBands) {
      band.shadow.setFillStyle(
        this.environmentPlan.bandShadowTint,
        this.pulseActive
          ? Math.min(0.34, this.environmentPlan.bandShadowAlpha + 0.06)
          : this.environmentPlan.bandShadowAlpha
      );
      band.tile.setAlpha(
        this.pulseActive
          ? Math.min(0.36, band.band.alpha + 0.06)
          : band.band.alpha
      );
      band.outline.setStrokeStyle(
        2,
        band.band.outlineTint,
        this.pulseActive
          ? Math.min(0.34, band.band.outlineAlpha + 0.06)
          : band.band.outlineAlpha
      );
    }
  }

  private clearSectorObjects(): void {
    for (const band of this.floorBands) {
      band.shadow.destroy();
      band.tile.destroy();
      band.outline.destroy();
    }
    for (const presentation of this.wallPresentation.values()) {
      presentation.shadow.destroy();
      presentation.tile.destroy();
      presentation.cap.destroy();
      presentation.leftTrim.destroy();
      presentation.rightTrim.destroy();
    }
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

    this.floorBands = [];
    this.wallPresentation.clear();
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
    for (let index = 0; index < 140; index += 1) {
      const size = random.pick([1, 1, 1, 2, 2, 3]);
      this.starfield.fillStyle(
        random.pick(theme.palette.starfield),
        random.realInRange(0.24, 0.95)
      );
      this.starfield.fillRect(
        random.between(0, this._currentSector.size.width),
        random.between(0, this._currentSector.size.height),
        size,
        size
      );
    }
  }

  private buildFloorBands(): void {
    this.floorBands = this.environmentPlan.floorBands.map((band) => {
      const shadow = this.scene.add
        .rectangle(
          band.x + band.width / 2 + 8,
          band.y + band.height / 2 + 8,
          band.width,
          band.height,
          this.environmentPlan.bandShadowTint,
          this.environmentPlan.bandShadowAlpha
        )
        .setDepth(-21);
      const tile = this.scene.add
        .tileSprite(
          band.x + band.width / 2,
          band.y + band.height / 2,
          band.width,
          band.height,
          "pixel-floor-tile"
        )
        .setTint(band.tint)
        .setAlpha(band.alpha)
        .setDepth(-20);
      const outline = this.scene.add
        .rectangle(
          band.x + band.width / 2,
          band.y + band.height / 2,
          band.width,
          band.height,
          band.tint,
          0
        )
        .setStrokeStyle(2, band.outlineTint, band.outlineAlpha)
        .setDepth(-19);

      return { band, shadow, tile, outline };
    });
  }

  private buildWalls(theme: SectorVisualTheme): void {
    this._walls = this._currentSector.walls.map((def) => {
      const presentation: WallPresentation = {
        shadow: this.scene.add
          .rectangle(0, 0, 1, 1, 0x000000, 0.2)
          .setDepth(0.8),
        tile: this.scene.add
          .tileSprite(0, 0, 1, 1, "pixel-wall-tile")
          .setDepth(1.1),
        cap: this.scene.add
          .rectangle(0, 0, 1, 1, theme.palette.wallTrim, 0.9)
          .setDepth(2.1),
        leftTrim: this.scene.add
          .rectangle(0, 0, 1, 1, theme.palette.wallTrim, 0.3)
          .setDepth(2),
        rightTrim: this.scene.add
          .rectangle(0, 0, 1, 1, theme.palette.wallTrim, 0.3)
          .setDepth(2)
      };
      const treatment = getWallTreatment(theme, def.rect);
      const object = this.scene.add
        .rectangle(
          def.rect.x + def.rect.width / 2,
          def.rect.y + def.rect.height / 2,
          def.rect.width,
          def.rect.height,
          theme.palette.wallBase,
          0.16
        )
        .setStrokeStyle(
          treatment.trimThickness,
          treatment.trimTint,
          treatment.trimAlpha
        )
        .setDepth(1.7);

      this.wallPresentation.set(def.id, presentation);
      this.syncWallPresentation(def.id, def.rect, theme);

      return { def, object };
    });
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
        .setStrokeStyle(2, theme.palette.glow, 0.4)
        .setDepth(4);
      const label = this.scene.add
        .text(object.x, object.y, def.label, {
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13px",
          color: "#f5f7ff",
          align: "center",
          wordWrap: { width: 140 }
        })
        .setOrigin(0.5)
        .setDepth(6);
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
        .setDepth(3.5)
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
          .setDepth(4.5)
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
          .setDepth(6)
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
        .setDepth(3.2)
    }));
  }

  private buildDrones(): void {
    this._drones = this._currentSector.drones.map((def) => {
      const start = def.path[0];
      return {
        def,
        body: this.scene.add.circle(start.x, start.y, 14, def.tint, 0.88).setDepth(7),
        halo: this.scene.add.circle(start.x, start.y, 30, def.tint, 0.08).setDepth(6.8),
        vision: this.scene.add.graphics().setDepth(6.5),
        pathIndex: 0,
        direction: 1 as 1 | -1,
        facingAngle: 0
      };
    });
  }

  private animateWallPresentation(
    wallId: string,
    rect: Rect,
    theme: SectorVisualTheme,
    profile: { duration: number; delay: number }
  ): void {
    const presentation = this.wallPresentation.get(wallId);
    if (!presentation) {
      return;
    }

    const treatment = getWallTreatment(theme, rect);
    presentation.tile.setTint(treatment.faceTint).setAlpha(treatment.faceAlpha);
    presentation.cap.setFillStyle(treatment.capTint, treatment.capAlpha);
    presentation.leftTrim.setFillStyle(treatment.trimTint, treatment.trimAlpha);
    presentation.rightTrim.setFillStyle(treatment.trimTint, treatment.trimAlpha);
    presentation.shadow.setFillStyle(treatment.shadowTint, treatment.shadowAlpha);

    this.scene.tweens.add({
      targets: presentation.shadow,
      x: rect.x + rect.width / 2 + treatment.shadowOffsetX,
      y: rect.y + rect.height / 2 + treatment.shadowOffsetY,
      width: rect.width,
      height: rect.height,
      duration: profile.duration,
      delay: profile.delay,
      ease: "Sine.easeInOut"
    });
    this.scene.tweens.add({
      targets: presentation.tile,
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      width: rect.width,
      height: rect.height,
      duration: profile.duration,
      delay: profile.delay,
      ease: "Sine.easeInOut"
    });
    this.scene.tweens.add({
      targets: presentation.cap,
      x: rect.x + rect.width / 2,
      y: rect.y + treatment.capHeight / 2,
      width: rect.width,
      height: treatment.capHeight,
      duration: profile.duration,
      delay: profile.delay,
      ease: "Sine.easeInOut"
    });
    this.scene.tweens.add({
      targets: presentation.leftTrim,
      x: rect.x + treatment.trimThickness / 2,
      y: rect.y + rect.height / 2,
      width: treatment.trimThickness,
      height: rect.height,
      duration: profile.duration,
      delay: profile.delay,
      ease: "Sine.easeInOut"
    });
    this.scene.tweens.add({
      targets: presentation.rightTrim,
      x: rect.x + rect.width - treatment.trimThickness / 2,
      y: rect.y + rect.height / 2,
      width: treatment.trimThickness,
      height: rect.height,
      duration: profile.duration,
      delay: profile.delay,
      ease: "Sine.easeInOut"
    });
  }

  private syncWallPresentation(
    wallId: string,
    rect: Rect,
    theme: SectorVisualTheme
  ): void {
    const presentation = this.wallPresentation.get(wallId);
    if (!presentation) {
      return;
    }

    const treatment = getWallTreatment(theme, rect);
    presentation.shadow
      .setPosition(
        rect.x + rect.width / 2 + treatment.shadowOffsetX,
        rect.y + rect.height / 2 + treatment.shadowOffsetY
      )
      .setFillStyle(treatment.shadowTint, treatment.shadowAlpha);
    presentation.shadow.width = rect.width;
    presentation.shadow.height = rect.height;

    presentation.tile
      .setPosition(rect.x + rect.width / 2, rect.y + rect.height / 2)
      .setTint(treatment.faceTint)
      .setAlpha(treatment.faceAlpha);
    presentation.tile.width = rect.width;
    presentation.tile.height = rect.height;

    presentation.cap
      .setPosition(rect.x + rect.width / 2, rect.y + treatment.capHeight / 2)
      .setFillStyle(treatment.capTint, treatment.capAlpha);
    presentation.cap.width = rect.width;
    presentation.cap.height = treatment.capHeight;

    presentation.leftTrim
      .setPosition(
        rect.x + treatment.trimThickness / 2,
        rect.y + rect.height / 2
      )
      .setFillStyle(treatment.trimTint, treatment.trimAlpha);
    presentation.leftTrim.width = treatment.trimThickness;
    presentation.leftTrim.height = rect.height;

    presentation.rightTrim
      .setPosition(
        rect.x + rect.width - treatment.trimThickness / 2,
        rect.y + rect.height / 2
      )
      .setFillStyle(treatment.trimTint, treatment.trimAlpha);
    presentation.rightTrim.width = treatment.trimThickness;
    presentation.rightTrim.height = rect.height;
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
