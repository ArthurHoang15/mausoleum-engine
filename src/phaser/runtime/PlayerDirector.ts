import Phaser from "phaser";

import { PIXEL_ANIMATION_KEYS } from "../assets/pixelManifest";
import type { RenderedWall, VectorLike } from "./types";
export { combineMovementInput } from "./player-math";
import { createPixelAnchor } from "./pixelPresentation";
import { evaluateHiddenMovement } from "./stealth-logic";

export class PlayerDirector {
  private readonly player: Phaser.GameObjects.Container;
  private readonly playerSprite: Phaser.GameObjects.Sprite;
  private readonly halo: Phaser.GameObjects.Arc;
  private hidden = false;
  private dashTimer = 0;
  private dashVector = new Phaser.Math.Vector2();
  private concealmentTimer = 0;
  private hideAnchor: VectorLike | null = null;
  private readonly playerSpeed = 140;

  constructor(private readonly scene: Phaser.Scene) {
    this.halo = this.scene.add.circle(0, 0, 24, 0xa9d6ff, 0.18).setDepth(20);
    const presentation = createPixelAnchor(this.scene, {
      x: 0,
      y: 0,
      texture: "pixel-player-proxy",
      animationKey: PIXEL_ANIMATION_KEYS.playerIdle,
      depth: 21,
      scale: 1.35,
      spriteOffsetY: -1
    });
    this.player = presentation.body;
    this.playerSprite = presentation.sprite;
    this.updatePresentation(new Phaser.Math.Vector2(), new Phaser.Math.Vector2());
  }

  get sprite(): Phaser.GameObjects.Container {
    return this.player;
  }

  get position(): VectorLike {
    return { x: this.player.x, y: this.player.y };
  }

  get isHidden(): boolean {
    return this.hidden;
  }

  get concealmentDuration(): number {
    return this.concealmentTimer;
  }

  setPosition(position: VectorLike): void {
    this.player.setPosition(position.x, position.y);
    this.halo.setPosition(position.x, position.y);
    if (this.hidden) {
      this.hideAnchor = { ...position };
    }
  }

  resetStealth(): void {
    this.setHidden(false);
    this.resetConcealment();
    this.dashTimer = 0;
    this.dashVector.set(0, 0);
    this.hideAnchor = null;
    this.updatePresentation(new Phaser.Math.Vector2(), new Phaser.Math.Vector2());
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.player.setAlpha(hidden ? 0.3 : 1);
    this.halo.setAlpha(hidden ? 0.12 : 0.18);
    this.playerSprite.setTint(hidden ? 0xa9d6ff : 0xffffff);
    this.hideAnchor = hidden ? this.position : null;
  }

  toggleHidden(): boolean {
    this.setHidden(!this.hidden);
    this.resetConcealment();

    return this.hidden;
  }

  resetConcealment(): void {
    this.concealmentTimer = 0;
  }

  addConcealment(delta: number): void {
    this.concealmentTimer += delta;
  }

  primeDash(vector: VectorLike): boolean {
    if (this.dashTimer > 0) {
      return false;
    }

    const move = new Phaser.Math.Vector2(vector.x, vector.y);
    if (move.lengthSq() <= 0.01) {
      return false;
    }

    this.dashVector = move.normalize().scale(420);
    this.dashTimer = 0.18;

    return true;
  }

  update(
    delta: number,
    inputVector: VectorLike,
    walls: RenderedWall[],
    sectorSize: { width: number; height: number },
    overclockActive: boolean
  ): void {
    const move = new Phaser.Math.Vector2(inputVector.x, inputVector.y);

    this.dashTimer = Math.max(0, this.dashTimer - delta);

    let hiddenSpeedMultiplier = this.hidden ? 0.5 : 1;
    if (this.hidden) {
      const anchor = this.hideAnchor ?? this.position;
      const hiddenMovement = evaluateHiddenMovement({
        hidden: true,
        inputMagnitude: move.length(),
        distanceFromAnchor: Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          anchor.x,
          anchor.y
        )
      });

      if (hiddenMovement.reveal) {
        this.setHidden(false);
        this.resetConcealment();
      } else {
        hiddenSpeedMultiplier = hiddenMovement.speedMultiplier;
      }
    }

    const speed =
      this.playerSpeed *
      (overclockActive ? 1.35 : 1) *
      hiddenSpeedMultiplier;
    const dash =
      this.dashTimer > 0 ? this.dashVector.clone() : new Phaser.Math.Vector2();
    const velocity = move.scale(speed).add(dash);

    const nextX = this.player.x + velocity.x * delta;
    const nextY = this.player.y + velocity.y * delta;
    const resolvedX = this.resolveAxis(nextX, this.player.y, true, walls, sectorSize);
    const resolvedY = this.resolveAxis(resolvedX, nextY, false, walls, sectorSize);

    this.player.setPosition(resolvedX, resolvedY);
    this.halo.setPosition(resolvedX, resolvedY);
    this.updatePresentation(move, dash);
    if (this.hidden) {
      this.hideAnchor ??= this.position;
    }
  }

  private updatePresentation(
    move: Phaser.Math.Vector2,
    dash: Phaser.Math.Vector2
  ): void {
    const motionX = Math.abs(move.x) > 0.01 ? move.x : dash.x;
    if (Math.abs(motionX) > 0.01) {
      this.playerSprite.setFlipX(motionX < 0);
    }

    const moving = move.lengthSq() > 0.01 || dash.lengthSq() > 1;
    const animationKey = moving
      ? PIXEL_ANIMATION_KEYS.playerWalk
      : PIXEL_ANIMATION_KEYS.playerIdle;
    if (
      this.playerSprite.anims.currentAnim?.key !== animationKey ||
      !this.playerSprite.anims.isPlaying
    ) {
      this.playerSprite.play(animationKey, true);
    }

    const dashStretch = this.dashTimer > 0 ? 1 + this.dashTimer * 0.9 : 1;
    this.playerSprite.setScale(1.35 * dashStretch, 1.35 / dashStretch);
    this.halo.setScale(0.95 + dashStretch * 0.18);
  }

  private resolveAxis(
    nextX: number,
    nextY: number,
    horizontal: boolean,
    walls: RenderedWall[],
    sectorSize: { width: number; height: number }
  ): number {
    const radius = 16;
    const min = radius;
    const max = horizontal ? sectorSize.width - radius : sectorSize.height - radius;
    const candidate = Phaser.Math.Clamp(horizontal ? nextX : nextY, min, max);

    for (const wall of walls) {
      const bounds = wall.object.getBounds();
      const x = horizontal ? candidate : nextX;
      const y = horizontal ? nextY : candidate;
      if (
        x + radius > bounds.left &&
        x - radius < bounds.right &&
        y + radius > bounds.top &&
        y - radius < bounds.bottom
      ) {
        return horizontal ? this.player.x : this.player.y;
      }
    }

    return candidate;
  }
}
