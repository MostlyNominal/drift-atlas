import { useMemo } from "react";
import SummaryBar from "../components/SummaryBar";
import { Loading, NBadge, Page, useAsync } from "../components/Common";
import { loadSummaries } from "../lib/data";
import { showErrorBars } from "../lib/stats";

export default function KFExplorer() {
  const s = useAsync(loadSummaries, []);
  const runs = useMemo(
    () => Object.entries(s.data ?? {}).filter(([, v]) => v.method === "kf"),
    [s.data]);

  return (
    <Page title="KF moisture explorer"
      subtitle="Manually entered repeats. Mean ± SD ppm; error bars only when n>1.">
      <Loading s={s} />
      {runs.length === 0 && !s.loading && (
        <p className="muted">No KF data yet. Add a <code>kf.json</code> repeat list via the
          template in <code>data/templates/</code> and commit it.</p>
      )}
      {runs.length > 0 && <SummaryBar runs={runs} field="water_content_ppm" unit="Water (ppm)" />}
      <table>
        <thead><tr><th>Batch</th><th>Conditioning</th><th>RH%</th><th>mean ppm</th><th>SD</th><th>n</th></tr></thead>
        <tbody>
          {runs.map(([id, v]) => {
            const st = v.stats["water_content_ppm"];
            return (
              <tr key={id}>
                <td>{v.batch_id}</td><td>{v.metadata.conditioning ?? "—"}</td>
                <td>{v.metadata.humidity_pct ?? "—"}</td>
                <td>{st?.mean?.toFixed(1) ?? "—"}</td>
                <td>{showErrorBars(st) ? st.sd!.toFixed(2) : "—"}</td>
                <td><NBadge n={st?.n ?? 0} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Page>
  );
}
