import type { Appliance } from "../types/domain";
import { ApplianceIcon } from "./ApplianceIcon";

interface ApplianceRowProps {
  appliance: Appliance;
  onEdit: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ApplianceRow({ appliance, onEdit, onIncrement, onDecrement, onToggleEnabled, onRemove }: ApplianceRowProps) {
  return (
    <div className={`appliance-row ${appliance.enabled ? "" : "is-disabled"}`} tabIndex={0}>
      <div className="appliance-row-main">
        <ApplianceIcon icon={appliance.icon} />
        <strong>{appliance.name}</strong>
        <span className="qty-pill">x{appliance.quantity}</span>
      </div>
      <div className="row-actions always-visible">
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
          E
        </button>
        <button
          type="button"
          className="icon-edit-btn"
          onClick={() => onToggleEnabled(appliance.id)}
          aria-label={`${appliance.enabled ? "Disable" : "Enable"} ${appliance.name}`}
          title={`${appliance.enabled ? "Disable" : "Enable"} ${appliance.name}`}
        >
          {appliance.enabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          className="icon-delete-btn"
          onClick={() => onRemove(appliance.id)}
          aria-label={`Remove ${appliance.name}`}
          title={`Remove ${appliance.name}`}
        >
          X
        </button>
      </div>
    </div>
  );
}
