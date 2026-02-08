import type { ApplianceIconId, ProducerIconId } from "../types/domain";

interface ApplianceIconProps {
  icon: ApplianceIconId | ProducerIconId;
}

const iconMap: Record<ApplianceIconId | ProducerIconId, string> = {
  fridge: "🧊",
  router: "📶",
  tv: "📺",
  dishwasher: "🍽️",
  "washing-machine": "🧺",
  lighting: "💡",
  ac: "❄️",
  oven: "🔥",
  stove: "🍳",
  shower: "🚿",
  heating: "🌡️",
  "cellphone-charger": "🔌",
  microwave: "📟",
  laptop: "💻",
  fan: "🌀",
  custom: "⚙️",
  "solar-panel": "☀️",
  battery: "🔋",
  "producer-custom": "⚡"
};

export function ApplianceIcon({ icon }: ApplianceIconProps) {
  return (
    <span className="appliance-icon" aria-hidden="true">
      {iconMap[icon]}
    </span>
  );
}
