import { describe, expect, it } from "vitest";
import type { Appliance } from "../types/domain";
import { validateAppliance } from "./validation";

function baseAppliance(): Appliance {
  return {
    id: "a1",
    name: "Test",
    category: "other",
    enabled: true,
    model: { kind: "always_on", watts: 100 }
  };
}

describe("validateAppliance", () => {
  it("accepts valid appliance", () => {
    const errors = validateAppliance(baseAppliance());
    expect(errors).toEqual([]);
  });

  it("rejects missing name", () => {
    const appliance = { ...baseAppliance(), name: "" };
    const errors = validateAppliance(appliance);
    expect(errors).toContain("Name is required");
  });

  it("requires at least one weekday for scheduled windows", () => {
    const appliance: Appliance = {
      ...baseAppliance(),
      model: {
        kind: "scheduled_window",
        watts: 1200,
        startMin: 19 * 60,
        durationMin: 90,
        weekdays: []
      }
    };

    const errors = validateAppliance(appliance);
    expect(errors).toContain("Select at least one weekday");
  });

  it("rejects non-integer count for count_based", () => {
    const appliance: Appliance = {
      ...baseAppliance(),
      model: {
        kind: "count_based",
        count: 1.5,
        wattsEach: 10
      }
    };

    const errors = validateAppliance(appliance);
    expect(errors).toContain("Count must be an integer between 0 and 200");
  });
});
