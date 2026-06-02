import { useMemo, useState } from "react";
import SummaryBar from "../components/SummaryBar";
import { Loading, NBadge, Page, useAsync } from "../components/Common";
import { loadSummaries } from "../lib/data";
import { showErrorBars } from "../lib/stats";

const FIELDS = ["bulk_density", "tapped_density", "hausner_ratio", "carr_index"] as const;

export default function GranuTapExplorer() {
  const s = useAsync(loadSummaries, []);
  const [field, setField] = useState<(typeof FIELDS)[number]>("hausner_ratio");
  const runs = useMemo(
    () => Object.entries(s.data ?? {}).filter(([, v]) => v.method === "granutap"),
    [s.data]);

  return (
    <Page title="GranuTap explorer" subtitle="Bulk/tapped density, Hausner ratio, Carr index. Error bars only when n>1.">
      <Loading s={s} />
      <label>Metric:{" "}
        <select value={field} onChange={(e) => setField(e.target.value as typeof field)}>
          {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      {runs.length > 0 && <SummaryBar runs={runs} field={field} />}
      <table>
        <thead><tr><th>Batch</th><th>Conditioning</th><th>mean {field}</th><th>SD</th><th>n</th></tr></thead>
        <tbody>
          {runs.map(([id, v]) => {
            const st = v.stats[field];
            return (
              <tr key={id}>
                <td>{v.batch_id}</td><td>{v.metadata.conditioning ?? "—"}</td>
                <td>{st?.mean?.toFixed(3) ?? "—"}</td>
                <td>{showErrorBars(st) ? st.sd!.toFixed(4) : "—"}</td>
                <td><NBadge n={st?.n ?? 0} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Page>
  );
}
