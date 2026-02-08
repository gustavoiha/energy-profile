import { Suspense, lazy } from "react";
import type { Appliance, Producer, SimulationResult } from "../types/domain";
import { BreakdownTable } from "./BreakdownTable";

const HourlyStackedChart = lazy(async () => import("./HourlyStackedChart").then((mod) => ({ default: mod.HourlyStackedChart })));

interface ChartPanelProps {
  appliances: Appliance[];
  producers: Producer[];
  sim: SimulationResult;
}

export function ChartPanel({ appliances, producers, sim }: ChartPanelProps) {
  return (
    <section className="chart-panel">
      <h3>Hourly Net Consumption (Consumption - Production)</h3>
      <Suspense fallback={<div className="chart-wrap">Loading chart…</div>}>
        <HourlyStackedChart appliances={appliances} producers={producers} sim={sim} />
      </Suspense>
      <h3>Daily Breakdown</h3>
      <BreakdownTable appliances={appliances} producers={producers} sim={sim} />
    </section>
  );
}
