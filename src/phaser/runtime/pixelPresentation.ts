import Phaser from "phaser";

export type RuntimeRenderAnchor =
  | Phaser.GameObjects.Arc
  | Phaser.GameObjects.Container;

type PixelAnchorConfig = {
  x: number;
  y: number;
  texture: string;
  animationKey?: string;
  depth: number;
  scale: number;
  spriteOffsetY?: number;
  fxTexture?: string;
  fxScale?: number;
  fxAlpha?: number;
  fxOffsetY?: number;
};

type PixelAnchorParts = {
  body: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  fx?: Phaser.GameObjects.Sprite;
};

export function createPixelAnchor(
  scene: Phaser.Scene,
  config: PixelAnchorConfig
): PixelAnchorParts {
  const body = scene.add.container(config.x, config.y).setDepth(config.depth);
  const children: Phaser.GameObjects.GameObject[] = [];

  let fx: Phaser.GameObjects.Sprite | undefined;
  if (config.fxTexture) {
    fx = scene.add
      .sprite(0, config.fxOffsetY ?? 0, config.fxTexture, 0)
      .setScale(config.fxScale ?? 1)
      .setAlpha(config.fxAlpha ?? 0)
      .setBlendMode(Phaser.BlendModes.ADD);
    children.push(fx);
  }

  const sprite = scene.add
    .sprite(0, config.spriteOffsetY ?? 0, config.texture, 0)
    .setScale(config.scale);
  if (config.animationKey) {
    sprite.play(config.animationKey);
  }

  children.push(sprite);
  body.add(children);

  return { body, sprite, fx };
}
