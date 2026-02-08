import type { ApplianceIconId } from "../types/domain";

interface ApplianceIconProps {
  icon: ApplianceIconId;
}

const iconMap: Record<ApplianceIconId, string> = {
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
  custom: "⚙️"
};

export function ApplianceIcon({ icon }: ApplianceIconProps) {
  return (
    <span className="appliance-icon" aria-hidden="true">
      {iconMap[icon]}
    </span>
  );
}
