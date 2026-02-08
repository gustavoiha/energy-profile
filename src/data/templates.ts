import type { HouseholdTemplate } from "../types/domain";
import { appliancePresets, createApplianceFromPreset } from "./appliancePresets";
import { createProducerFromPreset, producerPresets } from "./producerPresets";

const applianceById = new Map(appliancePresets.map((preset) => [preset.id, preset]));
const producerById = new Map(producerPresets.map((preset) => [preset.id, preset]));

function pickAppliance(id: string) {
  const preset = applianceById.get(id);
  if (!preset) {
    throw new Error(`Missing appliance preset: ${id}`);
  }
  return createApplianceFromPreset(preset, `${id}-base`);
}

function pickProducer(id: string) {
  const preset = producerById.get(id);
  if (!preset) {
    throw new Error(`Missing producer preset: ${id}`);
  }
  return createProducerFromPreset(preset, `${id}-base`);
}

export const householdTemplates: HouseholdTemplate[] = [
  {
    id: "starter-flat",
    name: "Starter Flat",
    bedrooms: 1,
    occupants: 2,
    appliances: [pickAppliance("fridge"), pickAppliance("router"), pickAppliance("tv"), pickAppliance("lighting"), pickAppliance("washing-machine")],
    producers: []
  },
  {
    id: "family-home",
    name: "Family Home",
    bedrooms: 3,
    occupants: 4,
    appliances: [
      pickAppliance("fridge"),
      pickAppliance("router"),
      pickAppliance("tv"),
      pickAppliance("lighting"),
      pickAppliance("dishwasher"),
      pickAppliance("washing-machine"),
      pickAppliance("ac")
    ],
    producers: [pickProducer("small-solar-panel"), pickProducer("small-battery")]
  },
  {
    id: "high-efficiency",
    name: "High Efficiency",
    bedrooms: 2,
    occupants: 3,
    appliances: [
      { ...pickAppliance("fridge"), model: { kind: "always_on", watts: 70 } },
      pickAppliance("router"),
      {
        ...pickAppliance("tv"),
        model: {
          kind: "scheduled_window",
          watts: 80,
          startMin: 19 * 60,
          durationMin: 180
        }
      },
      {
        ...pickAppliance("lighting"),
        model: { kind: "count_based", count: 8, wattsEach: 7, schedule: { startMin: 18 * 60, endMin: 22 * 60 } }
      },
      {
        ...pickAppliance("washing-machine"),
        model: {
          kind: "scheduled_window",
          watts: 600,
          startMin: 19 * 60,
          durationMin: 70
        }
      }
    ],
    producers: [pickProducer("medium-solar-panel")]
  }
];
