import type { Appliance, SimulationResult } from "../types/domain";
import { ChartPanel } from "./ChartPanel";
import { SummaryCards } from "./SummaryCards";

interface MainPanelProps {
  appliances: Appliance[];
  sim: SimulationResult;
}

export function MainPanel({ appliances, sim }: MainPanelProps) {
  return (
    <main className="main-panel">
      <SummaryCards sim={sim} />
      <ChartPanel appliances={appliances} sim={sim} />
    </main>
  );
}
