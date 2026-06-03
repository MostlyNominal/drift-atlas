# Ingestion & GitHub Actions

1. Commit raw files + sidecar metadata under `data/raw/...`.
2. `process-data.yml` runs `scripts/process_data.py`, which walks the tree,
   dispatches each file to a content-aware parser, computes mean/SD/n, and
   writes static JSON to `public/data/processed/`.
3. `make_thumbnails.py` builds SEM thumbnails + `sem.json`.
4. The workflow commits processed JSON back; `deploy-pages.yml` builds the Vite
   site and publishes to GitHub Pages.

Processed outputs: `manifest.json`, `samples.json`, `runs.json`,
`summaries.json`, `runs/<run_id>.json`, `sem.json`, `thumbnails/`.
