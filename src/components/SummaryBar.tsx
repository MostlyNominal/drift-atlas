import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import Chart from "./Chart";
import { showErrorBars } from "../lib/stats";
import type { RunSummary } from "../lib/types";

/** Reusable mean ± SD bar chart with conditional error bars (n>1 only). */
export default function SummaryBar({
  runs, field, unit, labelBy = "batch_id",
}: {
  runs: [string, RunSummary][];
  field: string;
  unit?: string;
  labelBy?: "batch_id" | "sample_id";
}) {
  const option: EChartsOption = useMemo(() => {
    const cats = runs.map(([, v]) => v[labelBy]);
    const means = runs.map(([, v]) => v.stats[field]?.mean ?? null);
    const errs = runs.map(([, v], i) => {
      const st = v.stats[field];
      if (!st || !showErrorBars(st) || st.mean == null || st.sd == null) return null;
      return [i, st.mean - st.sd, st.mean + st.sd];
    }).filter(Boolean) as number[][];
    return {
      tooltip: {},
      xAxis: { type: "category", data: cats, axisLabel: { rotate: 30 } },
      yAxis: { type: "value", name: unit ?? field },
      series: [
        { type: "bar", data: means, name: `mean ${field}` },
        {
          type: "custom", name: "± SD (n>1)",
          renderItem: (_p: unknown, api: any) => {
            const x = api.coord([api.value(0), api.value(1)])[0];
            const yTop = api.coord([api.value(0), api.value(2)])[1];
            const yBot = api.coord([api.value(0), api.value(1)])[1];
            const w = 6;
            return { type: "group", children: [
              { type: "line", shape: { x1: x, y1: yTop, x2: x, y2: yBot }, style: { stroke: "#222" } },
              { type: "line", shape: { x1: x - w, y1: yTop, x2: x + w, y2: yTop }, style: { stroke: "#222" } },
              { type: "line", shape: { x1: x - w, y1: yBot, x2: x + w, y2: yBot }, style: { stroke: "#222" } },
            ] };
          },
          data: errs, encode: { x: 0, y: [1, 2] },
        },
      ],
    };
  }, [runs, field, unit, labelBy]);
  return <Chart option={option} />;
}
