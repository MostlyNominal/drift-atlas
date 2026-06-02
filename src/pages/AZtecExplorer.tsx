import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import Chart from "../components/Chart";
import { Loading, Page, useAsync } from "../components/Common";
import { loadRun, loadRuns } from "../lib/data";
import type { RunDoc } from "../lib/types";

// Particle-level morphology + chemistry. ECD histogram (compare vs PSD),
// circularity vs aspect ratio, oxide-rich fraction.
export default function AZtecExplorer() {
  const runs = useAsync(loadRuns, []);
  const asem = useMemo(
    () => (runs.data ?? []).filter((r) => r.method === "asem" || r.method === "aztecfeature"),
    [runs.data]);
  const [sel, setSel] = useState("");
  const [doc, setDoc] = useState<RunDoc | null>(null);

  useEffect(() => { if (sel) loadRun(sel).then(setDoc).catch(() => setDoc(null)); }, [sel]);

  const { ecdOption, summary } = useMemo(() => {
    if (!doc) return { ecdOption: null, summary: null };
    const ps = doc.repeats as Record<string, number | boolean>[];
    const ecd = ps.map((p) => p.ecd_um as number).filter((x) => Number.isFinite(x));
    // simple histogram
    const bins = 30;
    const min = Math.min(...ecd), max = Math.max(...ecd), w = (max - min) / bins || 1;
    const counts = new Array(bins).fill(0);
    ecd.forEach((v) => { const b = Math.min(bins - 1, Math.floor((v - min) / w)); counts[b]++; });
    const cats = counts.map((_, i) => (min + (i + 0.5) * w).toFixed(1));
    const ecdOption: EChartsOption = {
      tooltip: {}, xAxis: { type: "category", data: cats, name: "ECD (µm)" },
      yAxis: { type: "value", name: "count" },
      series: [{ type: "bar", data: counts, name: "ASEM ECD" }],
    };
    const n = ps.length;
    const mean = (k: string) => ps.reduce((a, p) => a + (Number(p[k]) || 0), 0) / (n || 1);
    const frac = (k: string) => ps.filter((p) => p[k]).length / (n || 1);
    const summary = {
      n_particles: n, mean_ecd: mean("ecd_um"), mean_circularity: mean("circularity"),
      mean_aspect_ratio: mean("aspect_ratio"),
      oxide_rich_fraction: frac("is_oxide_rich"), contaminant_fraction: frac("is_contaminant"),
    };
    return { ecdOption, summary };
  }, [doc]);

  return (
    <Page title="AZtecFeature / ASEM explorer"
      subtitle="Particle-level morphology & chemistry. ECD distribution comparable to PSD.">
      <Loading s={runs} />
      <label>Run:{" "}
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">— select —</option>
          {asem.map((r) => <option key={r.run_id} value={r.run_id}>{r.batch_id} · n={r.n}</option>)}
        </select>
      </label>
      {summary && (
        <div className="cards">
          <div className="card"><div className="big">{summary.n_particles}</div>particles</div>
          <div className="card"><div className="big">{summary.mean_ecd.toFixed(1)}</div>mean ECD µm</div>
          <div className="card"><div className="big">{summary.mean_circularity.toFixed(3)}</div>mean circularity</div>
          <div className="card"><div className="big">{(summary.oxide_rich_fraction * 100).toFixed(1)}%</div>oxide-rich</div>
          <div className="card"><div className="big">{(summary.contaminant_fraction * 100).toFixed(1)}%</div>contaminant</div>
        </div>
      )}
      {ecdOption && <Chart option={ecdOption} />}
      {asem.length === 0 && !runs.loading && <p className="muted">No AZtecFeature data yet.</p>}
    </Page>
  );
}
