import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Appliance, Producer, SimulationResult } from "../types/domain";

interface HourlyStackedChartProps {
  appliances: Appliance[];
  producers: Producer[];
  sim: SimulationResult;
}

const CONSUMPTION_COLORS = ["#1b3a4b", "#31572c", "#8d6e63", "#7f5539", "#6b705c", "#9c6644", "#386641", "#5f0f40"];
const PRODUCTION_COLORS = ["#4ecb71", "#3aaed8", "#f5c84b"];

export function HourlyStackedChart({ appliances, producers, sim }: HourlyStackedChartProps) {
  const rows = Array.from({ length: 96 }, (_, slot) => {
    const hour = Math.floor(slot / 4);
    const quarter = slot % 4;
    const minute = quarter * 15;
    const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const row: Record<string, number | string> = { slot, label, net: (sim.hourlyTotalsKwh[hour] ?? 0) / 4 };

    for (const appliance of appliances) {
      const hourlyKwh = sim.perApplianceHourlyKwh[appliance.id]?.[hour] ?? 0;
      row[`c-${appliance.id}`] = hourlyKwh / 4;
    }

    for (const producer of producers) {
      const hourlyKwh = sim.perProducerHourlyKwh[producer.id]?.[hour] ?? 0;
      row[`p-${producer.id}`] = -(hourlyKwh / 4);
    }

    return row;
  });

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="slot"
            interval={7}
            tickFormatter={(slot) => rows[Number(slot)]?.label?.toString() ?? ""}
          />
          <YAxis unit="kWh" />
          <Tooltip labelFormatter={(slot) => rows[Number(slot)]?.label?.toString() ?? ""} />
          <Legend />
          {appliances.map((appliance, idx) => (
            <Area
              key={appliance.id}
              type="linear"
              dataKey={`c-${appliance.id}`}
              name={`${appliance.name} (Use)`}
              stackId="consumption"
              fill={CONSUMPTION_COLORS[idx % CONSUMPTION_COLORS.length]}
              stroke={CONSUMPTION_COLORS[idx % CONSUMPTION_COLORS.length]}
              fillOpacity={0.75}
            />
          ))}
          {producers.map((producer, idx) => (
            <Area
              key={producer.id}
              type="linear"
              dataKey={`p-${producer.id}`}
              name={`${producer.name} (Prod)`}
              stackId="production"
              fill={PRODUCTION_COLORS[idx % PRODUCTION_COLORS.length]}
              stroke={PRODUCTION_COLORS[idx % PRODUCTION_COLORS.length]}
              fillOpacity={0.65}
            />
          ))}
          <Area type="linear" dataKey="net" name="Net" stroke="#f5c84b" fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
