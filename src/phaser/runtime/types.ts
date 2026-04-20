import Phaser from "phaser";

import type {
  DoorDefinition,
  DroneDefinition,
  HidingSpotDefinition,
  InteractionDefinition,
  ProtocolZoneDefinition,
  WallDefinition
} from "../../game/content/sectors";
import type { RuntimeRenderAnchor } from "./pixelPresentation";

export interface VectorLike {
  x: number;
  y: number;
}

export type RenderedWall = {
  def: WallDefinition;
  object: Phaser.GameObjects.Rectangle;
};

export type RenderedDoor = {
  def: DoorDefinition;
  object: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

export type RenderedInteraction = {
  def: InteractionDefinition;
  object: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

export type RenderedHideSpot = {
  def: HidingSpotDefinition;
  object: Phaser.GameObjects.Rectangle;
};

export type RenderedProtocol = {
  def: ProtocolZoneDefinition;
  object: Phaser.GameObjects.Rectangle;
};

export type RenderedDrone = {
  def: DroneDefinition;
  body: RuntimeRenderAnchor;
  halo: Phaser.GameObjects.Arc;
  vision: Phaser.GameObjects.Graphics;
  sprite?: Phaser.GameObjects.Sprite;
  fx?: Phaser.GameObjects.Sprite;
  pathIndex: number;
  direction: 1 | -1;
  facingAngle: number;
};

export type Warden = {
  body: RuntimeRenderAnchor;
  halo: Phaser.GameObjects.Arc;
  sprite?: Phaser.GameObjects.Sprite;
  fx?: Phaser.GameObjects.Sprite;
};
