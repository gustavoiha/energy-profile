import type { Appliance } from "../types/domain";
import { AddApplianceButton } from "./AddApplianceButton";
import { ApplianceList } from "./ApplianceList";

interface SidebarProps {
  appliances: Appliance[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onOpenTemplates: () => void;
}

export function Sidebar({ appliances, onToggle, onEdit, onDelete, onAdd, onOpenTemplates }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Appliances</h3>
        <p>{appliances.length} total items</p>
      </div>
      <ApplianceList appliances={appliances} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      <div className="sidebar-footer">
        <AddApplianceButton onClick={onAdd} />
        <button type="button" className="secondary-btn" onClick={onOpenTemplates}>
          Household Templates
        </button>
      </div>
    </aside>
  );
}
