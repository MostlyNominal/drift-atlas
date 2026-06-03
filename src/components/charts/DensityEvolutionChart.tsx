import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fragment } from "react";
import type { GranuTapCurve, Sample } from "../../lib/types";
import EmptyChartState from "./EmptyChartState";
import { ChartTitle } from "./MetricErrorBarChart";
import { axisStyle, gridStroke, sampleColor } from "./chartTheme";

interface DensityEvolutionChartProps {
  title: string;
  subtitle?: string;
  curves: GranuTapCurve[];
  samples: Sample[];
}

export default function DensityEvolutionChart({
  title,
  subtitle,
  curves,
  samples,
}: DensityEvolutionChartProps) {
  const visibleSamples = samples.filter((sample) => {
    return curves.some((curve) => curve.sample_id === sample.sample_id);
  });

  if (!visibleSamples.length) {
    return <EmptyChartState title={title} message="No tap-level density curve data is available yet." />;
  }

  const rows = buildDensityRows(curves, visibleSamples);
  const references = visibleSamples.map((sample) => {
    const sampleRows = rows.filter((row) => typeof row[sample.display_name] === "number");
    const initial = sampleRows[0]?.[sample.display_name] as number | undefined;
    const final = sampleRows[sampleRows.length - 1]?.[sample.display_name] as number | undefined;
    return { sample, initial, final };
  });

  return (
    <article className="chart-card">
      <ChartTitle title={title} subtitle={subtitle} />
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={rows} margin={{ top: 12, right: 54, bottom: 34, left: 36 }}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="tap"
              tick={axisStyle}
              type="number"
              label={{ value: "Taps / cycle index", position: "insideBottom", offset: -22, style: axisStyle }}
            />
            <YAxis
              tick={axisStyle}
              label={{ value: "Density (g cm-3)", angle: -90, position: "insideLeft", offset: -18, style: axisStyle }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={32} />
            {references.map(({ sample, initial, final }, index) => (
              <Fragment key={`refs-${sample.sample_id}`}>
                {typeof initial === "number" ? (
                  <ReferenceLine y={initial} stroke={sampleColor(index)} strokeDasharray="3 4" />
                ) : null}
                {typeof final === "number" ? (
                  <ReferenceLine
                    y={final}
                    stroke={sampleColor(index)}
                    strokeDasharray="6 4"
                    label={{
                      value: `${sample.display_name} final ${final.toFixed(2)}`,
                      position: "right",
                      fill: sampleColor(index),
                      fontSize: 11,
                    }}
                  />
                ) : null}
              </Fragment>
            ))}
            {visibleSamples.map((sample, index) => (
              <Line
                key={sample.sample_id}
                dataKey={sample.display_name}
                name={sample.display_name}
                type="stepAfter"
                stroke={sampleColor(index)}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function buildDensityRows(curves: GranuTapCurve[], samples: Sample[]) {
  const taps = new Set<number>();

  for (const curve of curves) {
    for (const point of curve.points) {
      taps.add(point.tap);
    }
  }

  return [...taps]
    .sort((a, b) => a - b)
    .map((tap) => {
      const row: Record<string, number | null> = { tap };

      for (const sample of samples) {
        const values = curves
          .filter((curve) => curve.sample_id === sample.sample_id)
          .map((curve) => curve.points.find((point) => point.tap === tap)?.density_g_cm3)
          .filter((value): value is number => typeof value === "number");

        row[sample.display_name] = values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null;
      }

      return row;
    });
}
