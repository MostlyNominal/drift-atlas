// Browser-side data loading. Static JSON is fetched from the deployed base
// path; Arquero is used for in-browser tabular querying / joins / filters.
import { from as aqFrom } from "arquero";
import type {
  Manifest, RunDoc, RunIndexEntry, RunSummary, Sample, SemImage,
} from "./types";

// import.meta.env.BASE_URL is injected by Vite and equals the GitHub Pages
// base (e.g. "/drift-atlas-web/"), so fetches work both in dev and on Pages.
const DATA = `${import.meta.env.BASE_URL}data/processed`;

const cache = new Map<string, unknown>();

async function getJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(`${DATA}/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(path, data);
  return data;
}

export const loadManifest = () => getJSON<Manifest>("manifest.json");
export const loadSamples = () => getJSON<Sample[]>("samples.json");
export const loadRuns = () => getJSON<RunIndexEntry[]>("runs.json");
export const loadSummaries = () => getJSON<Record<string, RunSummary>>("summaries.json");
export const loadRun = (runId: string) => getJSON<RunDoc>(`runs/${runId}.json`);
export const loadSem = () => getJSON<SemImage[]>("sem.json").catch(() => [] as SemImage[]);

/** Flatten summaries into a tidy Arquero table: one row per (run, field). */
export async function summariesTable() {
  const summaries = await loadSummaries();
  const rows: Record<string, unknown>[] = [];
  for (const [runId, s] of Object.entries(summaries)) {
    for (const [field, stat] of Object.entries(s.stats)) {
      rows.push({
        run_id: runId, method: s.method, sample_id: s.sample_id,
        batch_id: s.batch_id, field,
        ...s.metadata, n: stat.n, mean: stat.mean, sd: stat.sd, sem: stat.sem,
      });
    }
  }
  return aqFrom(rows);
}

/** One wide feature row per batch for the correlation explorer. */
export async function featureTable() {
  const summaries = await loadSummaries();
  const byBatch = new Map<string, Record<string, unknown>>();
  for (const s of Object.values(summaries)) {
    const key = s.batch_id;
    const row = byBatch.get(key) ?? {
      batch_id: s.batch_id, sample_id: s.sample_id,
      material: s.metadata.material, supplier: s.metadata.supplier,
      conditioning: s.metadata.conditioning, humidity_pct: s.metadata.humidity_pct,
      reuse_cycle: s.metadata.reuse_cycle,
    };
    for (const [field, stat] of Object.entries(s.stats)) {
      row[`${s.method}_${field}`] = stat.mean;
    }
    byBatch.set(key, row);
  }
  return aqFrom([...byBatch.values()]);
}
