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
        <h4>Daily</h4>
        <p>{fmt(sim.totalDailyKwh)} kWh</p>
      </article>
      <article>
        <h4>Weekly</h4>
        <p>{fmt(sim.totalWeeklyKwh)} kWh</p>
      </article>
      <article>
        <h4>Monthly</h4>
        <p>{fmt(sim.totalMonthlyKwh)} kWh</p>
      </article>
      <article>
        <h4>Peak Hour</h4>
        <p>{String(sim.peakHour).padStart(2, "0")}:00</p>
      </article>
    </div>
  );
}
