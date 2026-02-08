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
  onIncrementProducer: (id: string) => void;
  onDecrementProducer: (id: string) => void;
  onOpenAddDialog: () => void;
  onOpenAddProducerDialog: () => void;
  onOpenTemplates: () => void;
}

export function SimulatorPage({
  config,
  onEdit,
  onIncrement,
  onDecrement,
  onIncrementProducer,
  onDecrementProducer,
  onOpenAddDialog,
  onOpenAddProducerDialog,
  onOpenTemplates
}: SimulatorPageProps) {
  const sim = useMemo(() => simulate(config), [config]);

  return (
    <div className="simulator-page">
      <div className="sim-layout">
        <Sidebar
          appliances={config.appliances}
          producers={config.producers}
          onEdit={onEdit}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onIncrementProducer={onIncrementProducer}
          onDecrementProducer={onDecrementProducer}
          onOpenAddDialog={onOpenAddDialog}
          onOpenAddProducerDialog={onOpenAddProducerDialog}
          onOpenTemplates={onOpenTemplates}
        />
        <MainPanel appliances={config.appliances} producers={config.producers} sim={sim} />
      </div>
    </div>
  );
}
