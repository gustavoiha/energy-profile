import type { Appliance, ApplianceIconId, ApplianceModel } from "../types/domain";

export interface AppliancePreset {
  id: string;
  name: string;
  icon: ApplianceIconId;
  model: ApplianceModel;
}

export const appliancePresets: AppliancePreset[] = [
  {
    id: "fridge",
    name: "Fridge",
    icon: "fridge",
    model: { kind: "always_on", watts: 90 }
  },
  {
    id: "router",
    name: "Router",
    icon: "router",
    model: { kind: "always_on", watts: 10 }
  },
  {
    id: "tv",
    name: "TV",
    icon: "tv",
    model: {
      kind: "scheduled_window",
      watts: 100,
      startMin: 19 * 60,
      durationMin: 180
    }
  },
  {
    id: "dishwasher",
    name: "Dishwasher",
    icon: "dishwasher",
    model: {
      kind: "scheduled_window",
      watts: 800,
      startMin: 20 * 60,
      durationMin: 90
    }
  },
  {
    id: "washing-machine",
    name: "Washing Machine",
    icon: "washing-machine",
    model: {
      kind: "scheduled_window",
      watts: 640,
      startMin: 19 * 60,
      durationMin: 75
    }
  },
  {
    id: "lighting",
    name: "Lighting",
    icon: "lighting",
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
    icon: "ac",
    model: {
      kind: "daily_duration",
      watts: 1500,
      minutesPerDay: 240,
      window: { startMin: 13 * 60, endMin: 23 * 60 }
    }
  },
  {
    id: "oven",
    name: "Oven",
    icon: "oven",
    model: {
      kind: "scheduled_window",
      watts: 2200,
      startMin: 18 * 60,
      durationMin: 60
    }
  },
  {
    id: "stove",
    name: "Stove",
    icon: "stove",
    model: {
      kind: "scheduled_window",
      watts: 1800,
      startMin: 12 * 60,
      durationMin: 45
    }
  },
  {
    id: "shower",
    name: "Electric Shower",
    icon: "shower",
    model: {
      kind: "scheduled_window",
      watts: 4500,
      startMin: 7 * 60,
      durationMin: 25
    }
  },
  {
    id: "heating",
    name: "Space Heating",
    icon: "heating",
    model: {
      kind: "daily_duration",
      watts: 1800,
      minutesPerDay: 300,
      window: { startMin: 6 * 60, endMin: 23 * 60 }
    }
  },
  {
    id: "cellphone-charger",
    name: "Cellphone Charger",
    icon: "cellphone-charger",
    model: {
      kind: "count_based",
      count: 2,
      wattsEach: 8,
      schedule: { startMin: 22 * 60, endMin: 24 * 60 }
    }
  },
  {
    id: "microwave",
    name: "Microwave",
    icon: "microwave",
    model: {
      kind: "scheduled_window",
      watts: 1200,
      startMin: 13 * 60,
      durationMin: 15
    }
  },
  {
    id: "laptop",
    name: "Laptop",
    icon: "laptop",
    model: {
      kind: "scheduled_window",
      watts: 65,
      startMin: 9 * 60,
      durationMin: 360
    }
  },
  {
    id: "fan",
    name: "Fan",
    icon: "fan",
    model: {
      kind: "daily_duration",
      watts: 70,
      minutesPerDay: 420,
      window: { startMin: 12 * 60, endMin: 24 * 60 }
    }
  }
];

export function createApplianceFromPreset(preset: AppliancePreset, id: string): Appliance {
  return {
    id,
    name: preset.name,
    enabled: true,
    quantity: 1,
    icon: preset.icon,
    presetId: preset.id,
    model: structuredClone(preset.model)
  };
}
