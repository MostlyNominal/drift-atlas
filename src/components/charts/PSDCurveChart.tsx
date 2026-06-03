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
import type { PSDCurve, Sample } from "../../lib/types";
import EmptyChartState from "./EmptyChartState";
import { ChartTitle } from "./MetricErrorBarChart";
import { axisStyle, gridStroke, sampleColor } from "./chartTheme";

interface PSDCurveChartProps {
  title: string;
  subtitle?: string;
  curves: PSDCurve[];
  samples: Sample[];
}

export default function PSDCurveChart({ title, subtitle, curves, samples }: PSDCurveChartProps) {
  const visibleSamples = samples.filter((sample) => {
    return curves.some((curve) => curve.sample_id === sample.sample_id);
  });

  if (!visibleSamples.length) {
    return <EmptyChartState title={title} message="No full PSD curve data is available yet." />;
  }

  const rows = buildPsdRows(curves, visibleSamples);

  return (
    <article className="chart-card">
      <ChartTitle title={title} subtitle={subtitle} />
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={rows} margin={{ top: 12, right: 24, bottom: 34, left: 34 }}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="x_um"
              tick={axisStyle}
              type="number"
              domain={["dataMin", "dataMax"]}
              label={{ value: "Particle size (um)", position: "insideBottom", offset: -22, style: axisStyle }}
            />
            <YAxis
              tick={axisStyle}
              label={{ value: "Volume (%)", angle: -90, position: "insideLeft", offset: -16, style: axisStyle }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={32} />
            {visibleSamples.map((sample, index) => (
              <Line
                key={sample.sample_id}
                dataKey={sample.display_name}
                name={sample.display_name}
                type="monotone"
                stroke={sampleColor(index)}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function buildPsdRows(curves: PSDCurve[], samples: Sample[]) {
  const xValues = new Set<number>();

  for (const curve of curves) {
    for (const x of curve.x_um) {
      xValues.add(x);
    }
  }

  return [...xValues]
    .sort((a, b) => a - b)
    .map((x) => {
      const row: Record<string, number | null> = { x_um: x };

      for (const sample of samples) {
        const sampleCurves = curves.filter((curve) => curve.sample_id === sample.sample_id);
        const values = sampleCurves
          .map((curve) => {
            const index = curve.x_um.indexOf(x);
            return index >= 0 ? curve.volume_percent[index] : null;
          })
          .filter((value): value is number => typeof value === "number");

        row[sample.display_name] = values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null;
      }

      return row;
    });
}
