import type { Producer } from "../types/domain";
import { ApplianceIcon } from "./ApplianceIcon";

interface ProducerRowProps {
  producer: Producer;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ProducerRow({ producer, onIncrement, onDecrement, onEdit, onToggleEnabled, onRemove }: ProducerRowProps) {
  return (
    <div className={`appliance-row ${producer.enabled ? "" : "is-disabled"}`} tabIndex={0}>
      <div className="appliance-row-main">
        <ApplianceIcon icon={producer.icon} />
        <strong>{producer.name}</strong>
        <span className="qty-pill">x{producer.quantity}</span>
      </div>
      <div className="row-actions always-visible">
        <button
          type="button"
          className="icon-action-btn"
          onClick={() => onDecrement(producer.id)}
          aria-label={`Decrease ${producer.name}`}
          title={`Decrease ${producer.name}`}
        >
          -
        </button>
        <button
          type="button"
          className="icon-action-btn"
          onClick={() => onIncrement(producer.id)}
          aria-label={`Increase ${producer.name}`}
          title={`Increase ${producer.name}`}
        >
          +
        </button>
        <button
          type="button"
          className="icon-edit-btn"
          onClick={() => onEdit(producer.id)}
          aria-label={`Edit ${producer.name}`}
          title={`Edit ${producer.name}`}
        >
          E
        </button>
        <button
          type="button"
          className="icon-edit-btn"
          onClick={() => onToggleEnabled(producer.id)}
          aria-label={`${producer.enabled ? "Disable" : "Enable"} ${producer.name}`}
          title={`${producer.enabled ? "Disable" : "Enable"} ${producer.name}`}
        >
          {producer.enabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          className="icon-delete-btn"
          onClick={() => onRemove(producer.id)}
          aria-label={`Remove ${producer.name}`}
          title={`Remove ${producer.name}`}
        >
          X
        </button>
      </div>
    </div>
  );
}
