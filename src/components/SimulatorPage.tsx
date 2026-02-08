import { useMemo } from "react";
import { simulate } from "../sim/simulate";
import type { Appliance, HouseholdConfig } from "../types/domain";
import { MainPanel } from "./MainPanel";
import { Sidebar } from "./Sidebar";

interface SimulatorPageProps {
  config: HouseholdConfig;
  onToggle: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenTemplates: () => void;
}

export function SimulatorPage({ config, onToggle, onAdd, onEdit, onDelete, onOpenTemplates }: SimulatorPageProps) {
  const sim = useMemo(() => simulate(config), [config]);

  return (
    <div className="simulator-page">
      <div className="sim-layout">
        <Sidebar
          appliances={config.appliances as Appliance[]}
          onToggle={onToggle}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenTemplates={onOpenTemplates}
        />
        <MainPanel appliances={config.appliances} sim={sim} />
      </div>
    </div>
  );
}
