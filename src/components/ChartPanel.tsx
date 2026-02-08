import type { Appliance, SimulationResult } from "../types/domain";
import { BreakdownTable } from "./BreakdownTable";
import { HourlyStackedChart } from "./HourlyStackedChart";

interface ChartPanelProps {
  appliances: Appliance[];
  sim: SimulationResult;
}

export function ChartPanel({ appliances, sim }: ChartPanelProps) {
  return (
    <section className="chart-panel">
      <h3>Hourly Consumption</h3>
      <HourlyStackedChart appliances={appliances} sim={sim} />
      <h3>Daily Breakdown</h3>
      <BreakdownTable appliances={appliances} sim={sim} />
    </section>
  );
}
