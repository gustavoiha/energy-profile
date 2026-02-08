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
}

export interface SimulationResult {
  hourlyTotalsKwh: number[];
  hourlyConsumptionKwh: number[];
  hourlyProductionKwh: number[];
  perApplianceHourlyKwh: Record<string, number[]>;
  perApplianceDailyKwh: Record<string, number>;
  perProducerHourlyKwh: Record<string, number[]>;
  perProducerDailyKwh: Record<string, number>;
  totalDailyConsumptionKwh: number;
  totalDailyProductionKwh: number;
  totalDailyKwh: number;
  totalWeeklyKwh: number;
  totalMonthlyKwh: number;
  peakHour: number;
}
