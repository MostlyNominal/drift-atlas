import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import Chart from "../components/Chart";
import { Loading, Page, useAsync } from "../components/Common";
import { featureTable } from "../lib/data";
import { pearson } from "../lib/stats";

// Cross-method correlations: humidity↔flow, PSD↔BFE, circularity↔Hausner, etc.
export default function CorrelationExplorer() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [numeric, setNumeric] = useState<string[]>([]);
  const state = useAsync(async () => {
    const t = await featureTable();
    const objs = t.objects() as Record<string, unknown>[];
    const cols = t.columnNames().filter((c: string) =>
      objs.some((r) => typeof r[c] === "number"));
    return { objs, cols };
  }, []);

  useEffect(() => {
    if (state.data) { setRows(state.data.objs); setNumeric(state.data.cols); }
  }, [state.data]);

  const [x, setX] = useState("humidity_pct");
  const [y, setY] = useState("granutap_hausner_ratio");

  const { option, r } = useMemo(() => {
    const pts = rows.map((row) => [row[x] as number, row[y] as number, String(row["batch_id"])] as [number, number, string])
      .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    const r = pearson(pts.map((p) => p[0]), pts.map((p) => p[1]));
    const option: EChartsOption = {
      tooltip: { formatter: (p: any) => `${p.data[2]}<br/>${x}=${p.data[0]}<br/>${y}=${p.data[1]}` },
      xAxis: { type: "value", name: x }, yAxis: { type: "value", name: y },
      series: [{ type: "scatter", symbolSize: 14, data: pts as unknown as (number | string)[][] }],
    };
    return { option, r };
  }, [rows, x, y]);

  return (
    <Page title="Correlation explorer"
      subtitle="One feature row per batch. Inspect repeats before drawing conclusions — correlation ≠ causation.">
      <Loading s={state} />
      {numeric.length > 0 && (
        <div className="controls">
          <label>X:{" "}<select value={x} onChange={(e) => setX(e.target.value)}>
            {numeric.map((c) => <option key={c}>{c}</option>)}</select></label>{" "}
          <label>Y:{" "}<select value={y} onChange={(e) => setY(e.target.value)}>
            {numeric.map((c) => <option key={c}>{c}</option>)}</select></label>{" "}
          <strong>Pearson r = {r == null ? "n/a" : r.toFixed(3)}</strong>
        </div>
      )}
      {rows.length > 0 && <Chart option={option} />}
    </Page>
  );
}
