import type { HunterPhase } from "../game/simulation/state";

export class AudioDirector {
  private context: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") {
      return null;
    }

    if (!this.context) {
      const ctor = window.AudioContext ?? (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

      if (!ctor) {
        return null;
      }

      this.context = new ctor();
    }

    if (this.context.state === "suspended") {
      void this.context.resume();
    }

    return this.context;
  }

  unlock(): void {
    this.getContext();
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainValue: number
  ): void {
    const context = this.getContext();

    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  onScan(): void {
    this.playTone(560, 0.18, "triangle", 0.04);
    this.playTone(820, 0.16, "sine", 0.02);
  }

  onDash(): void {
    this.playTone(220, 0.14, "square", 0.03);
  }

  onOverclock(): void {
    this.playTone(120, 0.35, "sawtooth", 0.04);
    this.playTone(180, 0.28, "triangle", 0.03);
  }

  onMemory(): void {
    this.playTone(480, 0.28, "sine", 0.035);
    this.playTone(720, 0.22, "sine", 0.025);
  }

  onObjective(): void {
    this.playTone(300, 0.18, "triangle", 0.04);
    this.playTone(450, 0.22, "triangle", 0.035);
    this.playTone(600, 0.26, "triangle", 0.03);
  }

  onContainment(): void {
    this.playTone(90, 0.5, "sawtooth", 0.05);
  }

  onPhaseChange(phase: HunterPhase): void {
    switch (phase) {
      case "aware":
        this.playTone(180, 0.25, "triangle", 0.02);
        break;
      case "stalking":
        this.playTone(160, 0.35, "sawtooth", 0.03);
        break;
      case "pulse-hunt":
        this.playTone(110, 0.55, "sawtooth", 0.05);
        this.playTone(660, 0.16, "triangle", 0.02);
        break;
      case "containment":
        this.onContainment();
        break;
      default:
        break;
    }
  }

  onEnding(): void {
    this.playTone(260, 0.25, "triangle", 0.04);
    this.playTone(390, 0.28, "triangle", 0.035);
    this.playTone(520, 0.32, "triangle", 0.03);
  }
}
