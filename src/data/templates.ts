import type { HouseholdTemplate } from "../types/domain";
import { appliancePresets, createApplianceFromPreset } from "./appliancePresets";

const byId = new Map(appliancePresets.map((preset) => [preset.id, preset]));

function pick(id: string) {
  const preset = byId.get(id);
  if (!preset) {
    throw new Error(`Missing preset: ${id}`);
  }
  return createApplianceFromPreset(preset, `${id}-base`);
}

export const householdTemplates: HouseholdTemplate[] = [
  {
    id: "starter-flat",
    name: "Starter Flat",
    bedrooms: 1,
    occupants: 2,
    appliances: [pick("fridge"), pick("router"), pick("tv"), pick("lighting"), pick("washing-machine")]
  },
  {
    id: "family-home",
    name: "Family Home",
    bedrooms: 3,
    occupants: 4,
    appliances: [pick("fridge"), pick("router"), pick("tv"), pick("lighting"), pick("dishwasher"), pick("washing-machine"), pick("ac")]
  },
  {
    id: "high-efficiency",
    name: "High Efficiency",
    bedrooms: 2,
    occupants: 3,
    appliances: [
      { ...pick("fridge"), model: { kind: "always_on", watts: 70 } },
      pick("router"),
      {
        ...pick("tv"),
        model: {
          kind: "scheduled_window",
          watts: 80,
          startMin: 19 * 60,
          durationMin: 180
        }
      },
      { ...pick("lighting"), model: { kind: "count_based", count: 8, wattsEach: 7, schedule: { startMin: 18 * 60, endMin: 22 * 60 } } },
      {
        ...pick("washing-machine"),
        model: {
          kind: "scheduled_window",
          watts: 600,
          startMin: 19 * 60,
          durationMin: 70
        }
      }
    ]
  }
];
