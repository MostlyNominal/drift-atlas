import {
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HausnerQualityBand, RelationshipRow } from "../../lib/types";
import EmptyChartState from "./EmptyChartState";
import { ChartTitle } from "./MetricErrorBarChart";
import { axisStyle, gridStroke, sampleColor } from "./chartTheme";

interface RelationshipScatterChartProps {
  title: string;
  subtitle?: string;
  rows: RelationshipRow[];
  xAxisLabel: string;
  yAxisLabel: string;
  yBands?: HausnerQualityBand[];
  yThresholds?: number[];
}

export default function RelationshipScatterChart({
  title,
  subtitle,
  rows,
  xAxisLabel,
  yAxisLabel,
  yBands = [],
  yThresholds = [],
}: RelationshipScatterChartProps) {
  const validRows = rows.filter((row) => row.x != null && row.y != null);
  const groupedByAlloy = groupByAlloy(validRows);

  if (!validRows.length) {
    return <EmptyChartState title={title} message="No paired metric values are available for this relationship yet." />;
  }

  return (
    <article className="chart-card">
      <ChartTitle title={title} subtitle={subtitle} />
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart margin={{ top: 14, right: 46, bottom: 38, left: 42 }}>
            <CartesianGrid stroke={gridStroke} />
            <XAxis
              dataKey="x"
              type="number"
              tick={axisStyle}
              domain={["dataMin - 20", "dataMax + 20"]}
              label={{ value: xAxisLabel, position: "insideBottom", offset: -24, style: axisStyle }}
            />
            <YAxis
              dataKey="y"
              type="number"
              tick={axisStyle}
              domain={["dataMin - 0.02", "dataMax + 0.04"]}
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -20, style: axisStyle }}
            />
            {yBands.map((band) => (
              <ReferenceArea
                key={band.label}
                y1={band.min}
                y2={band.max}
                fill={band.color}
                fillOpacity={0.68}
                label={{ value: band.label, position: "insideLeft", fill: "#64706a", fontSize: 11 }}
              />
            ))}
            {yThresholds.map((threshold) => (
              <ReferenceLine
                key={threshold}
                y={threshold}
                stroke="#64706a"
                strokeDasharray="4 4"
                label={{ value: threshold.toFixed(2), position: "right", fill: "#64706a", fontSize: 11 }}
              />
            ))}
            <Tooltip labelFormatter={() => "Sample"} />
            {[...groupedByAlloy.entries()].map(([alloy, alloyRows], index) => (
              alloyRows.length > 1 ? (
                <Line
                  key={alloy}
                  data={alloyRows}
                  dataKey="y"
                  name={`${alloy} state path`}
                  type="linear"
                  stroke={sampleColor(index)}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null
            ))}
            {validRows.map((row, index) => (
              <Scatter
                key={row.sample_id}
                data={[row]}
                name={row.display_name}
                fill={sampleColor(index)}
              >
                <LabelList dataKey="display_name" position="right" className="chart-direct-label" />
              </Scatter>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function groupByAlloy(rows: RelationshipRow[]): Map<string, RelationshipRow[]> {
  const groups = new Map<string, RelationshipRow[]>();

  for (const row of rows) {
    const current = groups.get(row.alloy) ?? [];
    current.push(row);
    groups.set(row.alloy, current);
  }

  for (const [alloy, alloyRows] of groups.entries()) {
    groups.set(alloy, [...alloyRows].sort(compareStateOrder));
  }

  return groups;
}

function compareStateOrder(a: RelationshipRow, b: RelationshipRow) {
  return stateRank(a.powder_state) - stateRank(b.powder_state);
}

function stateRank(state: string) {
  if (state.includes("as-received")) return 0;
  if (state.includes("virgin")) return 0;
  if (state.includes("conditioned")) return 1;
  if (state.includes("dried")) return 2;
  return 3;
}
