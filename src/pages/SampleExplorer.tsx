import { loadSamples } from "../lib/data";
import { Loading, Page, useAsync } from "../components/Common";

export default function SampleExplorer() {
  const s = useAsync(loadSamples, []);
  return (
    <Page title="Sample registry" subtitle="Samples → batches (conditioning, humidity, reuse).">
      <Loading s={s} />
      {s.data?.map((sample) => (
        <div key={sample.sample_id} className="panel">
          <h3>{sample.sample_id} <span className="muted">{sample.material} · {sample.supplier} · {sample.nominal_psd}</span></h3>
          <table>
            <thead><tr><th>Batch</th><th>Conditioning</th><th>Humidity %</th><th>Reuse cycle</th></tr></thead>
            <tbody>
              {sample.batches.map((b) => (
                <tr key={b.batch_id}>
                  <td>{b.batch_id}</td><td>{b.conditioning ?? "—"}</td>
                  <td>{b.humidity_pct ?? "—"}</td><td>{b.reuse_cycle ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Page>
  );
}
