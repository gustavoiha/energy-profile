import type { Appliance } from "../types/domain";
import { ApplianceIcon } from "./ApplianceIcon";

interface ApplianceRowProps {
  appliance: Appliance;
  onEdit: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export function ApplianceRow({ appliance, onEdit, onIncrement, onDecrement }: ApplianceRowProps) {
  return (
    <div className="appliance-row" tabIndex={0}>
      <div className="appliance-row-main">
        <ApplianceIcon icon={appliance.icon} />
        <strong>{appliance.name}</strong>
        <span className="qty-pill">x{appliance.quantity}</span>
      </div>
      <div className="row-actions">
        <button
          type="button"
          className="icon-action-btn"
          onClick={() => onDecrement(appliance.id)}
          aria-label={`Decrease ${appliance.name}`}
          title={`Decrease ${appliance.name}`}
        >
          -
        </button>
        <button
          type="button"
          className="icon-action-btn"
          onClick={() => onIncrement(appliance.id)}
          aria-label={`Increase ${appliance.name}`}
          title={`Increase ${appliance.name}`}
        >
          +
        </button>
        <button
          type="button"
          className="icon-edit-btn"
          onClick={() => onEdit(appliance.id)}
          aria-label={`Edit ${appliance.name}`}
          title={`Edit ${appliance.name}`}
        >
          ✎
        </button>
      </div>
    </div>
  );
}
