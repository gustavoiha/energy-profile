import type { Producer } from "../types/domain";
import { ProducerRow } from "./ProducerRow";

interface ProducerListProps {
  producers: Producer[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export function ProducerList({ producers, onIncrement, onDecrement }: ProducerListProps) {
  return (
    <div className="appliance-list">
      {producers.map((producer) => (
        <ProducerRow key={producer.id} producer={producer} onIncrement={onIncrement} onDecrement={onDecrement} />
      ))}
    </div>
  );
}
