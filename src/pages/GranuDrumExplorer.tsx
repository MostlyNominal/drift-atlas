import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import Chart from "../components/Chart";
import { Loading, Page, useAsync } from "../components/Common";
import { loadRun, loadRuns } from "../lib/data";
import type { RunDoc } from "../lib/types";

// Plots angle/cohesion/roughness vs rotation speed, one trace per repeat.
export default function GranuDrumExplorer() {
  const runs = useAsync(loadRuns, []);
  const gdRuns = useMemo(
    () => (runs.data ?? []).filter((r) => r.method === "granudrum" || r.method === "granuflow"),
    [runs.data]);
  const [selected, setSelected] = useState<string>("");
  const [doc, setDoc] = useState<RunDoc | null>(null);
  const [yField, setYField] = useState<"dynamic_angle" | "cohesive_index" | "interface_roughness">("dynamic_angle");

  useEffect(() => {
    if (selected) loadRun(selected).then(setDoc).catch(() => setDoc(null));
  }, [selected]);

  const option: EChartsOption | null = useMemo(() => {
    if (!doc) return null;
    const pts = (doc.children?.speed_points ?? []) as Record<string, number>[];
    const repeats = [...new Set(pts.map((p) => p.repeat_index))];
    const series = repeats.map((ri) => ({
      type: "line" as const, name: `repeat ${ri}`, showSymbol: true,
      data: pts.filter((p) => p.repeat_index === ri)
        .sort((a, b) => a.rotation_speed_rpm - b.rotation_speed_rpm)
        .map((p) => [p.rotation_speed_rpm, p[yField]]),
    }));
    return {
      tooltip: { trigger: "axis" }, legend: {},
      xAxis: { type: "value", name: "rotation speed (rpm)" },
      yAxis: { type: "value", name: yField },
      series,
    };
  }, [doc, yField]);

  return (
    <Page title="GranuDrum / GranuFlow explorer"
      subtitle="Test mode detected from file content. Repeat traces vs speed; mean ± SD overlay planned (v0.2).">
      <Loading s={runs} />
      <label>Run:{" "}
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">— select —</option>
          {gdRuns.map((r) => (
            <option key={r.run_id} value={r.run_id}>
              {r.batch_id} · {r.metadata.test_mode ?? "mode?"} · n={r.n}
            </option>
          ))}
        </select>
      </label>{" "}
      <label>Y:{" "}
        <select value={yField} onChange={(e) => setYField(e.target.value as typeof yField)}>
          <option value="dynamic_angle">dynamic angle</option>
          <option value="cohesive_index">cohesive index</option>
          <option value="interface_roughness">interface roughness</option>
        </select>
      </label>
      {option && <Chart option={option} />}
      {gdRuns.length === 0 && !runs.loading && <p className="muted">No GranuDrum data yet.</p>}
    </Page>
  );
}
