# Drift Atlas (Web) — Technical Specification (v0.1)

> Initial specification for a **GitHub-hosted, static-first** powder
> characterisation database, knowledge base and visualisation website. No
> backend server; no Streamlit. This document is the design of record; the
> repository is the reference implementation (Vite + React + TypeScript,
> verified to type-check and build).

---

## 1. Recommended GitHub Pages architecture

A three-stage, fully static pipeline:

```
  data/raw/** + *.meta.json
        │  (git commit)
        ▼
  GitHub Actions: process-data.yml
     scripts/process_data.py   → public/data/processed/*.json
     scripts/make_thumbnails.py → thumbnails/ + sem.json
        │  (committed back to the repo)
        ▼
  GitHub Actions: deploy-pages.yml
     vite build (base = /<repo>/) → dist/ → GitHub Pages
        │
        ▼
  Browser: React SPA fetches static JSON, queries with Arquero, renders ECharts
```

Key properties: no server or database; all computation is either CI-time
(Python) or browser-time (TypeScript/Arquero); raw is immutable; processed JSON
is the contract between the two halves and is reproducible from raw + scripts.

## 2. React vs Vite vs Next static export vs plain HTML

**Decision: Vite + React 18 + TypeScript.**

- **Plain HTML** — rejected: too much hand-rolled state for 10 interactive explorers.
- **Next static export** — capable, but SSR/file-system routing and the `basePath`
  dance add friction for a pure client-side, data-viz SPA on Pages.
- **Vite + React** — chosen: fastest dev/build, trivial static output, `import.meta.env.BASE_URL`
  makes the Pages sub-path clean, and **HashRouter** gives working deep links on
  Pages with zero server rewrites (no 404 fallback hack needed).

## 3. Full repository structure

```
drift-atlas-web/
├── index.html
├── package.json · vite.config.ts · tsconfig.json · .gitignore · .gitattributes (LFS)
├── .github/workflows/{process-data.yml, deploy-pages.yml}
├── src/
│   ├── main.tsx · App.tsx · vite-env.d.ts
│   ├── styles/app.css
│   ├── lib/{types.ts, data.ts, stats.ts}
│   ├── components/{Chart.tsx, SummaryBar.tsx, Common.tsx}
│   └── pages/{Dashboard, SampleExplorer, PSDExplorer, KFExplorer,
│              GranuTapExplorer, GranuDrumExplorer, SEMExplorer,
│              AZtecExplorer, CorrelationExplorer, ComparisonTool}.tsx
├── scripts/
│   ├── requirements.txt · process_data.py · make_thumbnails.py
│   └── parsers/{common, psd, granutap, granudrum, aztecfeature, dsc_tga, ft4}.py
├── data/
│   ├── raw/**            (immutable raw + sidecar *.meta.json)
│   └── templates/        (copy-and-fill entry templates + README)
├── public/
│   ├── .nojekyll
│   └── data/processed/   (CI-generated static JSON the site fetches)
├── tests/stats.test.ts
└── docs/                 (methods & knowledge base, this spec)
```

## 4. Data folder structure

Folder layout is a human convenience; the **sidecar metadata is authoritative**.

```
data/raw/<sample_id>/
  sample.meta.json
  <batch_id>/
    batch.meta.json
    psd/ granutap/ kf/ granudrum/ ft4/ asem/ dsc_tga/ xrd/ sem/ ebsd/
      <export-file>            # raw, never modified
      <export-file>.meta.json  # authoritative operator/instrument/datetime/mode
```

## 5. Raw data format rules

- Every raw export keeps its original bytes; a sibling `<file>.meta.json`
  carries authoritative metadata. Names are labels only.
- **KF**: manual `kf.json` (or `kf_template.csv`) with a `repeats[]` array.
- **PSD**: vendor text export; **each row is a repeat**.
- **GranuTap**: vendor export; each row a repeat.
- **GranuDrum/Flow**: `.ini`-style; **test mode detected from content**, not name;
  speed-level arrays preserved.
- **FT4**: `.prb` stored verbatim (Git LFS); CSV summary parsed for numbers;
  undecodable `.prb` → `prb_pending`.
- **ASEM**: full particle export (one row per particle).
- **DSC/TGA**: `Index, Ts, t, HF, Weight, Tr` table; full curve kept.
- **XRD**: uploaded result or manual phase CSV.
- **SEM**: images + per-image `*.meta.json`. **EBSD**: file + comments only.

## 6. Processed JSON / Parquet format

Written to `public/data/processed/`:

- `manifest.json` — `{generated_at, n_samples, n_runs, methods[], warnings[]}`.
- `samples.json` — sample registry with nested `batches[]`.
- `runs.json` — lightweight run index (`run_id, sample_id, batch_id, method, n, metadata`).
- `summaries.json` — per-run `stats` of `{n, mean, sd, sem}` per field (SD null when n<2).
- `runs/<run_id>.json` — full run doc: authoritative `metadata`, `raw_file`
  (`original_name`, `sha256`, `path`), `repeats[]`, `children{}`, `detected{}`.
- `sem.json` + `thumbnails/` — SEM index + generated thumbnails.

Parquet is a planned add-on (v0.4+) for large ASEM particle tables, queried via
DuckDB-WASM; JSON covers the MVP without WASM bundle cost.

## 7. GitHub Actions workflow for processing raw data

`process-data.yml` (triggers on `data/raw/**`, `data/templates/**`, `scripts/**`):
checkout (LFS) → setup Python → `pip install -r scripts/requirements.txt` →
`process_data.py --raw data/raw --out public/data/processed` →
`make_thumbnails.py` → commit processed JSON back with `[skip ci]`.
`deploy-pages.yml` then builds with `VITE_BASE=/<repo>/` and deploys via
`actions/deploy-pages`. (Both workflow files are in the repo.)

## 8. Browser-side data loading strategy

`src/lib/data.ts` fetches from `` `${import.meta.env.BASE_URL}data/processed` ``
so paths resolve identically in dev and on Pages. Responses are cached in a
`Map`. **Arquero** builds tidy/wide tables in-browser: `summariesTable()` (one
row per run×field) and `featureTable()` (one wide row per batch for
correlation). DuckDB-WASM is reserved for future SQL-over-Parquet. The same
`stats.ts` rule lets the browser also summarise repeats from client-side uploads.

## 9. Dashboard page design

`Dashboard.tsx`: headline cards (samples / runs / methods), data-generation
timestamp, collapsible processing warnings, and a recent-runs table showing
sample, batch, method, **n**, conditioning and humidity — the at-a-glance entry
point.

## 10. Sample explorer

`SampleExplorer.tsx`: the registry — each sample with material/supplier/nominal
PSD and a nested batch table (conditioning, humidity, reuse cycle), reading
`samples.json`.

## 11. PSD explorer

`PSDExplorer.tsx`: metric selector (D10/D50/D90/span); bar chart of per-batch
means with a **custom ECharts error-bar series rendered only when n > 1**; table
with mean, SD and an `n=` badge. Each vendor row counted as a repeat upstream.

## 12. KF moisture explorer

`KFExplorer.tsx`: mean ± SD ppm per batch via the shared `SummaryBar`
(conditional error bars), table with n badges, and guidance to add `kf.json`
when empty. Manual entry, every repeat stored separately.

## 13. GranuTap explorer

`GranuTapExplorer.tsx`: bulk/tapped density, Hausner ratio, Carr index;
`SummaryBar` mean ± SD (n>1 only) + table.

## 14. GranuDrum explorer

`GranuDrumExplorer.tsx`: run + Y-variable (dynamic angle / cohesive index /
interface roughness) selectors; **one line trace per repeat vs rotation speed**
from preserved speed-level data; test mode (content-detected) shown in the run
list. Mean ± SD overlay is the v0.2 increment.

## 15. SEM image explorer

`SEMExplorer.tsx`: responsive thumbnail gallery from `sem.json` with
sample filter; captions show magnification/detector/kV/WD/notes; thumbnails
generated in CI; click opens the full-resolution raw image.

## 16. AZtecFeature explorer

`AZtecExplorer.tsx`: per-run summary cards (particle count, mean ECD,
circularity, oxide-rich %, contaminant %) and an **ECD histogram** built for
direct comparison against PSD Dx values. Particle-level morphology + chemistry
stored upstream with oxide/contaminant flags.

## 17. Correlation explorer

`CorrelationExplorer.tsx`: Arquero `featureTable()` → one wide row per batch;
choose any numeric X/Y; scatter + live **Pearson r**. Built for humidity↔flow,
PSD↔BFE, circularity↔Hausner, oxygen↔cohesion — with an explicit
correlation≠causation caveat.

## 18. Comparison tool

`ComparisonTool.tsx`: pick a method + metric and a set of batches (checkboxes);
side-by-side `SummaryBar` (mean ± SD, n>1 only) and a table spanning material,
supplier, conditioning, humidity — covering every required comparison axis.

## 19. Wiki / docs method structure

`/docs` (mirrored to the Wiki): `index`, `data-model`, `ingestion`,
`statistics`, `methods`, `analysis`, `glossary`. Methodology and conventions
live here; the processed JSON is the authoritative data.

## 20. Example templates for user data entry

`data/templates/`: `sample.meta.json`, `batch.meta.json`, `file.meta.json`,
`kf.json` + `kf_template.csv`, `sem.meta.json`, `psd_example_export.csv`,
`granutap_example_export.csv`, `xrd_manual_template.csv`, plus a README mapping
each to its place in the raw tree.

## 21. Starter code structure

All implemented and verified (`tsc --noEmit` clean; `vite build` succeeds;
shared stats rule unit-tested in Python and TypeScript): the Python pipeline
(`process_data.py`, `make_thumbnails.py`, 6 parsers + `common`), the React app
(`App`, 10 pages, `Chart`/`SummaryBar`/`Common` components, `types`/`data`/`stats`
libs), both workflows, and a worked example dataset that processes into
`summaries.json` with correct n=2 and n=3 SDs.

## 22. README draft

See [`../README.md`](../README.md): branding, static-first architecture diagram,
stack table with rationale, quick start, layout, design rules and roadmap.

## 23. Roadmap

- **MVP** — Pages site · static data files · sample registry · manual KF
  template · PSD upload processing · GranuTap processing · SEM image metadata ·
  overview dashboard · mean/SD/n + error bars. *(Scaffolded, type-checked, building.)*
- **v0.2** — GranuDrum/GranuFlow speed-level traces with mean ± SD overlays.
- **v0.3** — AZtecFeature/ASEM particle morphology + chemistry; ECD-vs-PSD overlay.
- **v0.4** — FT4 (`.prb` + CSV summary), DSC/TGA curves with event markers, XRD
  phases; in-browser upload preview before commit.
- **Future** — DuckDB-WASM SQL over Parquet for large particle tables; SEM image
  feature extraction (satellites/morphology); correlation matrix; feature
  importance; flowability prediction from PSD + moisture + morphology + chemistry.

---

*End of specification v0.1.*
