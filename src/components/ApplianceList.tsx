import type { Appliance } from "../types/domain";
import { ApplianceRow } from "./ApplianceRow";

interface ApplianceListProps {
  appliances: Appliance[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ApplianceList({ appliances, onToggle, onEdit, onDelete }: ApplianceListProps) {
  return (
    <div className="appliance-list">
      {appliances.map((appliance) => (
        <ApplianceRow
          key={appliance.id}
          appliance={appliance}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
