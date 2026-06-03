import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricKey, Sample } from "../../lib/types";
import { getSampleKeyMetrics, metricDefinitions } from "../../lib/data";
import type { AtlasData } from "../../lib/types";
import EmptyChartState from "./EmptyChartState";
import { ChartTitle } from "./MetricErrorBarChart";
import { axisStyle, gridStroke, sampleColor } from "./chartTheme";

interface GroupedMetricChartProps {
  title: string;
  subtitle?: string;
  samples: Sample[];
  data: AtlasData;
  metricKeys: MetricKey[];
  yAxisLabel: string;
}

export default function GroupedMetricChart({
  title,
  subtitle,
  samples,
  data,
  metricKeys,
  yAxisLabel,
}: GroupedMetricChartProps) {
  const rows = metricKeys.map((metricKey) => {
    const row: Record<string, number | string | null> = {
      metric: metricDefinitions[metricKey].label,
    };

    for (const sample of samples) {
      row[sample.display_name] = getSampleKeyMetrics(
        sample,
        data.measurements,
        data.images,
        data.granudrumSeries,
      )[metricKey].mean;
    }

    return row;
  });

  if (!samples.length || !rows.length) {
    return <EmptyChartState title={title} message="Select at least one sample to draw this comparison." />;
  }

  return (
    <article className="chart-card">
      <ChartTitle title={title} subtitle={subtitle} />
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows} margin={{ top: 12, right: 18, bottom: 34, left: 34 }}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="metric" tick={axisStyle} interval={0} />
            <YAxis
              tick={axisStyle}
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -16, style: axisStyle }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={32} />
            {samples.map((sample, index) => (
              <Bar
                key={sample.sample_id}
                dataKey={sample.display_name}
                fill={sampleColor(index)}
                radius={[4, 4, 0, 0]}
                maxBarSize={42}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
