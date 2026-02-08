import type { Appliance, Producer, SimulationResult } from "../types/domain";
import { ChartPanel } from "./ChartPanel";
import { SummaryCards } from "./SummaryCards";

interface MainPanelProps {
  appliances: Appliance[];
  producers: Producer[];
  sim: SimulationResult;
}

export function MainPanel({ appliances, producers, sim }: MainPanelProps) {
  return (
    <main className="main-panel">
      <SummaryCards sim={sim} />
      <ChartPanel appliances={appliances} producers={producers} sim={sim} />
    </main>
  );
}
