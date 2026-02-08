import type { Appliance } from "../types/domain";
import { ApplianceList } from "./ApplianceList";

interface SidebarProps {
  appliances: Appliance[];
  onEdit: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onOpenAddDialog: () => void;
  onOpenTemplates: () => void;
}

export function Sidebar({
  appliances,
  onEdit,
  onIncrement,
  onDecrement,
  onOpenAddDialog,
  onOpenTemplates
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Appliances</h3>
        <p>{appliances.length} total items</p>
      </div>

      <ApplianceList appliances={appliances} onEdit={onEdit} onIncrement={onIncrement} onDecrement={onDecrement} />

      <div className="sidebar-footer">
        <button type="button" className="add-btn" onClick={onOpenAddDialog}>
          + Add Appliance
        </button>
        <button type="button" className="secondary-btn" onClick={onOpenTemplates}>
          Household Templates
        </button>
      </div>
    </aside>
  );
}
