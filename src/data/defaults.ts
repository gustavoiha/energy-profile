import type { HouseholdProfile, TariffModel, TimeOfUseTariff } from "../types/domain";

export function defaultProfile(): HouseholdProfile {
  return {
    dayType: "weekday",
    season: "summer"
  };
}

export function defaultFlatTariff(): TariffModel {
  return {
    kind: "flat",
    currency: "USD",
    ratePerKwh: 0.18,
    sellBackRatePerKwh: 0.06
  };
}

export function defaultTimeOfUseTariff(): TimeOfUseTariff {
  return {
    kind: "tou",
    currency: "USD",
    defaultRatePerKwh: 0.16,
    sellBackRatePerKwh: 0.06,
    windows: [
      {
        id: "tou-offpeak",
        startMin: 0,
        endMin: 7 * 60,
        ratePerKwh: 0.11,
        dayTypes: ["weekday", "weekend"],
        seasons: ["summer", "winter"]
      },
      {
        id: "tou-peak",
        startMin: 17 * 60,
        endMin: 22 * 60,
        ratePerKwh: 0.28,
        dayTypes: ["weekday"],
        seasons: ["summer", "winter"]
      }
    ]
  };
}
