import { useMemo, useState } from "react";
import type { Appliance, SimulationResult } from "../types/domain";

interface CalibrationPanelProps {
  appliances: Appliance[];
  sim: SimulationResult;
  currency: string;
}

export function CalibrationPanel({ appliances, sim, currency }: CalibrationPanelProps) {
  const [targetMonthlyBill, setTargetMonthlyBill] = useState<number>(0);

  const guidance = useMemo(() => {
    if (!Number.isFinite(targetMonthlyBill) || targetMonthlyBill <= 0) {
      return "Enter your real monthly bill to calibrate assumptions.";
    }

    const estimate = sim.totalMonthlyCost;
    if (estimate <= 0.001) {
      return "Estimated monthly bill is near zero; increase load or tariff data before calibrating.";
    }

    const ratio = targetMonthlyBill / estimate;
    const sorted = [...appliances]
      .map((appliance) => ({
        name: appliance.name,
        modelKind: appliance.model.kind
      }))
      .slice(0, 3);

    if (Math.abs(1 - ratio) < 0.08) {
      return "Calibration is good. Keep values as-is and refine only specific appliance schedules if needed.";
    }

    if (ratio > 1) {
      return `Your real bill is higher than estimate. Increase watts or daily runtime for top loads (for example: ${sorted
        .map((item) => item.name)
        .join(", ")}). Suggested factor: ${(ratio * 100).toFixed(0)}% of current assumptions.`;
    }

    return `Your real bill is lower than estimate. Reduce watts or runtime assumptions. Suggested factor: ${(ratio * 100).toFixed(
      0
    )}% of current assumptions.`;
  }, [appliances, sim.totalMonthlyCost, targetMonthlyBill]);

  return (
    <section className="panel-card">
      <h4 title="Use your real bill to sanity-check modeled appliance assumptions.">Bill Calibration</h4>
      <label>
        Real Monthly Bill ({currency})
        <input
          type="number"
          min={0}
          step={0.01}
          value={targetMonthlyBill || ""}
          onChange={(e) => setTargetMonthlyBill(Number(e.target.value))}
        />
      </label>
      <p className="muted">Current estimate: {currency} {sim.totalMonthlyCost.toFixed(2)}</p>
      <p>{guidance}</p>
    </section>
  );
}
