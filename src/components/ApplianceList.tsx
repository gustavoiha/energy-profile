import type { Appliance } from "../types/domain";
import { ApplianceRow } from "./ApplianceRow";

interface ApplianceListProps {
  appliances: Appliance[];
  onEdit: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ApplianceList({ appliances, onEdit, onIncrement, onDecrement, onToggleEnabled, onRemove }: ApplianceListProps) {
  return (
    <div className="appliance-list">
      {appliances.map((appliance) => (
        <ApplianceRow
          key={appliance.id}
          appliance={appliance}
          onEdit={onEdit}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onToggleEnabled={onToggleEnabled}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
