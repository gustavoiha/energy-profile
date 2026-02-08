export type ApplianceCategory =
  | "lighting"
  | "kitchen"
  | "laundry"
  | "entertainment"
  | "network"
  | "hvac"
  | "other";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ApplianceModel =
  | { kind: "always_on"; watts: number }
  | {
      kind: "scheduled_window";
      watts: number;
      startMin: number;
      durationMin: number;
      weekdays: Weekday[];
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

export interface Appliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  enabled: boolean;
  model: ApplianceModel;
}

export interface HouseholdTemplate {
  id: string;
  name: string;
  bedrooms: number;
  occupants: number;
  appliances: Appliance[];
}

export interface HouseholdConfig {
  templateId: string;
  bedrooms: number;
  occupants: number;
  appliances: Appliance[];
}

export interface SimulationResult {
  hourlyTotalsKwh: number[];
  perApplianceHourlyKwh: Record<string, number[]>;
  perApplianceDailyKwh: Record<string, number>;
  totalDailyKwh: number;
  totalWeeklyKwh: number;
  totalMonthlyKwh: number;
  peakHour: number;
}
