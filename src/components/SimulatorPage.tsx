import { useMemo, useState } from "react";
import { simulate } from "../sim/simulate";
import type { HouseholdConfig } from "../types/domain";
import { MainPanel } from "./MainPanel";
import { Sidebar } from "./Sidebar";
import { UsageConfigDialog } from "./UsageConfigDialog";

interface SimulatorPageProps {
  config: HouseholdConfig;
  baselineConfig: HouseholdConfig | null;
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
  onChangeTariff: (tariff: HouseholdConfig["tariff"]) => void;
  onChangeProfile: (profile: HouseholdConfig["profile"]) => void;
  onOpenAddDialog: () => void;
  onOpenAddProducerDialog: () => void;
  onOpenTemplates: () => void;
  onSetBaseline: () => void;
  onClearBaseline: () => void;
  onResetScenario: () => void;
  onExportScenario: () => void;
  onImportScenario: (file: File) => void;
  onCopyShareLink: () => void;
  onOpenWizard: () => void;
}

export function SimulatorPage({
  config,
  baselineConfig,
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
  onChangeTariff,
  onChangeProfile,
  onOpenAddDialog,
  onOpenAddProducerDialog,
  onOpenTemplates,
  onSetBaseline,
  onClearBaseline,
  onResetScenario,
  onExportScenario,
  onImportScenario,
  onCopyShareLink,
  onOpenWizard
}: SimulatorPageProps) {
  const [activeTab, setActiveTab] = useState<"usage" | "cost">("usage");
  const [isUsageConfigOpen, setUsageConfigOpen] = useState(false);
  const sim = useMemo(() => simulate(config), [config]);
  const baselineSim = useMemo(() => (baselineConfig ? simulate(baselineConfig) : null), [baselineConfig]);

  return (
    <div className="simulator-page">
      <div className="sim-layout">
        <Sidebar
          appliances={config.appliances}
          producers={config.producers}
          onEdit={onEdit}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onToggleEnabled={onToggleEnabled}
          onRemove={onRemove}
          onEditProducer={onEditProducer}
          onIncrementProducer={onIncrementProducer}
          onDecrementProducer={onDecrementProducer}
          onToggleProducerEnabled={onToggleProducerEnabled}
          onRemoveProducer={onRemoveProducer}
          onOpenAddDialog={onOpenAddDialog}
          onOpenAddProducerDialog={onOpenAddProducerDialog}
          onOpenTemplates={onOpenTemplates}
        />
        <MainPanel
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenUsageConfig={() => setUsageConfigOpen(true)}
          config={config}
          appliances={config.appliances}
          producers={config.producers}
          sim={sim}
          baselineSim={baselineSim}
          currency={config.tariff.currency}
          onSetBaseline={onSetBaseline}
          onClearBaseline={onClearBaseline}
        />
      </div>

      <UsageConfigDialog
        open={isUsageConfigOpen}
        onClose={() => setUsageConfigOpen(false)}
        tariff={config.tariff}
        profile={config.profile}
        onChangeTariff={onChangeTariff}
        onChangeProfile={onChangeProfile}
        onResetScenario={onResetScenario}
        onExportScenario={onExportScenario}
        onImportScenario={onImportScenario}
        onCopyShareLink={onCopyShareLink}
        onOpenWizard={onOpenWizard}
      />
    </div>
  );
}
