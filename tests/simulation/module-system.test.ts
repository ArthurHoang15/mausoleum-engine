import { describe, expect, test } from "vitest";

import {
  applyModuleAction,
  createModuleRack,
  getModuleStateLabel,
  type ModuleKind
} from "../../src/game/simulation/state";

describe("module system", () => {
  test("degrades charge and condition according to module action intensity", () => {
    const rack = createModuleRack();

    const updated = applyModuleAction(rack, {
      module: "eyes",
      chargeCost: 20,
      strain: 34,
      signal: 10
    });

    expect(updated.eyes.charge).toBe(80);
    expect(updated.eyes.condition).toBe(66);
    expect(getModuleStateLabel(updated.eyes)).toBe("degraded");
  });

  test("pushes a module to critical when strain passes the threshold", () => {
    const rack = createModuleRack();

    const updated = applyModuleAction(rack, {
      module: "core",
      chargeCost: 30,
      strain: 72,
      signal: 25
    });

    expect(updated.core.condition).toBe(28);
    expect(getModuleStateLabel(updated.core)).toBe("critical");
  });

  test.each<ModuleKind>(["eyes", "legs", "neural", "core"])(
    "restores charge without increasing condition for %s energy cells",
    (module) => {
      const rack = applyModuleAction(createModuleRack(), {
        module,
        chargeCost: 40,
        strain: 10,
        signal: 5
      });

      const charged = applyModuleAction(rack, {
        module,
        chargeGain: 25,
        strain: 0,
        signal: 0
      });

      expect(charged[module].charge).toBe(85);
      expect(charged[module].condition).toBe(90);
    }
  );
});
