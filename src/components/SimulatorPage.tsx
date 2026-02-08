import { useMemo } from "react";
import { simulate } from "../sim/simulate";
import type { HouseholdConfig } from "../types/domain";
import { MainPanel } from "./MainPanel";
import { Sidebar } from "./Sidebar";

interface SimulatorPageProps {
  config: HouseholdConfig;
  onEdit: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onOpenAddDialog: () => void;
  onOpenTemplates: () => void;
}

export function SimulatorPage({
  config,
  onEdit,
  onIncrement,
  onDecrement,
  onOpenAddDialog,
  onOpenTemplates
}: SimulatorPageProps) {
  const sim = useMemo(() => simulate(config), [config]);

  return (
    <div className="simulator-page">
      <div className="sim-layout">
        <Sidebar
          appliances={config.appliances}
          onEdit={onEdit}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onOpenAddDialog={onOpenAddDialog}
          onOpenTemplates={onOpenTemplates}
        />
        <MainPanel appliances={config.appliances} sim={sim} />
      </div>
    </div>
  );
}
