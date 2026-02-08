export type ApplianceIconId =
  | "fridge"
  | "router"
  | "tv"
  | "dishwasher"
  | "washing-machine"
  | "lighting"
  | "ac"
  | "oven"
  | "stove"
  | "shower"
  | "heating"
  | "cellphone-charger"
  | "microwave"
  | "laptop"
  | "fan"
  | "custom";

export type ProducerIconId = "solar-panel" | "battery" | "producer-custom";

export type ApplianceModel =
  | { kind: "always_on"; watts: number }
  | {
      kind: "scheduled_window";
      watts: number;
      startMin: number;
      durationMin: number;
    }
  | {
      kind: "daily_duration";
      watts: number;
      minutesPerDay: number;
      window?: { startMin: number; endMin: number };
    }
  | {
      kind: "count_based";
      count: number;
      wattsEach: number;
      minutesPerDay?: number;
      schedule?: { startMin: number; endMin: number };
    };

export type BatteryStrategy = "self_consumption" | "peak_shaving";

export type ProducerModel =
  | {
      kind: "solar_curve";
      peakKw: number;
      startMin: number;
      endMin: number;
    }
  | {
      kind: "battery_discharge";
      capacityKwh: number;
      maxOutputKw: number;
      startMin: number;
      endMin: number;
      strategy?: BatteryStrategy;
    };

export interface Appliance {
  id: string;
  name: string;
  enabled: boolean;
  quantity: number;
  icon: ApplianceIconId;
  presetId?: string;
  model: ApplianceModel;
}

export interface Producer {
  id: string;
  name: string;
  enabled: boolean;
  quantity: number;
  icon: ProducerIconId;
  presetId?: string;
  model: ProducerModel;
}

export type DayType = "weekday" | "weekend";
export type Season = "summer" | "winter";

export interface HouseholdProfile {
  dayType: DayType;
  season: Season;
}

export interface TariffWindow {
  id: string;
  startMin: number;
  endMin: number;
  ratePerKwh: number;
  dayTypes?: DayType[];
  seasons?: Season[];
}

export interface FlatTariff {
  kind: "flat";
  currency: string;
  ratePerKwh: number;
  sellBackRatePerKwh?: number;
}

export interface TimeOfUseTariff {
  kind: "tou";
  currency: string;
  defaultRatePerKwh: number;
  sellBackRatePerKwh?: number;
  windows: TariffWindow[];
}

export type TariffModel = FlatTariff | TimeOfUseTariff;

export interface HouseholdTemplate {
  id: string;
  name: string;
  bedrooms: number;
  occupants: number;
  appliances: Appliance[];
  producers: Producer[];
}

export interface HouseholdConfig {
  templateId: string;
  bedrooms: number;
  occupants: number;
  appliances: Appliance[];
  producers: Producer[];
  profile: HouseholdProfile;
  tariff: TariffModel;
}

export interface SavingsAction {
  applianceId: string;
  applianceName: string;
  modelKind: ApplianceModel["kind"];
  fromStartMin: number;
  toStartMin: number;
  estimatedDailySavings: number;
  reason: string;
}

export interface SimulationResult {
  hourlyTotalsKwh: number[];
  hourlyConsumptionKwh: number[];
  hourlyProductionKwh: number[];
  hourlyImportKwh: number[];
  hourlyExportKwh: number[];
  hourlyCost: number[];
  perApplianceHourlyKwh: Record<string, number[]>;
  perApplianceDailyKwh: Record<string, number>;
  perApplianceDailyCost: Record<string, number>;
  perProducerHourlyKwh: Record<string, number[]>;
  perProducerDailyKwh: Record<string, number>;
  perProducerDailyCost: Record<string, number>;
  totalDailyConsumptionKwh: number;
  totalDailyProductionKwh: number;
  totalDailyKwh: number;
  totalWeeklyKwh: number;
  totalMonthlyKwh: number;
  totalDailyCost: number;
  totalWeeklyCost: number;
  totalMonthlyCost: number;
  totalDailySavings: number;
  totalWeeklySavings: number;
  totalMonthlySavings: number;
  peakHour: number;
  savingsActions?: SavingsAction[];
}
