import type { HunterPhase } from "../game/simulation/state";

type ToneStep = {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  delay?: number;
  detune?: number;
  endFrequency?: number;
};

const GAIN_FLOOR = 0.0001;
const MAX_ATTACK = 0.02;

function buildScanPattern(): ToneStep[] {
  return [
    {
      frequency: 520,
      duration: 0.08,
      type: "triangle",
      gain: 0.03,
      endFrequency: 740
    },
    {
      frequency: 780,
      duration: 0.1,
      type: "sine",
      gain: 0.035,
      delay: 0.06,
      endFrequency: 1080
    },
    {
      frequency: 1040,
      duration: 0.08,
      type: "sine",
      gain: 0.02,
      delay: 0.11
    }
  ];
}

function buildHunterPattern(
  phase: HunterPhase,
  previousPhase: HunterPhase
): ToneStep[] {
  switch (phase) {
    case "aware":
      return previousPhase === "dormant"
        ? [
            {
              frequency: 204,
              duration: 0.16,
              type: "triangle",
              gain: 0.022,
              endFrequency: 306
            },
            {
              frequency: 396,
              duration: 0.12,
              type: "sine",
              gain: 0.014,
              delay: 0.08
            }
          ]
        : [
            {
              frequency: 220,
              duration: 0.14,
              type: "triangle",
              gain: 0.02,
              endFrequency: 330
            },
            {
              frequency: 440,
              duration: 0.1,
              type: "sine",
              gain: 0.012,
              delay: 0.06
            }
          ];
    case "stalking":
      return [
        {
          frequency: 152,
          duration: 0.12,
          type: "sine",
          gain: 0.016
        },
        {
          frequency: 140,
          duration: 0.16,
          type: "square",
          gain: 0.023,
          delay: 0.12,
          endFrequency: 124
        },
        {
          frequency: 118,
          duration: 0.22,
          type: "triangle",
          gain: 0.018,
          delay: 0.28
        }
      ];
    case "pulse-hunt":
      return [
        {
          frequency: 108,
          duration: 0.22,
          type: "sawtooth",
          gain: 0.046
        },
        {
          frequency: 136,
          duration: 0.16,
          type: "sawtooth",
          gain: 0.03,
          delay: 0.08,
          endFrequency: 182
        },
        {
          frequency: 760,
          duration: 0.1,
          type: "triangle",
          gain: 0.022,
          delay: 0.18
        },
        {
          frequency: 116,
          duration: 0.28,
          type: "square",
          gain: 0.032,
          delay: 0.26,
          endFrequency: 92
        }
      ];
    case "dormant":
    default:
      return [
        {
          frequency: 72,
          duration: 0.24,
          type: "sine",
          gain: 0.01,
          endFrequency: 60
        }
      ];
  }
}

function buildContainmentPattern(escalated: boolean): ToneStep[] {
  const escalationLayer: ToneStep[] = escalated
    ? [
        {
          frequency: 44,
          duration: 0.32,
          type: "sine",
          gain: 0.022,
          delay: 0.18
        }
      ]
    : [];

  return [
    {
      frequency: 84,
      duration: 0.24,
      type: "sawtooth",
      gain: 0.05
    },
    {
      frequency: 66,
      duration: 0.22,
      type: "square",
      gain: 0.04,
      delay: 0.06,
      endFrequency: 52
    },
    {
      frequency: 220,
      duration: 0.08,
      type: "triangle",
      gain: escalated ? 0.03 : 0.02,
      delay: 0.16
    },
    ...escalationLayer
  ];
}

function buildEndingPattern(): ToneStep[] {
  return [
    {
      frequency: 262,
      duration: 0.16,
      type: "triangle",
      gain: 0.032
    },
    {
      frequency: 392,
      duration: 0.18,
      type: "triangle",
      gain: 0.028,
      delay: 0.09,
      endFrequency: 523
    },
    {
      frequency: 659,
      duration: 0.22,
      type: "sine",
      gain: 0.024,
      delay: 0.18
    },
    {
      frequency: 523,
      duration: 0.34,
      type: "sine",
      gain: 0.02,
      delay: 0.34,
      endFrequency: 392
    }
  ];
}

export class AudioDirector {
  private context: AudioContext | null = null;
  private lastHunterPhase: HunterPhase = "dormant";
  private lastCueAt = new Map<string, number>();

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

  private shouldPlayCue(key: string, cooldownSeconds: number): boolean {
    const context = this.getContext();

    if (!context) {
      return false;
    }

    const now = context.currentTime;
    const lastAt = this.lastCueAt.get(key) ?? Number.NEGATIVE_INFINITY;

    if (now - lastAt < cooldownSeconds) {
      return false;
    }

    this.lastCueAt.set(key, now);
    return true;
  }

  private playTone(step: ToneStep): void {
    const context = this.getContext();

    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + (step.delay ?? 0);
    const duration = Math.max(step.duration, 0.04);
    const attackEnd = start + Math.min(MAX_ATTACK, duration * 0.4);
    const stopAt = start + duration;

    oscillator.type = step.type;
    oscillator.frequency.setValueAtTime(step.frequency, start);
    if (step.endFrequency && step.endFrequency !== step.frequency) {
      oscillator.frequency.linearRampToValueAtTime(step.endFrequency, stopAt);
    }
    if (step.detune) {
      oscillator.detune.setValueAtTime(step.detune, start);
    }

    gain.gain.setValueAtTime(GAIN_FLOOR, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(step.gain, GAIN_FLOOR),
      attackEnd
    );
    gain.gain.exponentialRampToValueAtTime(GAIN_FLOOR, stopAt);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(stopAt + 0.02);
  }

  private playCue(key: string, cooldownSeconds: number, steps: ToneStep[]): void {
    if (!this.shouldPlayCue(key, cooldownSeconds)) {
      return;
    }

    for (const step of steps) {
      this.playTone(step);
    }
  }

  onScan(): void {
    this.playCue("scan", 0.06, buildScanPattern());
  }

  onDash(): void {
    this.playCue("dash", 0.08, [
      {
        frequency: 220,
        duration: 0.14,
        type: "square",
        gain: 0.03,
        endFrequency: 180
      }
    ]);
  }

  onOverclock(): void {
    this.playCue("overclock", 0.12, [
      {
        frequency: 120,
        duration: 0.35,
        type: "sawtooth",
        gain: 0.04,
        endFrequency: 96
      },
      {
        frequency: 180,
        duration: 0.28,
        type: "triangle",
        gain: 0.03,
        delay: 0.03,
        endFrequency: 246
      },
      {
        frequency: 360,
        duration: 0.12,
        type: "sine",
        gain: 0.016,
        delay: 0.12
      }
    ]);
  }

  onMemory(): void {
    this.playCue("memory", 0.08, [
      {
        frequency: 480,
        duration: 0.28,
        type: "sine",
        gain: 0.035,
        endFrequency: 540
      },
      {
        frequency: 720,
        duration: 0.22,
        type: "sine",
        gain: 0.025,
        delay: 0.06,
        endFrequency: 648
      }
    ]);
  }

  onObjective(): void {
    this.playCue("objective", 0.08, [
      {
        frequency: 300,
        duration: 0.18,
        type: "triangle",
        gain: 0.04,
        endFrequency: 360
      },
      {
        frequency: 450,
        duration: 0.22,
        type: "triangle",
        gain: 0.035,
        delay: 0.06,
        endFrequency: 540
      },
      {
        frequency: 600,
        duration: 0.26,
        type: "triangle",
        gain: 0.03,
        delay: 0.12,
        endFrequency: 720
      }
    ]);
  }

  onContainment(): void {
    this.playCue(
      "containment",
      0.4,
      buildContainmentPattern(this.lastHunterPhase === "pulse-hunt")
    );
  }

  onPhaseChange(phase: HunterPhase): void {
    if (phase === this.lastHunterPhase) {
      return;
    }

    const previousPhase = this.lastHunterPhase;

    switch (phase) {
      case "aware":
        this.playCue(
          "phase-aware",
          0.12,
          buildHunterPattern(phase, previousPhase)
        );
        break;
      case "stalking":
        this.playCue(
          "phase-stalking",
          0.16,
          buildHunterPattern(phase, previousPhase)
        );
        break;
      case "pulse-hunt":
        this.playCue(
          "phase-pulse-hunt",
          0.5,
          buildHunterPattern(phase, previousPhase)
        );
        break;
      case "containment":
        this.playCue(
          "containment",
          0.4,
          buildContainmentPattern(previousPhase === "pulse-hunt")
        );
        break;
      case "dormant":
        this.playCue(
          "phase-dormant",
          0.2,
          buildHunterPattern(phase, previousPhase)
        );
        break;
      default:
        break;
    }

    this.lastHunterPhase = phase;
  }

  onEnding(): void {
    this.playCue("ending", 0.6, buildEndingPattern());
  }
}
