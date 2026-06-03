import type { GranuDrumSeries, Sample } from "../../lib/types";
import EmptyChartState from "./EmptyChartState";
import { ChartTitle } from "./MetricErrorBarChart";
import { sampleColor } from "./chartTheme";

interface AvalancheBoxPlotProps {
  title: string;
  subtitle?: string;
  series: GranuDrumSeries[];
  samples: Sample[];
}

interface BoxRow {
  label: string;
  values: number[];
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}

export default function AvalancheBoxPlot({
  title,
  subtitle,
  series,
  samples,
}: AvalancheBoxPlotProps) {
  const rows = samples
    .map((sample) => {
      const values = series
        .filter((entry) => entry.sample_id === sample.sample_id && entry.test_type === "first_avalanche")
        .flatMap((entry) => entry.values ?? []);

      return values.length ? buildBoxRow(`${sample.display_name} (${sample.powder_state})`, values) : null;
    })
    .filter((row): row is BoxRow => row != null);

  if (!rows.length) {
    return <EmptyChartState title={title} message="No GranuDrum First Avalanche values are available yet." />;
  }

  const width = Math.max(760, rows.length * 170);
  const height = 330;
  const plot = { left: 58, right: 28, top: 24, bottom: 76 };
  const minValue = Math.floor(Math.min(...rows.map((row) => row.min)) - 2);
  const maxValue = Math.ceil(Math.max(...rows.map((row) => row.max)) + 2);
  const y = (value: number) => {
    const span = maxValue - minValue || 1;
    return plot.top + ((maxValue - value) / span) * (height - plot.top - plot.bottom);
  };

  return (
    <article className="chart-card">
      <ChartTitle title={title} subtitle={subtitle} />
      <div className="chart-frame svg-chart-frame">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <line
            x1={plot.left}
            x2={width - plot.right}
            y1={height - plot.bottom}
            y2={height - plot.bottom}
            className="chart-axis"
          />
          <line
            x1={plot.left}
            x2={plot.left}
            y1={plot.top}
            y2={height - plot.bottom}
            className="chart-axis"
          />
          {[minValue, (minValue + maxValue) / 2, maxValue].map((tick) => (
            <g key={tick}>
              <line x1={plot.left - 5} x2={width - plot.right} y1={y(tick)} y2={y(tick)} className="chart-gridline" />
              <text x={plot.left - 10} y={y(tick) + 4} textAnchor="end" className="chart-axis-label">
                {tick.toFixed(0)}
              </text>
            </g>
          ))}
          <text
            x={18}
            y={(height - plot.bottom + plot.top) / 2}
            transform={`rotate(-90 18 ${(height - plot.bottom + plot.top) / 2})`}
            textAnchor="middle"
            className="chart-axis-label"
          >
            Avalanche Angle (deg)
          </text>
          {rows.map((row, index) => {
            const slotWidth = (width - plot.left - plot.right) / rows.length;
            const cx = plot.left + slotWidth * index + slotWidth / 2;
            const boxWidth = Math.min(72, slotWidth * 0.44);
            const color = sampleColor(index);

            return (
              <g key={row.label}>
                <line x1={cx} x2={cx} y1={y(row.min)} y2={y(row.max)} stroke={color} strokeWidth={2} />
                <line x1={cx - boxWidth / 3} x2={cx + boxWidth / 3} y1={y(row.min)} y2={y(row.min)} stroke={color} strokeWidth={2} />
                <line x1={cx - boxWidth / 3} x2={cx + boxWidth / 3} y1={y(row.max)} y2={y(row.max)} stroke={color} strokeWidth={2} />
                <rect
                  x={cx - boxWidth / 2}
                  y={y(row.q3)}
                  width={boxWidth}
                  height={Math.max(2, y(row.q1) - y(row.q3))}
                  fill={color}
                  fillOpacity={0.18}
                  stroke={color}
                  strokeWidth={2}
                  rx={4}
                />
                <line x1={cx - boxWidth / 2} x2={cx + boxWidth / 2} y1={y(row.median)} y2={y(row.median)} stroke="#1f2933" strokeWidth={2.2} />
                <circle cx={cx} cy={y(row.mean)} r={4.5} fill="#ffffff" stroke={color} strokeWidth={2} />
                <text x={cx} y={height - plot.bottom + 24} textAnchor="middle" className="chart-axis-label">
                  {row.label}
                </text>
                <text x={cx} y={height - plot.bottom + 42} textAnchor="middle" className="chart-axis-label">
                  n={row.values.length}, mean {row.mean.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </article>
  );
}

function buildBoxRow(label: string, values: number[]): BoxRow {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;

  return {
    label,
    values: sorted,
    min: sorted[0],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    mean,
  };
}

function quantile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  const next = sorted[base + 1];

  return next == null ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
}
