import Phaser from "phaser";

import type {
  DoorDefinition,
  DroneDefinition,
  HidingSpotDefinition,
  InteractionDefinition,
  ProtocolZoneDefinition,
  WallDefinition
} from "../../game/content/sectors";

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
  body: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
  vision: Phaser.GameObjects.Graphics;
  pathIndex: number;
  direction: 1 | -1;
  facingAngle: number;
};

export type Warden = {
  body: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
};
