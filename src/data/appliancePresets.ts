import type { Appliance, ApplianceCategory, ApplianceModel, Weekday } from "../types/domain";

interface Preset {
  id: string;
  name: string;
  category: ApplianceCategory;
  model: ApplianceModel;
}

const allWeekdays: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const appliancePresets: Preset[] = [
  {
    id: "fridge",
    name: "Fridge",
    category: "kitchen",
    model: { kind: "always_on", watts: 90 }
  },
  {
    id: "router",
    name: "Router",
    category: "network",
    model: { kind: "always_on", watts: 10 }
  },
  {
    id: "tv",
    name: "TV",
    category: "entertainment",
    model: {
      kind: "scheduled_window",
      watts: 100,
      startMin: 19 * 60,
      durationMin: 180,
      weekdays: allWeekdays
    }
  },
  {
    id: "dishwasher",
    name: "Dishwasher",
    category: "kitchen",
    model: {
      kind: "scheduled_window",
      watts: 800,
      startMin: 20 * 60,
      durationMin: 90,
      weekdays: ["monday", "wednesday", "friday", "saturday"]
    }
  },
  {
    id: "washing-machine",
    name: "Washing Machine",
    category: "laundry",
    model: {
      kind: "scheduled_window",
      watts: 640,
      startMin: 19 * 60,
      durationMin: 75,
      weekdays: ["tuesday", "thursday", "saturday"]
    }
  },
  {
    id: "lighting",
    name: "Lighting",
    category: "lighting",
    model: {
      kind: "count_based",
      count: 10,
      wattsEach: 9,
      schedule: { startMin: 18 * 60, endMin: 23 * 60 }
    }
  },
  {
    id: "ac",
    name: "Air Conditioner",
    category: "hvac",
    model: {
      kind: "daily_duration",
      watts: 1500,
      minutesPerDay: 240,
      window: { startMin: 13 * 60, endMin: 23 * 60 }
    }
  }
];

export function createApplianceFromPreset(preset: Preset, id: string): Appliance {
  return {
    id,
    name: preset.name,
    category: preset.category,
    enabled: true,
    model: structuredClone(preset.model)
  };
}
