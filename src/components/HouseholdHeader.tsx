import type { HouseholdConfig } from "../types/domain";

interface HouseholdHeaderProps {
  config: HouseholdConfig;
  onReset: () => void;
}

export function HouseholdHeader({ config, onReset }: HouseholdHeaderProps) {
  return (
    <div className="household-header">
      <div>
        <h2>Template: {config.templateId}</h2>
        <p>
          {config.bedrooms} bedrooms | {config.occupants} occupants
        </p>
      </div>
      <button type="button" onClick={onReset}>
        Back To Templates
      </button>
    </div>
  );
}
