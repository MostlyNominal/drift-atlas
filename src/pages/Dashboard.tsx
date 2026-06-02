import { loadManifest, loadRuns } from "../lib/data";
import { Loading, Page, useAsync } from "../components/Common";

export default function Dashboard() {
  const m = useAsync(loadManifest, []);
  const r = useAsync(loadRuns, []);
  return (
    <Page title="Overview" subtitle="Powder characterisation atlas — static, browser-side.">
      <Loading s={m} />
      {m.data && (
        <div className="cards">
          <div className="card"><div className="big">{m.data.n_samples}</div>Samples</div>
          <div className="card"><div className="big">{m.data.n_runs}</div>Runs</div>
          <div className="card"><div className="big">{m.data.methods.length}</div>Methods</div>
        </div>
      )}
      {m.data && <p className="muted">Data generated {new Date(m.data.generated_at).toLocaleString()}.</p>}
      {m.data?.warnings?.length ? (
        <details><summary>{m.data.warnings.length} processing warnings</summary>
          <ul>{m.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </details>
      ) : null}

      <h3>Recent runs</h3>
      <Loading s={r} />
      {r.data && (
        <table>
          <thead><tr><th>Run</th><th>Sample</th><th>Batch</th><th>Method</th><th>n</th><th>Conditioning</th><th>RH%</th></tr></thead>
          <tbody>
            {r.data.slice(0, 25).map((run) => (
              <tr key={run.run_id}>
                <td className="mono">{run.run_id}</td>
                <td>{run.sample_id}</td><td>{run.batch_id}</td>
                <td>{run.method}</td><td>{run.n}</td>
                <td>{run.metadata.conditioning ?? "—"}</td>
                <td>{run.metadata.humidity_pct ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Page>
  );
}
