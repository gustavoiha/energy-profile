import type { Producer } from "../types/domain";
import { ProducerRow } from "./ProducerRow";

interface ProducerListProps {
  producers: Producer[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ProducerList({ producers, onIncrement, onDecrement, onEdit, onToggleEnabled, onRemove }: ProducerListProps) {
  return (
    <div className="appliance-list">
      {producers.map((producer) => (
        <ProducerRow
          key={producer.id}
          producer={producer}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onEdit={onEdit}
          onToggleEnabled={onToggleEnabled}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
