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
  private readonly playerScale = 0.95;
  private hidden = false;
  private dashTimer = 0;
  private dashVector = new Phaser.Math.Vector2();
  private actionAnimationKey: string | null = null;
  private actionAnimationTimer = 0;
  private concealmentTimer = 0;
  private hideAnchor: VectorLike | null = null;
  private readonly playerSpeed = 140;

  constructor(private readonly scene: Phaser.Scene) {
    this.halo = this.scene.add.circle(0, 0, 28, 0xa9d6ff, 0.18).setDepth(20);
    const presentation = createPixelAnchor(this.scene, {
      x: 0,
      y: 0,
      texture: "pixel-player-proxy",
      animationKey: PIXEL_ANIMATION_KEYS.playerIdle,
      depth: 21,
      scale: this.playerScale,
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
    this.actionAnimationKey = null;
    this.actionAnimationTimer = 0;
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

  playScanAnimation(): void {
    this.actionAnimationKey = PIXEL_ANIMATION_KEYS.playerScan;
    this.actionAnimationTimer = 0.8;
  }

  playInteractAnimation(): void {
    this.actionAnimationKey = PIXEL_ANIMATION_KEYS.playerInteract;
    this.actionAnimationTimer = 1;
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
    this.actionAnimationTimer = Math.max(0, this.actionAnimationTimer - delta);
    if (this.actionAnimationTimer <= 0) {
      this.actionAnimationKey = null;
    }

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
    const dashing = dash.lengthSq() > 1;
    const moving = move.lengthSq() > 0.01 || dashing;
    const motionX = Math.abs(move.x) > 0.01 ? move.x : dash.x;
    this.playerSprite.setFlipX(dashing && motionX < -0.01);

    const animationKey = this.pickAnimationKey(move, dashing, moving);
    const isOneShotAction =
      animationKey === PIXEL_ANIMATION_KEYS.playerScan ||
      animationKey === PIXEL_ANIMATION_KEYS.playerInteract;
    const shouldSwitchAnimation =
      this.playerSprite.anims.currentAnim?.key !== animationKey ||
      (!isOneShotAction && !this.playerSprite.anims.isPlaying);
    if (shouldSwitchAnimation) {
      this.playerSprite.play(animationKey, true);
    }

    const dashStretch = this.dashTimer > 0 ? 1 + this.dashTimer * 0.9 : 1;
    this.playerSprite.setScale(
      this.playerScale * dashStretch,
      this.playerScale / dashStretch
    );
    this.halo.setScale(0.95 + dashStretch * 0.18);
  }

  private pickAnimationKey(
    move: Phaser.Math.Vector2,
    dashing: boolean,
    moving: boolean
  ): string {
    if (dashing) {
      return PIXEL_ANIMATION_KEYS.playerDash;
    }

    if (this.actionAnimationKey) {
      return this.actionAnimationKey;
    }

    if (!moving) {
      return PIXEL_ANIMATION_KEYS.playerIdle;
    }

    if (Math.abs(move.x) > Math.abs(move.y)) {
      return move.x < 0
        ? PIXEL_ANIMATION_KEYS.playerWalkLeft
        : PIXEL_ANIMATION_KEYS.playerWalkRight;
    }

    return move.y < 0
      ? PIXEL_ANIMATION_KEYS.playerWalkUp
      : PIXEL_ANIMATION_KEYS.playerWalkDown;
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
