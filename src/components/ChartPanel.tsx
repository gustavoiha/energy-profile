import { Suspense, lazy } from "react";
import type { Appliance, Producer, SimulationResult } from "../types/domain";
import { BreakdownTable } from "./BreakdownTable";

const HourlyStackedChart = lazy(async () => import("./HourlyStackedChart").then((mod) => ({ default: mod.HourlyStackedChart })));

interface ChartPanelProps {
  appliances: Appliance[];
  producers: Producer[];
  sim: SimulationResult;
  currency: string;
  includeCost: boolean;
}

export function ChartPanel({ appliances, producers, sim, currency, includeCost }: ChartPanelProps) {
  return (
    <section className="chart-panel">
      <h3 title={includeCost ? "Stacked energy flows with a cost line." : "Stacked energy flows across the day."}>
        {includeCost ? "Hourly Net Consumption + Cost" : "Hourly Net Consumption"}
      </h3>
      <Suspense fallback={<div className="chart-wrap">Loading chart...</div>}>
        <HourlyStackedChart appliances={appliances} producers={producers} sim={sim} currency={currency} includeCost={includeCost} />
      </Suspense>
      <h3>Daily Breakdown</h3>
      <BreakdownTable appliances={appliances} producers={producers} sim={sim} currency={currency} includeCost={includeCost} />
    </section>
  );
}
