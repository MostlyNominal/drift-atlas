import { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import Chart from "../components/Chart";
import { Loading, NBadge, Page, useAsync } from "../components/Common";
import { loadSummaries } from "../lib/data";
import { showErrorBars } from "../lib/stats";

const FIELDS = ["d10", "d50", "d90", "span"] as const;

export default function PSDExplorer() {
  const s = useAsync(loadSummaries, []);
  const [field, setField] = useState<(typeof FIELDS)[number]>("d50");

  const runs = useMemo(
    () => Object.entries(s.data ?? {}).filter(([, v]) => v.method === "psd"),
    [s.data],
  );

  const option: EChartsOption = useMemo(() => {
    const cats = runs.map(([, v]) => `${v.batch_id}`);
    const means = runs.map(([, v]) => v.stats[field]?.mean ?? null);
    // error bars only when n > 1 (custom series renders the whisker)
    const errs = runs.map(([, v], i) => {
      const st = v.stats[field];
      if (!st || !showErrorBars(st) || st.mean == null || st.sd == null) return null;
      return [i, st.mean - st.sd, st.mean + st.sd];
    }).filter(Boolean) as number[][];

    return {
      tooltip: {},
      xAxis: { type: "category", data: cats, axisLabel: { rotate: 30 } },
      yAxis: { type: "value", name: `${field} (µm)` },
      series: [
        { type: "bar", data: means, name: `mean ${field}` },
        {
          type: "custom", name: "± SD (n>1)",
          renderItem: (_p: unknown, api: any) => {
            const x = api.coord([api.value(0), api.value(1)])[0];
            const yTop = api.coord([api.value(0), api.value(2)])[1];
            const yBot = api.coord([api.value(0), api.value(1)])[1];
            const w = 6;
            return {
              type: "group", children: [
                { type: "line", shape: { x1: x, y1: yTop, x2: x, y2: yBot }, style: { stroke: "#222" } },
                { type: "line", shape: { x1: x - w, y1: yTop, x2: x + w, y2: yTop }, style: { stroke: "#222" } },
                { type: "line", shape: { x1: x - w, y1: yBot, x2: x + w, y2: yBot }, style: { stroke: "#222" } },
              ],
            };
          },
          data: errs, encode: { x: 0, y: [1, 2] },
        },
      ],
    };
  }, [runs, field]);

  return (
    <Page title="PSD explorer" subtitle="Each vendor export row is a repeat. Mean ± SD; error bars only when n>1.">
      <Loading s={s} />
      <label>Metric:{" "}
        <select value={field} onChange={(e) => setField(e.target.value as typeof field)}>
          {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      {runs.length > 0 && <Chart option={option} />}
      <table>
        <thead><tr><th>Batch</th><th>Conditioning</th><th>RH%</th><th>mean {field}</th><th>SD</th><th>n</th></tr></thead>
        <tbody>
          {runs.map(([id, v]) => {
            const st = v.stats[field];
            return (
              <tr key={id}>
                <td>{v.batch_id}</td><td>{v.metadata.conditioning ?? "—"}</td>
                <td>{v.metadata.humidity_pct ?? "—"}</td>
                <td>{st?.mean?.toFixed(2) ?? "—"}</td>
                <td>{showErrorBars(st) ? st.sd!.toFixed(3) : "—"}</td>
                <td><NBadge n={st?.n ?? 0} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Page>
  );
}
