import type { GameController } from "../game/simulation/controller";
import type { AudioDirector } from "../audio/AudioDirector";
import type { Hud } from "../ui/Hud";

export interface GameServices {
  controller: GameController;
  audio: AudioDirector;
  hud: Hud;
}
