import { describe, expect, it } from "vitest";
import { computeApplianceHourly, simulate } from "./simulate";
import type { Appliance, ApplianceModel, HouseholdConfig, Producer } from "../types/domain";

function approx(actual: number, expected: number, digits = 8) {
  expect(actual).toBeCloseTo(expected, digits);
}

function mkAppliance(id: string, model: ApplianceModel, enabled = true): Appliance {
  return {
    id,
    name: id,
    enabled,
    quantity: 1,
    icon: "custom",
    model
  };
}

function mkBattery(id: string): Producer {
  return {
    id,
    name: "Battery",
    enabled: true,
    quantity: 1,
    icon: "battery",
    model: {
      kind: "battery_discharge",
      capacityKwh: 2,
      maxOutputKw: 1,
      startMin: 18 * 60,
      endMin: 24 * 60
    }
  };
}

describe("computeApplianceHourly", () => {
  it("handles scheduled windows crossing midnight", () => {
    const hourly = computeApplianceHourly(
      mkAppliance("night-device", {
        kind: "scheduled_window",
        watts: 600,
        startMin: 23 * 60 + 30,
        durationMin: 120
      })
    );

    approx(hourly[23] ?? 0, 0.3);
    approx(hourly[0] ?? 0, 0.6);
    approx(hourly[1] ?? 0, 0.3);
    approx(hourly.reduce((a, b) => a + b, 0), 1.2);
  });

  it("computes daily scheduled-window consumption without weekday weighting", () => {
    const hourly = computeApplianceHourly(
      mkAppliance("daily-device", {
        kind: "scheduled_window",
        watts: 700,
        startMin: 20 * 60,
        durationMin: 60
      })
    );

    approx(hourly[20] ?? 0, 0.7);
    approx(hourly.reduce((a, b) => a + b, 0), 0.7);
  });

  it("applies quantity multiplier", () => {
    const hourly = computeApplianceHourly({
      ...mkAppliance("mult", { kind: "always_on", watts: 100 }),
      quantity: 3
    });

    approx(hourly.reduce((a, b) => a + b, 0), 7.2);
  });

  it("clamps daily_duration to the provided window length", () => {
    const hourly = computeApplianceHourly(
      mkAppliance("clamped", {
        kind: "daily_duration",
        watts: 1000,
        minutesPerDay: 300,
        window: { startMin: 10 * 60, endMin: 12 * 60 }
      })
    );

    approx(hourly[10] ?? 0, 1);
    approx(hourly[11] ?? 0, 1);
    approx(hourly.reduce((a, b) => a + b, 0), 2);
  });

  it("returns zero for count_based with no schedule and no minutes", () => {
    const hourly = computeApplianceHourly(
      mkAppliance("count-zero", {
        kind: "count_based",
        count: 10,
        wattsEach: 9
      })
    );

    approx(hourly.reduce((a, b) => a + b, 0), 0);
  });

  it("returns zero for disabled appliances", () => {
    const hourly = computeApplianceHourly(mkAppliance("off", { kind: "always_on", watts: 100 }, false));
    approx(hourly.reduce((a, b) => a + b, 0), 0);
  });
});

describe("simulate", () => {
  it("aggregates totals and identifies peak hour", () => {
    const config: HouseholdConfig = {
      templateId: "t1",
      bedrooms: 1,
      occupants: 2,
      appliances: [
        mkAppliance("base", { kind: "always_on", watts: 100 }),
        mkAppliance("boost", { kind: "scheduled_window", watts: 900, startMin: 0, durationMin: 60 })
      ],
      producers: []
    };

    const result = simulate(config);

    approx(result.perApplianceDailyKwh.base ?? 0, 2.4);
    approx(result.perApplianceDailyKwh.boost ?? 0, 0.9);
    approx(result.totalDailyKwh, 3.3);
    approx(result.totalWeeklyKwh, 23.1);
    approx(result.totalMonthlyKwh, 100.32);
    expect(result.peakHour).toBe(0);
    approx(result.hourlyTotalsKwh[0] ?? 0, 1.0);
  });

  it("battery does not produce without excess producer energy", () => {
    const config: HouseholdConfig = {
      templateId: "t2",
      bedrooms: 1,
      occupants: 2,
      appliances: [mkAppliance("base", { kind: "always_on", watts: 500 })],
      producers: [mkBattery("b1")]
    };

    const result = simulate(config);
    approx(result.totalDailyProductionKwh, 0);
    approx(result.perProducerDailyKwh.b1 ?? 0, 0);
  });

  it("battery only discharges energy captured from daytime excess", () => {
    const config: HouseholdConfig = {
      templateId: "t3",
      bedrooms: 1,
      occupants: 2,
      appliances: [mkAppliance("base", { kind: "always_on", watts: 100 })],
      producers: [
        {
          id: "solar",
          name: "Solar",
          enabled: true,
          quantity: 1,
          icon: "solar-panel",
          model: { kind: "solar_curve", peakKw: 1.2, startMin: 8 * 60, endMin: 17 * 60 }
        },
        mkBattery("b2")
      ]
    };

    const result = simulate(config);

    expect((result.perProducerDailyKwh.b2 ?? 0) > 0).toBe(true);
    expect((result.perProducerDailyKwh.b2 ?? 0) <= 2).toBe(true);
  });
});
