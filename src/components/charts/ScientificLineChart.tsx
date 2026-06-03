import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyChartState from "./EmptyChartState";
import { ChartTitle } from "./MetricErrorBarChart";
import { axisStyle, gridStroke, sampleColor } from "./chartTheme";

interface ScientificSeries {
  name: string;
  points: object[];
}

interface ScientificLineChartProps {
  title: string;
  subtitle?: string;
  series: ScientificSeries[];
  xKey: string;
  yKey: string;
  xAxisLabel: string;
  yAxisLabel: string;
}

export default function ScientificLineChart({
  title,
  subtitle,
  series,
  xKey,
  yKey,
  xAxisLabel,
  yAxisLabel,
}: ScientificLineChartProps) {
  const visibleSeries = series.filter((entry) => entry.points.length);

  if (!visibleSeries.length) {
    return <EmptyChartState title={title} message="No line-series points are available yet." />;
  }

  return (
    <article className="chart-card">
      <ChartTitle title={title} subtitle={subtitle} />
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart margin={{ top: 12, right: 24, bottom: 34, left: 38 }}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey={xKey}
              type="number"
              tick={axisStyle}
              label={{ value: xAxisLabel, position: "insideBottom", offset: -22, style: axisStyle }}
            />
            <YAxis
              tick={axisStyle}
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -20, style: axisStyle }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={32} />
            {visibleSeries.map((entry, index) => (
              <Line
                key={entry.name}
                data={entry.points}
                dataKey={yKey}
                name={entry.name}
                type="monotone"
                stroke={sampleColor(index)}
                strokeWidth={2}
                dot={{ r: 2.5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
