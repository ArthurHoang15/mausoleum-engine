import type { AudioDirector } from "../../audio/AudioDirector";
import type { SectorDefinition } from "../../game/content/sectors";
import type { GameController } from "../../game/simulation/controller";
import type {
  EndingChoice,
  SectorId
} from "../../game/simulation/state";
import type { Hud } from "../../ui/Hud";
import type {
  RenderedDoor,
  RenderedHideSpot,
  RenderedInteraction,
  VectorLike
} from "./types";

interface PointItem {
  x: number;
  y: number;
}

interface HubDoorTarget {
  label: string;
  targetSectorId: SectorId;
  requiresObjective?: SectorId;
}

export function pickNearestByRadius<T extends PointItem>(
  origin: VectorLike,
  items: T[],
  radius: number
): T | null {
  let closest: T | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const item of items) {
    const distance = Math.hypot(origin.x - item.x, origin.y - item.y);
    if (distance < radius && distance < closestDistance) {
      closest = item;
      closestDistance = distance;
    }
  }

  return closest;
}

export function resolvePromptText(options: {
  interactionPrompt: string | null;
  doorPrompt: string | null;
  hideSpotLabel: string | null;
  playerHidden: boolean;
}): string {
  if (options.interactionPrompt) {
    return options.interactionPrompt;
  }
  if (options.doorPrompt) {
    return options.doorPrompt;
  }
  if (options.hideSpotLabel) {
    return options.playerHidden
      ? "Leave shadow"
      : `Hide in ${options.hideSpotLabel}`;
  }

  return "Move, scan, and follow the rite.";
}

export function resolveObjectiveText(options: {
  currentSectorId: SectorId;
  currentSectorObjectiveLabel: string;
  currentSectorObjectiveHint: string;
  objectiveSectorIds: SectorId[];
  availableEndings: EndingChoice[];
  hubDoorTargets: HubDoorTarget[];
}): string {
  if (options.currentSectorId === "hub") {
    const next = options.hubDoorTargets.find((door) => {
      if (options.objectiveSectorIds.includes(door.targetSectorId)) {
        return false;
      }

      if (!door.requiresObjective) {
        return true;
      }

      return options.objectiveSectorIds.includes(door.requiresObjective);
    });

    return next?.label
      ? `Return to the nave and continue through ${next.label}.`
      : options.currentSectorObjectiveLabel;
  }

  if (
    options.currentSectorId === "reliquary-furnace" &&
    options.availableEndings.length > 0
  ) {
    return "The living key is yours. Choose a final rite at the altar below.";
  }

  if (options.objectiveSectorIds.includes(options.currentSectorId)) {
    return "Objective secured. Return to the Hollow Spine or keep exploring for relics.";
  }

  return options.currentSectorObjectiveHint;
}

export class InteractionDirector {
  constructor(
    private readonly controller: GameController,
    private readonly hud: Hud,
    private readonly audio: AudioDirector
  ) {}

  findNearestDoor(
    doors: RenderedDoor[],
    playerPosition: VectorLike
  ): RenderedDoor | null {
    return this.findNearest(doors, playerPosition, 88);
  }

  findNearestInteraction(
    interactions: RenderedInteraction[],
    playerPosition: VectorLike,
    scanRevealTimer: number
  ): RenderedInteraction | null {
    return this.findNearest(
      interactions.filter((item) =>
        item.def.hiddenUntilScan ? scanRevealTimer > 0 : true
      ),
      playerPosition,
      84
    );
  }

  findNearestHideSpot(
    hidingSpots: RenderedHideSpot[],
    playerPosition: VectorLike
  ): RenderedHideSpot | null {
    return this.findNearest(hidingSpots, playerPosition, 88);
  }

  getPromptText(options: {
    interactions: RenderedInteraction[];
    doors: RenderedDoor[];
    hidingSpots: RenderedHideSpot[];
    playerPosition: VectorLike;
    playerHidden: boolean;
    scanRevealTimer: number;
  }): string {
    const interaction = this.findNearestInteraction(
      options.interactions,
      options.playerPosition,
      options.scanRevealTimer
    );
    const door = this.findNearestDoor(options.doors, options.playerPosition);
    const hideSpot = this.findNearestHideSpot(
      options.hidingSpots,
      options.playerPosition
    );

    return resolvePromptText({
      interactionPrompt: interaction?.def.prompt ?? null,
      doorPrompt: door?.def.prompt ?? null,
      hideSpotLabel: hideSpot?.def.label ?? null,
      playerHidden: options.playerHidden
    });
  }

  getObjectiveText(currentSector: SectorDefinition): string {
    return resolveObjectiveText({
      currentSectorId: currentSector.id,
      currentSectorObjectiveLabel: currentSector.objectiveLabel,
      currentSectorObjectiveHint: currentSector.objectiveHint,
      objectiveSectorIds: this.controller.state.objectivesCollected,
      availableEndings: this.controller.state.availableEndings,
      hubDoorTargets: currentSector.doors.map((door) => ({
        label: door.label,
        targetSectorId: door.targetSectorId,
        requiresObjective: door.requiresObjective
      }))
    });
  }

  tryInteract(options: {
    interactions: RenderedInteraction[];
    doors: RenderedDoor[];
    hidingSpots: RenderedHideSpot[];
    playerPosition: VectorLike;
    playerHidden: boolean;
    scanRevealTimer: number;
    onToggleHidden: () => boolean;
    onSectorTransition: (sectorId: SectorId) => void;
    onRefreshCurrentSector: () => void;
    onPulseEscape: () => void;
  }): void {
    const nearbyDoor = this.findNearestDoor(options.doors, options.playerPosition);
    if (nearbyDoor) {
      const result = this.controller.useDoor(nearbyDoor.def);
      if (result.toast) {
        this.hud.showToast(result.toast);
      }
      if (result.transitionTo) {
        if (this.controller.hunterPhase === "pulse-hunt") {
          options.onPulseEscape();
        }
        options.onSectorTransition(result.transitionTo);
      }
      return;
    }

    const hideSpot = this.findNearestHideSpot(
      options.hidingSpots,
      options.playerPosition
    );
    if (hideSpot) {
      const hidden = options.onToggleHidden();
      this.hud.showToast(hidden ? "Hidden in shadow." : "Left the shadow.");
      return;
    }

    const interaction = this.findNearestInteraction(
      options.interactions,
      options.playerPosition,
      options.scanRevealTimer
    );
    if (!interaction) {
      this.hud.showToast("Nothing nearby responds.");
      return;
    }

    const result = this.controller.interact(interaction.def);
    if (result.toast) {
      this.hud.showToast(result.toast);
    }
    if (result.storyTitle && result.storyBody) {
      this.hud.showStory(result.storyTitle, result.storyBody);
      if (interaction.def.kind === "memory") {
        this.audio.onMemory();
      }
      if (interaction.def.kind === "objective") {
        this.audio.onObjective();
      }
    }
    if (result.ending) {
      this.audio.onEnding();
      this.hud.showStory(interaction.def.label, this.getEndingText(result.ending));
    }

    options.onRefreshCurrentSector();
  }

  private findNearest<T extends { object: { x: number; y: number } }>(
    items: T[],
    playerPosition: VectorLike,
    radius: number
  ): T | null {
    const nearest = pickNearestByRadius(
      playerPosition,
      items.map((item) => ({
        item,
        x: item.object.x,
        y: item.object.y
      })),
      radius
    );

    return nearest?.item ?? null;
  }

  private getEndingText(ending: EndingChoice): string {
    if (ending === "break-the-rite") {
      return "You shatter the Mausoleum Engine and release humanity's trapped echoes into the dark between stars.";
    }

    if (ending === "become-the-caretaker") {
      return "You ascend into the Engine's choir and take the Warden's place, guardian of a dead rite.";
    }

    return "You escape alive, but the unfinished machine-organism inside you continues to hum with sacred intent.";
  }
}
