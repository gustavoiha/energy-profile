import { describe, expect, it } from "vitest";
import { compareSimulation, computeApplianceHourly, simulate } from "./simulate";
import type { Appliance, ApplianceModel, HouseholdConfig, Producer, TariffModel } from "../types/domain";

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

function mkBattery(id: string, strategy: "self_consumption" | "peak_shaving" = "self_consumption"): Producer {
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
      startMin: 12 * 60,
      endMin: 24 * 60,
      strategy
    }
  };
}

function configWith(
  appliances: Appliance[],
  producers: Producer[],
  tariff: TariffModel = { kind: "flat", currency: "USD", ratePerKwh: 0.2, sellBackRatePerKwh: 0 }
): HouseholdConfig {
  return {
    templateId: "t",
    bedrooms: 1,
    occupants: 2,
    profile: { dayType: "weekday", season: "summer" },
    tariff,
    appliances,
    producers
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
    const config = configWith(
      [
        mkAppliance("base", { kind: "always_on", watts: 100 }),
        mkAppliance("boost", { kind: "scheduled_window", watts: 900, startMin: 0, durationMin: 60 })
      ],
      []
    );

    const result = simulate(config);

    approx(result.perApplianceDailyKwh.base ?? 0, 2.4);
    approx(result.perApplianceDailyKwh.boost ?? 0, 0.9);
    approx(result.totalDailyKwh, 3.3);
    approx(result.totalWeeklyKwh, 23.1);
    approx(result.totalMonthlyKwh, 100.32);
    expect(result.peakHour).toBe(0);
    approx(result.hourlyTotalsKwh[0] ?? 0, 1.0);
  });

  it("computes flat tariff cost", () => {
    const config = configWith([mkAppliance("base", { kind: "always_on", watts: 100 })], []);
    const result = simulate(config);

    approx(result.totalDailyConsumptionKwh, 2.4);
    approx(result.totalDailyCost, 0.48);
    approx(result.totalMonthlyCost, 14.592);
    approx(result.totalMonthlySavings, 0);
  });

  it("computes TOU windows crossing midnight", () => {
    const tou: TariffModel = {
      kind: "tou",
      currency: "USD",
      defaultRatePerKwh: 0.1,
      windows: [
        {
          id: "peak-cross-midnight",
          startMin: 22 * 60,
          endMin: 2 * 60,
          ratePerKwh: 0.5,
          dayTypes: ["weekday", "weekend"],
          seasons: ["summer", "winter"]
        }
      ]
    };

    const config = configWith(
      [
        mkAppliance("late", {
          kind: "scheduled_window",
          watts: 1000,
          startMin: 23 * 60,
          durationMin: 120
        })
      ],
      [],
      tou
    );

    const result = simulate(config);
    approx(result.totalDailyKwh, 2);
    approx(result.totalDailyCost, 1);
  });

  it("battery does not produce without excess producer energy", () => {
    const config = configWith([mkAppliance("base", { kind: "always_on", watts: 500 })], [mkBattery("b1")]);

    const result = simulate(config);
    approx(result.totalDailyProductionKwh, 0);
    approx(result.perProducerDailyKwh.b1 ?? 0, 0);
  });

  it("battery only discharges energy captured from daytime excess", () => {
    const config = configWith(
      [mkAppliance("base", { kind: "always_on", watts: 100 })],
      [
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
    );

    const result = simulate(config);

    expect((result.perProducerDailyKwh.b2 ?? 0) > 0).toBe(true);
    expect((result.perProducerDailyKwh.b2 ?? 0) <= 2).toBe(true);
  });

  it("reports monthly savings from producers separately from monthly cost", () => {
    const config = configWith(
      [mkAppliance("base", { kind: "always_on", watts: 300 })],
      [
        {
          id: "solar",
          name: "Solar",
          enabled: true,
          quantity: 1,
          icon: "solar-panel",
          model: { kind: "solar_curve", peakKw: 0.8, startMin: 8 * 60, endMin: 17 * 60 }
        }
      ],
      { kind: "flat", currency: "USD", ratePerKwh: 0.22, sellBackRatePerKwh: 0.05 }
    );

    const result = simulate(config);
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
    expect(result.totalMonthlySavings).not.toBeCloseTo(result.totalMonthlyCost, 8);
  });

  it("peak-shaving battery strategy reduces cost at high-rate windows", () => {
    const tou: TariffModel = {
      kind: "tou",
      currency: "USD",
      defaultRatePerKwh: 0.05,
      windows: [
        {
          id: "peak",
          startMin: 19 * 60,
          endMin: 22 * 60,
          ratePerKwh: 0.7,
          dayTypes: ["weekday", "weekend"],
          seasons: ["summer", "winter"]
        }
      ]
    };

    const appliances = [mkAppliance("base", { kind: "always_on", watts: 1200 })];
    const solar: Producer = {
      id: "solar",
      name: "Solar",
      enabled: true,
      quantity: 1,
      icon: "solar-panel",
      model: {
        kind: "solar_curve",
        peakKw: 3.6,
        startMin: 8 * 60,
        endMin: 17 * 60
      }
    };

    const selfResult = simulate(configWith(appliances, [solar, mkBattery("self", "self_consumption")], tou));
    const peakResult = simulate(configWith(appliances, [solar, mkBattery("peak", "peak_shaving")], tou));

    expect(peakResult.totalDailyCost).toBeLessThan(selfResult.totalDailyCost);
  });

  it("compareSimulation returns consistent deltas", () => {
    const baseline = simulate(configWith([mkAppliance("base", { kind: "always_on", watts: 200 })], []));
    const current = simulate(configWith([mkAppliance("base", { kind: "always_on", watts: 100 })], []));

    const delta = compareSimulation(current, baseline);
    approx(delta.dailyKwhDelta, current.totalDailyKwh - baseline.totalDailyKwh);
    approx(delta.monthlyCostDelta, current.totalMonthlyCost - baseline.totalMonthlyCost);
  });

  it("suggestions keep shifted starts within allowed window", () => {
    const tou: TariffModel = {
      kind: "tou",
      currency: "USD",
      defaultRatePerKwh: 0.1,
      windows: [
        {
          id: "peak-evening",
          startMin: 18 * 60,
          endMin: 22 * 60,
          ratePerKwh: 0.35,
          dayTypes: ["weekday", "weekend"],
          seasons: ["summer", "winter"]
        }
      ]
    };

    const config = configWith(
      [
        mkAppliance("washer", {
          kind: "daily_duration",
          watts: 1200,
          minutesPerDay: 120,
          window: { startMin: 8 * 60, endMin: 22 * 60 }
        })
      ],
      [],
      tou
    );

    const result = simulate(config);
    for (const action of result.savingsActions ?? []) {
      expect(action.toStartMin).toBeGreaterThanOrEqual(8 * 60);
      expect(action.toStartMin).toBeLessThanOrEqual(22 * 60);
      expect(action.estimatedDailySavings).toBeGreaterThan(0);
    }
  });
});
