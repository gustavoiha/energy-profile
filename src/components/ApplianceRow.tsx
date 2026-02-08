import type { Appliance } from "../types/domain";

interface ApplianceRowProps {
  appliance: Appliance;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ApplianceRow({ appliance, onToggle, onEdit, onDelete }: ApplianceRowProps) {
  return (
    <div className="appliance-row">
      <div className="appliance-row-main">
        <input type="checkbox" checked={appliance.enabled} onChange={() => onToggle(appliance.id)} />
        <div>
          <strong>{appliance.name}</strong>
          <p>{appliance.category}</p>
        </div>
      </div>
      <div className="appliance-row-actions">
        <button type="button" onClick={() => onEdit(appliance.id)}>
          Edit
        </button>
        <button type="button" className="danger" onClick={() => onDelete(appliance.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}
