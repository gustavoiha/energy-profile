import type { Appliance, Producer } from "../types/domain";
import { ApplianceList } from "./ApplianceList";
import { ProducerList } from "./ProducerList";

interface SidebarProps {
  appliances: Appliance[];
  producers: Producer[];
  onEdit: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onRemove: (id: string) => void;
  onEditProducer: (id: string) => void;
  onIncrementProducer: (id: string) => void;
  onDecrementProducer: (id: string) => void;
  onToggleProducerEnabled: (id: string) => void;
  onRemoveProducer: (id: string) => void;
  onOpenAddDialog: () => void;
  onOpenAddProducerDialog: () => void;
  onOpenTemplates: () => void;
}

export function Sidebar({
  appliances,
  producers,
  onEdit,
  onIncrement,
  onDecrement,
  onToggleEnabled,
  onRemove,
  onEditProducer,
  onIncrementProducer,
  onDecrementProducer,
  onToggleProducerEnabled,
  onRemoveProducer,
  onOpenAddDialog,
  onOpenAddProducerDialog,
  onOpenTemplates
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <section className="sidebar-top">
        <div className="sidebar-header">
          <h3>Appliances</h3>
          <p>{appliances.length} total items</p>
        </div>

        <ApplianceList
          appliances={appliances}
          onEdit={onEdit}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onToggleEnabled={onToggleEnabled}
          onRemove={onRemove}
        />
      </section>

      <section className="sidebar-bottom">
        <div className="sidebar-header producers-header">
          <h3>Producers</h3>
          <p>{producers.length} total items</p>
        </div>

        <ProducerList
          producers={producers}
          onIncrement={onIncrementProducer}
          onDecrement={onDecrementProducer}
          onEdit={onEditProducer}
          onToggleEnabled={onToggleProducerEnabled}
          onRemove={onRemoveProducer}
        />

        <div className="sidebar-footer">
          <button type="button" className="add-btn" onClick={onOpenAddDialog}>
            + Add Appliance
          </button>
          <button type="button" className="add-btn" onClick={onOpenAddProducerDialog}>
            + Add Producer
          </button>
          <button type="button" className="secondary-btn" onClick={onOpenTemplates}>
            Household Templates
          </button>
        </div>
      </section>
    </aside>
  );
}
