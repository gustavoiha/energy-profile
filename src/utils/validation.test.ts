import { describe, expect, it } from "vitest";
import type { Appliance, Producer, TariffModel } from "../types/domain";
import { validateAppliance, validateProducer, validateTariff } from "./validation";

function baseAppliance(): Appliance {
  return {
    id: "a1",
    name: "Test",
    enabled: true,
    quantity: 1,
    icon: "custom",
    model: { kind: "always_on", watts: 100 }
  };
}

function baseProducer(): Producer {
  return {
    id: "p1",
    name: "Solar",
    enabled: true,
    quantity: 1,
    icon: "solar-panel",
    model: { kind: "solar_curve", peakKw: 1, startMin: 7 * 60, endMin: 18 * 60 }
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

  it("validates scheduled window duration", () => {
    const appliance: Appliance = {
      ...baseAppliance(),
      model: {
        kind: "scheduled_window",
        watts: 1200,
        startMin: 19 * 60,
        durationMin: 2000
      }
    };

    const errors = validateAppliance(appliance);
    expect(errors).toContain("Duration must be between 0 and 1,440 minutes");
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

describe("validateProducer", () => {
  it("accepts valid producer", () => {
    expect(validateProducer(baseProducer())).toEqual([]);
  });

  it("rejects invalid battery values", () => {
    const producer: Producer = {
      ...baseProducer(),
      icon: "battery",
      model: {
        kind: "battery_discharge",
        capacityKwh: -1,
        maxOutputKw: 0.5,
        startMin: 0,
        endMin: 24 * 60,
        strategy: "self_consumption"
      }
    };

    const errors = validateProducer(producer);
    expect(errors).toContain("Battery capacity must be between 0 and 1,000 kWh");
  });
});

describe("validateTariff", () => {
  it("accepts valid flat tariff", () => {
    const tariff: TariffModel = { kind: "flat", currency: "USD", ratePerKwh: 0.18, sellBackRatePerKwh: 0.05 };
    expect(validateTariff(tariff)).toEqual([]);
  });

  it("rejects tou tariff with no windows", () => {
    const tariff: TariffModel = {
      kind: "tou",
      currency: "USD",
      defaultRatePerKwh: 0.12,
      sellBackRatePerKwh: 0.04,
      windows: []
    };

    const errors = validateTariff(tariff);
    expect(errors).toContain("Add at least one TOU window");
  });
});
