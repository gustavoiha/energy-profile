import type { Appliance, Producer, SimulationResult } from "../types/domain";

interface BreakdownTableProps {
  appliances: Appliance[];
  producers: Producer[];
  sim: SimulationResult;
}

export function BreakdownTable({ appliances, producers, sim }: BreakdownTableProps) {
  const applianceRows = appliances
    .map((appliance) => ({
      id: appliance.id,
      name: appliance.name,
      quantity: appliance.quantity,
      dailyKwh: sim.perApplianceDailyKwh[appliance.id] ?? 0
    }))
    .sort((a, b) => b.dailyKwh - a.dailyKwh);

  const producerRows = producers
    .map((producer) => ({
      id: producer.id,
      name: producer.name,
      quantity: producer.quantity,
      dailyKwh: sim.perProducerDailyKwh[producer.id] ?? 0
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
          </tr>
        </thead>
        <tbody>
          {applianceRows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.quantity}</td>
              <td>{row.dailyKwh.toFixed(3)}</td>
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
          </tr>
        </thead>
        <tbody>
          {producerRows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.quantity}</td>
              <td>{row.dailyKwh.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
