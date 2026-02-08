import type { Appliance } from "../types/domain";
import { ApplianceRow } from "./ApplianceRow";

interface ApplianceListProps {
  appliances: Appliance[];
  onEdit: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export function ApplianceList({ appliances, onEdit, onIncrement, onDecrement }: ApplianceListProps) {
  return (
    <div className="appliance-list">
      {appliances.map((appliance) => (
        <ApplianceRow
          key={appliance.id}
          appliance={appliance}
          onEdit={onEdit}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      ))}
    </div>
  );
}
