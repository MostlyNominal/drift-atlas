import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, metricDefinitions } from "../../lib/data";
import type { MetricStat } from "../../lib/types";
import EmptyChartState from "./EmptyChartState";
import { axisStyle, gridStroke } from "./chartTheme";

interface MetricErrorBarChartProps {
  title: string;
  subtitle?: string;
  metrics: MetricStat[];
  yAxisLabel: string;
}

export default function MetricErrorBarChart({
  title,
  subtitle,
  metrics,
  yAxisLabel,
}: MetricErrorBarChartProps) {
  const chartRows = metrics
    .filter((metric) => metric.mean != null)
    .map((metric) => {
      const precision = metricDefinitions[metric.key].precision;
      return {
        label: metric.label,
        mean: metric.mean,
        errorRange: metric.sd != null && metric.n > 1
          ? [metric.mean! - metric.sd, metric.mean! + metric.sd]
          : [metric.mean, metric.mean],
        n: metric.n,
        valueLabel: `${formatNumber(metric.mean, precision)}${metric.unit ? ` ${metric.unit}` : ""}`,
      };
    });

  const repeatRows = metrics.flatMap((metric) => {
    return metric.values.map((value, index) => ({
      label: metric.label,
      value,
      repeat: index + 1,
    }));
  });

  if (!chartRows.length) {
    return <EmptyChartState title={title} message="No repeat-level values are available for this chart yet." />;
  }

  return (
    <article className="chart-card">
      <ChartTitle title={title} subtitle={subtitle} />
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartRows} margin={{ top: 12, right: 24, bottom: 32, left: 34 }}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} interval={0} />
            <YAxis
              tick={axisStyle}
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -16, style: axisStyle }}
            />
            <Tooltip labelFormatter={(label) => String(label)} />
            <Bar dataKey="mean" name="Mean" fill="#006f6f" radius={[4, 4, 0, 0]} barSize={38}>
              <ErrorBar dataKey="errorRange" width={8} strokeWidth={1.5} stroke="#1f2933" />
            </Bar>
            <Scatter data={repeatRows} dataKey="value" name="Repeats" fill="#b56b12" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footnotes">
        {chartRows.map((row) => (
          <span key={row.label}>{row.label}: {row.valueLabel}, n={row.n}</span>
        ))}
      </div>
    </article>
  );
}

export function ChartTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="chart-title">
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
