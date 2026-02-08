import type { Producer, ProducerIconId, ProducerModel } from "../types/domain";

export interface ProducerPreset {
  id: string;
  name: string;
  icon: ProducerIconId;
  model: ProducerModel;
}

export const producerPresets: ProducerPreset[] = [
  {
    id: "small-solar-panel",
    name: "Small Solar Panel",
    icon: "solar-panel",
    model: {
      kind: "solar_curve",
      peakKw: 0.8,
      startMin: 7 * 60,
      endMin: 18 * 60
    }
  },
  {
    id: "small-battery",
    name: "Small Battery",
    icon: "battery",
    model: {
      kind: "battery_discharge",
      capacityKwh: 2.5,
      maxOutputKw: 0.6,
      startMin: 18 * 60,
      endMin: 24 * 60
    }
  },
  {
    id: "medium-solar-panel",
    name: "Medium Solar Panel",
    icon: "solar-panel",
    model: {
      kind: "solar_curve",
      peakKw: 1.6,
      startMin: 7 * 60,
      endMin: 18 * 60
    }
  }
];

export function createProducerFromPreset(preset: ProducerPreset, id: string): Producer {
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
