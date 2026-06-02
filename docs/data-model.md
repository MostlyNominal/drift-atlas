# Data model & identity

Identity spine: **sample → batch → run → repeat**.

- **sample** — the powder identity (material, supplier, nominal PSD).
- **batch** — a physical lot + conditioning history (humidity, reuse cycle).
- **run** — one method session on one batch; deterministic `run_id` is derived
  from sample/batch/method/raw-file-hash so re-processing is reproducible.
- **repeat** — one measurement; stored separately. n is always knowable.

Authoritative metadata comes from the sidecar `*.meta.json` files, **never**
from filenames. Raw files are content-hashed (sha256) and never modified.
