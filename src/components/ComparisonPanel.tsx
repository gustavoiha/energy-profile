import type { SimulationResult } from "../types/domain";
import { compareSimulation } from "../sim/simulate";

interface ComparisonPanelProps {
  baseline: SimulationResult;
  current: SimulationResult;
  currency: string;
}

function fmtSigned(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

export function ComparisonPanel({ baseline, current, currency }: ComparisonPanelProps) {
  const delta = compareSimulation(current, baseline);

  return (
    <section className="panel-card">
      <h4 title="Current scenario compared against the saved baseline snapshot.">Baseline Comparison</h4>
      <div className="summary-cards comparison-cards">
        <article>
          <h4>Daily kWh Delta</h4>
          <p>{fmtSigned(delta.dailyKwhDelta)} kWh</p>
        </article>
        <article>
          <h4>Monthly kWh Delta</h4>
          <p>{fmtSigned(delta.monthlyKwhDelta)} kWh</p>
        </article>
        <article>
          <h4>Daily Cost Delta</h4>
          <p>
            {currency} {fmtSigned(delta.dailyCostDelta)}
          </p>
        </article>
        <article>
          <h4>Monthly Cost Delta</h4>
          <p>
            {currency} {fmtSigned(delta.monthlyCostDelta)}
          </p>
        </article>
      </div>
    </section>
  );
}
