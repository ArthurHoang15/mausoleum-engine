import Phaser from "phaser";

import type { RenderedWall, VectorLike } from "./types";
export { combineMovementInput } from "./player-math";
import { evaluateHiddenMovement } from "./stealth-logic";

export class PlayerDirector {
  private readonly player: Phaser.GameObjects.Arc;
  private readonly halo: Phaser.GameObjects.Arc;
  private hidden = false;
  private dashTimer = 0;
  private dashVector = new Phaser.Math.Vector2();
  private concealmentTimer = 0;
  private hideAnchor: VectorLike | null = null;
  private readonly playerSpeed = 140;

  constructor(private readonly scene: Phaser.Scene) {
    this.halo = this.scene.add.circle(0, 0, 24, 0xa9d6ff, 0.18).setDepth(20);
    this.player = this.scene.add.circle(0, 0, 16, 0xf4f7ff, 1).setDepth(21);
  }

  get sprite(): Phaser.GameObjects.Arc {
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
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.player.setAlpha(hidden ? 0.3 : 1);
    this.halo.setAlpha(hidden ? 0.12 : 0.18);
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
    if (this.hidden) {
      this.hideAnchor ??= this.position;
    }
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
