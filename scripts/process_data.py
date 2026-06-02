#!/usr/bin/env python3
"""
process_data.py — Drift Atlas raw -> processed JSON pipeline.

Walks data/raw/<sample_id>/<batch_id>/<method>/ and, for each raw export
accompanied by a sidecar `*.meta.json`, parses it into repeat-level records,
computes mean/SD/n summaries, and writes static JSON under
public/data/processed/ for the website to fetch().

Directory convention (METADATA, not filenames, is authoritative — the sidecar
JSON carries the real ids; the folder layout is a human convenience):

    data/raw/
      <sample_id>/
        sample.meta.json                  # sample-level registry entry
        <batch_id>/
          batch.meta.json                 # batch conditioning/humidity/supplier
          psd/  export.csv  export.csv.meta.json
          granutap/ ...
          ...

Outputs (all static, browser-fetchable):
    public/data/processed/manifest.json   # index of everything
    public/data/processed/samples.json    # sample + batch registry
    public/data/processed/runs/<run_id>.json
    public/data/processed/summaries.json  # per-run mean/SD/n for fast dashboards

Raw is NEVER modified. Output is reproducible from raw + this script.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

from parsers import aztecfeature, dsc_tga, ft4, granudrum, granutap, psd
from parsers.common import summarise

METHOD_PARSERS = {
    "psd": psd.parse,
    "granutap": granutap.parse,
    "granudrum": granudrum.parse,
    "granuflow": granudrum.parse,
    "asem": aztecfeature.parse,
    "aztecfeature": aztecfeature.parse,
    "dsc_tga": dsc_tga.parse,
    "ft4": ft4.parse,
}

# which numeric fields get mean/SD/n summaries per method
SUMMARY_FIELDS = {
    "psd": ["d10", "d50", "d90", "span"],
    "granutap": ["bulk_density", "tapped_density", "hausner_ratio", "carr_index"],
    "granudrum": ["cohesive_index", "avg_dynamic_angle"],
    "kf": ["water_content_ppm"],
    "ft4": ["bfe_mJ", "stability_index", "cohesion_kPa"],
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def load_meta(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def run_id_for(sample_id, batch_id, method, raw_path: Path) -> str:
    base = f"{sample_id}|{batch_id}|{method}|{raw_path.name}|{sha256(raw_path)[:12]}"
    return "run_" + hashlib.sha256(base.encode()).hexdigest()[:12]


def summarise_run(method: str, repeats: list[dict]) -> dict:
    out = {}
    for field in SUMMARY_FIELDS.get(method, []):
        out[field] = summarise([r.get(field) for r in repeats])
    return out


def process(raw_dir: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "runs").mkdir(exist_ok=True)

    samples, runs_index, summaries, warnings = [], [], {}, []

    for sample_dir in sorted(p for p in raw_dir.iterdir() if p.is_dir()):
        sample_meta = load_meta(sample_dir / "sample.meta.json")
        sample_id = sample_meta.get("sample_id", sample_dir.name)
        batches = []

        for batch_dir in sorted(p for p in sample_dir.iterdir() if p.is_dir()):
            batch_meta = load_meta(batch_dir / "batch.meta.json")
            batch_id = batch_meta.get("batch_id", batch_dir.name)
            batches.append({"batch_id": batch_id, **batch_meta})

            for method_dir in sorted(p for p in batch_dir.iterdir() if p.is_dir()):
                method = method_dir.name.lower()
                parser = METHOD_PARSERS.get(method)
                for raw_path in sorted(method_dir.iterdir()):
                    if raw_path.name.endswith(".meta.json") or raw_path.is_dir():
                        continue
                    file_meta = load_meta(Path(str(raw_path) + ".meta.json"))
                    rid = run_id_for(sample_id, batch_id, method, raw_path)

                    # KF/XRD/EBSD: handled as JSON/CSV templates or metadata-only
                    if parser is None:
                        result = {"repeats": file_meta.get("repeats", []),
                                  "children": {}, "detected": {}, "warnings": []}
                    else:
                        result = parser(raw_path)

                    for w in result.get("warnings", []):
                        warnings.append(f"{rid}: {w}")

                    run_doc = {
                        "run_id": rid,
                        "sample_id": sample_id,
                        "batch_id": batch_id,
                        "method": method,
                        # authoritative metadata overrides anything inside the file
                        "metadata": {
                            "material": sample_meta.get("material"),
                            "supplier": sample_meta.get("supplier"),
                            "nominal_psd": sample_meta.get("nominal_psd"),
                            "conditioning": batch_meta.get("conditioning"),
                            "humidity_pct": batch_meta.get("humidity_pct"),
                            "reuse_cycle": batch_meta.get("reuse_cycle"),
                            "operator": file_meta.get("operator"),
                            "instrument": file_meta.get("instrument"),
                            "run_datetime": file_meta.get("run_datetime"),
                            "test_mode": result.get("detected", {}).get("test_mode")
                            or file_meta.get("test_mode"),
                        },
                        "raw_file": {
                            "original_name": raw_path.name,   # label only
                            "sha256": sha256(raw_path),
                            "path": str(raw_path.relative_to(raw_dir.parent)),
                        },
                        "n": len(result["repeats"]),
                        "repeats": result["repeats"],
                        "children": result.get("children", {}),
                        "detected": result.get("detected", {}),
                    }
                    (out_dir / "runs" / f"{rid}.json").write_text(
                        json.dumps(run_doc, indent=2), encoding="utf-8")

                    runs_index.append({
                        "run_id": rid, "sample_id": sample_id, "batch_id": batch_id,
                        "method": method, "n": run_doc["n"],
                        "metadata": run_doc["metadata"],
                    })
                    summaries[rid] = {
                        "method": method, "sample_id": sample_id, "batch_id": batch_id,
                        "metadata": run_doc["metadata"],
                        "stats": summarise_run(method, result["repeats"]),
                    }

        samples.append({"sample_id": sample_id, **sample_meta, "batches": batches})

    manifest = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "n_samples": len(samples),
        "n_runs": len(runs_index),
        "methods": sorted({r["method"] for r in runs_index}),
        "warnings": warnings,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (out_dir / "samples.json").write_text(json.dumps(samples, indent=2), encoding="utf-8")
    (out_dir / "runs.json").write_text(json.dumps(runs_index, indent=2), encoding="utf-8")
    (out_dir / "summaries.json").write_text(json.dumps(summaries, indent=2), encoding="utf-8")
    return manifest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default="data/raw")
    ap.add_argument("--out", default="public/data/processed")
    args = ap.parse_args()
    manifest = process(Path(args.raw), Path(args.out))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
