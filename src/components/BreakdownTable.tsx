import type { Appliance, SimulationResult } from "../types/domain";

interface BreakdownTableProps {
  appliances: Appliance[];
  sim: SimulationResult;
}

export function BreakdownTable({ appliances, sim }: BreakdownTableProps) {
  const rows = appliances
    .map((appliance) => ({
      id: appliance.id,
      name: appliance.name,
      category: appliance.category,
      enabled: appliance.enabled,
      dailyKwh: sim.perApplianceDailyKwh[appliance.id] ?? 0
    }))
    .sort((a, b) => b.dailyKwh - a.dailyKwh);

  return (
    <table className="breakdown-table">
      <thead>
        <tr>
          <th>Appliance</th>
          <th>Category</th>
          <th>Enabled</th>
          <th>kWh/day</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.category}</td>
            <td>{row.enabled ? "Yes" : "No"}</td>
            <td>{row.dailyKwh.toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
