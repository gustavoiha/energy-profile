import type { SimulationResult } from "../types/domain";

interface SummaryCardsProps {
  sim: SimulationResult;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

export function SummaryCards({ sim }: SummaryCardsProps) {
  return (
    <div className="summary-cards">
      <article>
        <h4>Daily Consumption</h4>
        <p>{fmt(sim.totalDailyConsumptionKwh)} kWh</p>
      </article>
      <article>
        <h4>Daily Production</h4>
        <p>{fmt(sim.totalDailyProductionKwh)} kWh</p>
      </article>
      <article>
        <h4>Daily Net</h4>
        <p>{fmt(sim.totalDailyKwh)} kWh</p>
      </article>
      <article>
        <h4>Peak Net Hour</h4>
        <p>{String(sim.peakHour).padStart(2, "0")}:00</p>
      </article>
    </div>
  );
}
