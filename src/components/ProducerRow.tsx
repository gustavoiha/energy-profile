import type { Producer } from "../types/domain";
import { ApplianceIcon } from "./ApplianceIcon";

interface ProducerRowProps {
  producer: Producer;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export function ProducerRow({ producer, onIncrement, onDecrement }: ProducerRowProps) {
  return (
    <div className="appliance-row" tabIndex={0}>
      <div className="appliance-row-main">
        <ApplianceIcon icon={producer.icon} />
        <strong>{producer.name}</strong>
        <span className="qty-pill">x{producer.quantity}</span>
      </div>
      <div className="row-actions">
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
      </div>
    </div>
  );
}
