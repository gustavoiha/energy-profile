import type { Appliance, Producer, SimulationResult } from "../types/domain";

interface BreakdownTableProps {
  appliances: Appliance[];
  producers: Producer[];
  sim: SimulationResult;
  currency: string;
  includeCost: boolean;
}

export function BreakdownTable({ appliances, producers, sim, currency, includeCost }: BreakdownTableProps) {
  const applianceRows = appliances
    .map((appliance) => ({
      id: appliance.id,
      name: appliance.name,
      quantity: appliance.quantity,
      dailyKwh: sim.perApplianceDailyKwh[appliance.id] ?? 0,
      dailyCost: sim.perApplianceDailyCost[appliance.id] ?? 0
    }))
    .sort((a, b) => b.dailyKwh - a.dailyKwh);

  const producerRows = producers
    .map((producer) => ({
      id: producer.id,
      name: producer.name,
      quantity: producer.quantity,
      dailyKwh: sim.perProducerDailyKwh[producer.id] ?? 0,
      dailyCost: sim.perProducerDailyCost[producer.id] ?? 0
    }))
    .sort((a, b) => b.dailyKwh - a.dailyKwh);

  return (
    <div className="breakdown-wrap">
      <table className="breakdown-table">
        <thead>
          <tr>
            <th>Appliance</th>
            <th>Qty</th>
            <th>kWh/day</th>
            {includeCost && <th>{currency}/day</th>}
          </tr>
        </thead>
        <tbody>
          {applianceRows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.quantity}</td>
              <td>{row.dailyKwh.toFixed(3)}</td>
              {includeCost && <td>{row.dailyCost.toFixed(2)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="breakdown-table">
        <thead>
          <tr>
            <th>Producer</th>
            <th>Qty</th>
            <th>kWh/day</th>
            {includeCost && <th>{currency}/day</th>}
          </tr>
        </thead>
        <tbody>
          {producerRows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.quantity}</td>
              <td>{row.dailyKwh.toFixed(3)}</td>
              {includeCost && <td>{row.dailyCost.toFixed(2)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
