import { useMemo, useState } from "react";
import SummaryBar from "../components/SummaryBar";
import { Loading, NBadge, Page, useAsync } from "../components/Common";
import { loadSummaries } from "../lib/data";
import { showErrorBars } from "../lib/stats";

// Compare selected batches side by side across a chosen method/metric.
const METHOD_FIELDS: Record<string, string[]> = {
  psd: ["d10", "d50", "d90", "span"],
  granutap: ["bulk_density", "tapped_density", "hausner_ratio", "carr_index"],
  kf: ["water_content_ppm"],
};

export default function ComparisonTool() {
  const s = useAsync(loadSummaries, []);
  const [method, setMethod] = useState("granutap");
  const [field, setField] = useState("hausner_ratio");
  const [picked, setPicked] = useState<string[]>([]);

  const runs = useMemo(
    () => Object.entries(s.data ?? {}).filter(([, v]) => v.method === method),
    [s.data, method]);
  const filtered = picked.length ? runs.filter(([, v]) => picked.includes(v.batch_id)) : runs;
  const batches = [...new Set(runs.map(([, v]) => v.batch_id))];

  return (
    <Page title="Comparison tool"
      subtitle="Compare alloys, PSDs, humidity, conditioning, suppliers, batches — side by side.">
      <Loading s={s} />
      <div className="controls">
        <label>Method:{" "}
          <select value={method} onChange={(e) => { setMethod(e.target.value); setField(METHOD_FIELDS[e.target.value][0]); }}>
            {Object.keys(METHOD_FIELDS).map((m) => <option key={m}>{m}</option>)}
          </select></label>{" "}
        <label>Metric:{" "}
          <select value={field} onChange={(e) => setField(e.target.value)}>
            {METHOD_FIELDS[method].map((f) => <option key={f}>{f}</option>)}
          </select></label>
      </div>
      <fieldset>
        <legend>Batches ({picked.length || "all"})</legend>
        {batches.map((b) => (
          <label key={b} className="chk">
            <input type="checkbox" checked={picked.includes(b)}
              onChange={(e) => setPicked((p) => e.target.checked ? [...p, b] : p.filter((x) => x !== b))} />
            {b}
          </label>
        ))}
      </fieldset>
      {filtered.length > 0 && <SummaryBar runs={filtered} field={field} />}
      <table>
        <thead><tr><th>Batch</th><th>Material</th><th>Supplier</th><th>Conditioning</th><th>RH%</th><th>mean {field}</th><th>SD</th><th>n</th></tr></thead>
        <tbody>
          {filtered.map(([id, v]) => {
            const st = v.stats[field];
            return (
              <tr key={id}>
                <td>{v.batch_id}</td><td>{v.metadata.material ?? "—"}</td>
                <td>{v.metadata.supplier ?? "—"}</td><td>{v.metadata.conditioning ?? "—"}</td>
                <td>{v.metadata.humidity_pct ?? "—"}</td>
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
