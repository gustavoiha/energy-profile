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
import type { Appliance, SimulationResult } from "../types/domain";

interface HourlyStackedChartProps {
  appliances: Appliance[];
  sim: SimulationResult;
}

const COLORS = ["#1b3a4b", "#31572c", "#8d6e63", "#7f5539", "#6b705c", "#9c6644", "#386641", "#5f0f40"];

export function HourlyStackedChart({ appliances, sim }: HourlyStackedChartProps) {
  const rows = Array.from({ length: 96 }, (_, slot) => {
    const hour = Math.floor(slot / 4);
    const quarter = slot % 4;
    const minute = quarter * 15;
    const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const row: Record<string, number | string> = { slot, label };

    for (const appliance of appliances) {
      const hourlyKwh = sim.perApplianceHourlyKwh[appliance.id]?.[hour] ?? 0;
      row[appliance.id] = hourlyKwh / 4;
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
              dataKey={appliance.id}
              name={appliance.name}
              stackId="1"
              fill={COLORS[idx % COLORS.length]}
              stroke={COLORS[idx % COLORS.length]}
              fillOpacity={0.8}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
