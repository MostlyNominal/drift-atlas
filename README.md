<div align="center">

# 🌀 Drift Atlas

**A static-first powder characterisation database, knowledge base and visualisation website for metallic powders.**

### 👉 Visit the live site: **https://mostlynominal.github.io/drift-atlas/**

*Runs entirely from GitHub Pages — no backend, no server database. Commit raw data → GitHub Actions process it → the browser visualises it.*

</div>

---

## ⚠️ How to use this site

**Just open the website in your browser:**

> ### **https://mostlynominal.github.io/drift-atlas/**

Do **not** download the repo and open `index.html` from your computer — it will
not work that way (the app loads data over HTTP and resolves asset paths against
the `/drift-atlas/` base). There is **nothing to install**. Anyone can view the
site by visiting the URL above.

The build/processing steps below are **only for contributors** who want to add
new data files or develop the app. Viewers never run anything locally.

---

## What this is

Drift Atlas turns a GitHub repository into a growing, queryable atlas of powder
characterisation data. You commit raw instrument exports; a GitHub Action
processes them into clean static JSON; a React/TypeScript single-page app
(served from GitHub Pages) loads and visualises that JSON **in the browser**.

It is built to answer how powders **drift** — and to compare:

same alloy at different PSD · different humidity · different conditioning history · different suppliers · different batches · different morphology · different chemistry · different XRD phase content · different flowability.

## Architecture (static-first)

```
 commit raw files ──► GitHub Actions (Python) ──► public/data/processed/*.json ──► GitHub Pages
   data/raw/**          process_data.py               manifest / summaries           Vite + React + TS
   + *.meta.json        make_thumbnails.py             runs/<id>.json                 ECharts + Arquero
                                                       sem.json + thumbnails          (all in-browser)
```

- **No backend.** All querying happens client-side with **Arquero** (and
  optionally DuckDB-WASM for SQL over Parquet later).
- **Raw is immutable.** Processed JSON is fully reproducible from raw + scripts.
- **Metadata is authoritative.** Filenames are labels only.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | **Vite + React 18 + TypeScript** | fastest path to a static SPA on Pages; see spec §2 |
| Routing | `react-router-dom` **HashRouter** | deep links work on Pages with no server rewrites |
| Charts | **Apache ECharts** (`echarts-for-react`) | custom error-bar rendering; Plotly.js swappable in `Chart.tsx` |
| Querying | **Arquero** | in-browser dataframes/joins; no WASM bundle weight for MVP |
| Processing | **Python** in GitHub Actions | parsers + mean/SD/n + thumbnails |
| Docs | `/docs` + GitHub Wiki | methods & knowledge base |

## Contributors only — local development

## Contributors only — adding data

You add data by **committing files to GitHub**, not by running a server:

1. Drop raw exports + `*.meta.json` sidecars under `data/raw/<sample>/<batch>/<method>/`
   (see [`data/templates/`](data/templates/README.md)).
2. Commit and push to `main`.
3. `process-data.yml` regenerates `public/data/processed/*.json` and commits it back.
4. `deploy-pages.yml` rebuilds and redeploys the site automatically.

That's it — no local build, no manual deploy.

## Deployment (one-time repo setup)

The site deploys itself via GitHub Actions. To enable it on a fresh repo:

1. **Name the repository `drift-atlas`** so it serves at
   `https://<owner>.github.io/drift-atlas/` (this matches the `base` in
   `vite.config.ts`). For this project that is
   **https://mostlynominal.github.io/drift-atlas/**.
2. In **Settings → Pages → Build and deployment**, set **Source = "GitHub Actions"**
   (not "Deploy from a branch").
3. Push to `main`. The **Deploy to GitHub Pages** workflow builds with
   `VITE_BASE=/drift-atlas/` and publishes `dist/`.
4. Open the live URL. Every subsequent push to `main` redeploys automatically.

> If you fork under a different repo name, change the `base` in `vite.config.ts`
> (and the workflow's `VITE_BASE`) to `/<your-repo-name>/`.

## Repository layout

```
drift-atlas-web/
├── index.html                  # Vite entry
├── package.json · vite.config.ts · tsconfig.json
├── .github/workflows/
│   ├── process-data.yml        # raw → processed JSON (commits back)
│   └── deploy-pages.yml        # build + deploy to GitHub Pages
├── src/
│   ├── App.tsx · main.tsx
│   ├── lib/      types.ts · data.ts (Arquero) · stats.ts (mean/SD/n rule)
│   ├── components/ Chart.tsx · SummaryBar.tsx · Common.tsx
│   └── pages/    Dashboard · SampleExplorer · PSD · KF · GranuTap ·
│                 GranuDrum · SEM · AZtec · Correlation · Comparison
├── scripts/
│   ├── process_data.py · make_thumbnails.py
│   └── parsers/  common · psd · granutap · granudrum · aztecfeature · dsc_tga · ft4
├── data/
│   ├── raw/        immutable raw + *.meta.json (authoritative)
│   └── templates/  copy-and-fill data entry templates
├── public/data/processed/      static JSON the site fetches (built by CI)
└── docs/                       methods & knowledge base
```

## Design rules (non-negotiable)

1. Works from **GitHub Pages** as a static site — no server, no server DB.
2. Website loads **static data files** generated from raw uploads.
3. Raw data is **never** modified; processed data is **reproducible**.
4. Filenames are **not trusted**; user metadata is **authoritative**.
5. Repeats are optional (n = 1, 2, 3+). **Always display n. Error bars only when n > 1.**

## Roadmap

- **MVP** — Pages site, static data, sample registry, manual KF, PSD + GranuTap processing, SEM metadata, overview dashboard, mean/SD/n + error bars. *(Scaffolded and building in this repo.)*
- **v0.2** — GranuDrum/GranuFlow speed-level traces with mean ± SD overlays.
- **v0.3** — AZtecFeature/ASEM particle morphology + chemistry; ECD-vs-PSD.
- **v0.4** — FT4 (+`.prb`/CSV), DSC/TGA curves, XRD phases; client-side upload preview.
- **Future** — DuckDB-WASM SQL over Parquet, SEM feature extraction, correlation matrix, feature importance, flowability prediction.

See [`docs/technical_specification.md`](docs/technical_specification.md) for the full design.

## License

MIT — see [LICENSE](LICENSE).
