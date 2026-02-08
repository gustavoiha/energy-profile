import type { SimulationResult } from "../types/domain";

interface SummaryCardsProps {
  sim: SimulationResult;
  currency: string;
  mode: "usage" | "cost";
}

function fmt(value: number): string {
  return value.toFixed(2);
}

export function SummaryCards({ sim, currency, mode }: SummaryCardsProps) {
  const peakCostHour = sim.hourlyCost.reduce((best, value, idx) => (value > (sim.hourlyCost[best] ?? 0) ? idx : best), 0);

  if (mode === "usage") {
    return (
      <div className="summary-cards">
        <article>
          <h4 title="Total consumption before onsite production offsets.">Daily Consumption</h4>
          <p>{fmt(sim.totalDailyConsumptionKwh)} kWh</p>
        </article>
        <article>
          <h4 title="Projected consumption over 30.4 days before production offsets.">Monthly Consumption</h4>
          <p>{fmt(sim.totalDailyConsumptionKwh * 30.4)} kWh</p>
        </article>
        <article>
          <h4 title="Onsite generation from producers like solar and battery discharge.">Daily Production</h4>
          <p>{fmt(sim.totalDailyProductionKwh)} kWh</p>
        </article>
        <article>
          <h4 title="Net import requirement = consumption - production.">Daily Net</h4>
          <p>{fmt(sim.totalDailyKwh)} kWh</p>
        </article>
        <article>
          <h4 title="Hour with highest net import requirement.">Peak Net Hour</h4>
          <p>{String(sim.peakHour).padStart(2, "0")}:00</p>
        </article>
      </div>
    );
  }

  return (
    <div className="summary-cards">
      <article>
        <h4 title="Money saved by using green producers (avoided import cost + export income).">Monthly Savings</h4>
        <p>
          {currency} {fmt(sim.totalMonthlySavings)}
        </p>
      </article>
      <article>
        <h4 title="Projected bill from daily pattern x 30.4 days.">Monthly Cost</h4>
        <p>
          {currency} {fmt(sim.totalMonthlyCost)}
        </p>
      </article>
      <article>
        <h4 title="Imported energy from grid after onsite production offset.">Daily Import</h4>
        <p>{fmt(sim.hourlyImportKwh.reduce((acc, value) => acc + value, 0))} kWh</p>
      </article>
      <article>
        <h4 title="Exported energy sent to grid.">Daily Export</h4>
        <p>{fmt(sim.hourlyExportKwh.reduce((acc, value) => acc + value, 0))} kWh</p>
      </article>
      <article>
        <h4 title="Hour with highest tariff-weighted cost.">Peak Cost Hour</h4>
        <p>{String(peakCostHour).padStart(2, "0")}:00</p>
      </article>
    </div>
  );
}
