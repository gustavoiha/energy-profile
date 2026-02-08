import type { Appliance, HouseholdConfig, Producer, SimulationResult } from "../types/domain";
import { CalibrationPanel } from "./CalibrationPanel";
import { ChartPanel } from "./ChartPanel";
import { ComparisonPanel } from "./ComparisonPanel";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { SavingsActionsPanel } from "./SavingsActionsPanel";
import { SummaryCards } from "./SummaryCards";

interface MainPanelProps {
  activeTab: "usage" | "cost";
  onChangeTab: (tab: "usage" | "cost") => void;
  onOpenUsageConfig: () => void;
  config: HouseholdConfig;
  appliances: Appliance[];
  producers: Producer[];
  sim: SimulationResult;
  baselineSim: SimulationResult | null;
  currency: string;
  onSetBaseline: () => void;
  onClearBaseline: () => void;
}

export function MainPanel({
  activeTab,
  onChangeTab,
  onOpenUsageConfig,
  config,
  appliances,
  producers,
  sim,
  baselineSim,
  currency,
  onSetBaseline,
  onClearBaseline
}: MainPanelProps) {
  return (
    <main className="main-panel">
      <div className="main-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "usage" ? "active" : ""}`}
          onClick={() => onChangeTab("usage")}
        >
          Usage
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "cost" ? "active" : ""}`}
          onClick={() => onChangeTab("cost")}
        >
          Cost & Savings
        </button>
      </div>

      {activeTab === "usage" ? (
        <>
          <div className="inline-actions">
            <button type="button" onClick={onOpenUsageConfig}>
              Open Tariff & Profile Configuration
            </button>
          </div>
          <SummaryCards sim={sim} currency={currency} mode="usage" />
          <OnboardingChecklist config={config} />
          <ChartPanel appliances={appliances} producers={producers} sim={sim} currency={currency} includeCost={false} />
        </>
      ) : (
        <>
          <div className="inline-actions">
            <button type="button" onClick={onSetBaseline}>
              Set Current As Baseline
            </button>
            <button type="button" onClick={onClearBaseline} disabled={!baselineSim}>
              Clear Baseline
            </button>
          </div>
          <SummaryCards sim={sim} currency={currency} mode="cost" />
          {baselineSim && <ComparisonPanel baseline={baselineSim} current={sim} currency={currency} />}
          <SavingsActionsPanel actions={sim.savingsActions ?? []} currency={currency} />
          <CalibrationPanel appliances={appliances} sim={sim} currency={currency} />
          <ChartPanel appliances={appliances} producers={producers} sim={sim} currency={currency} includeCost />
        </>
      )}
    </main>
  );
}
