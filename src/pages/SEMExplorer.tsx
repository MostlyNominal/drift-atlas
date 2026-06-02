import { useMemo, useState } from "react";
import { Loading, Page, useAsync } from "../components/Common";
import { loadSem } from "../lib/data";

const BASE = import.meta.env.BASE_URL;

export default function SEMExplorer() {
  const s = useAsync(loadSem, []);
  const [sample, setSample] = useState<string>("");
  const samples = useMemo(
    () => [...new Set((s.data ?? []).map((i) => i.sample_id).filter(Boolean))] as string[],
    [s.data]);
  const imgs = (s.data ?? []).filter((i) => !sample || i.sample_id === sample);

  return (
    <Page title="SEM image explorer" subtitle="Up to ~10 images per sample, with metadata. Thumbnails generated in CI.">
      <Loading s={s} />
      {samples.length > 0 && (
        <label>Sample:{" "}
          <select value={sample} onChange={(e) => setSample(e.target.value)}>
            <option value="">all</option>
            {samples.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
      )}
      <div className="gallery">
        {imgs.map((img, i) => (
          <figure key={i} className="card">
            <a href={`${BASE}${img.image_path}`} target="_blank" rel="noreferrer">
              <img src={`${BASE}data/processed/${img.thumbnail}`} alt={img.notes ?? "SEM"} loading="lazy" />
            </a>
            <figcaption>
              <strong>{img.sample_id}</strong><br />
              {img.magnification}× · {img.detector} · {img.accelerating_voltage_kV} kV · WD {img.working_distance_mm} mm
              {img.notes && <><br /><em>{img.notes}</em></>}
            </figcaption>
          </figure>
        ))}
      </div>
      {imgs.length === 0 && !s.loading && (
        <p className="muted">No SEM images indexed. Commit images + <code>*.meta.json</code> under
          <code> data/raw/&lt;sample&gt;/&lt;batch&gt;/sem/</code> and CI will build thumbnails.</p>
      )}
    </Page>
  );
}
