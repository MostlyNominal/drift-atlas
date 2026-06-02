"""GranuTap vendor export -> repeats. Hausner & Carr computed per repeat."""
from __future__ import annotations

import csv
import io
from pathlib import Path

from .common import carr, hausner, sniff_delimiter, to_float

_ALIASES = {
    "bulk density": "bulk", "aerated density": "bulk", "initial density": "bulk",
    "tapped density": "tapped", "final density": "tapped",
    "number of taps": "n_taps", "taps": "n_taps",
}


def parse(path: str | Path) -> dict:
    text = Path(path).read_text(encoding="utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text), delimiter=sniff_delimiter(text))
    repeats, warnings = [], []
    for i, raw in enumerate(reader, start=1):
        row = {}
        for k, v in raw.items():
            if k is None:
                continue
            key = _ALIASES.get(k.strip().lower())
            if key:
                row[key] = v
        bulk, tapped = to_float(row.get("bulk")), to_float(row.get("tapped"))
        repeats.append({
            "repeat_index": i,
            "bulk_density": bulk,
            "tapped_density": tapped,
            "hausner_ratio": hausner(bulk, tapped) if bulk and tapped else None,
            "carr_index": carr(bulk, tapped) if bulk and tapped else None,
            "n_taps": int(to_float(row.get("n_taps")) or 0) or None,
        })
    if not repeats:
        warnings.append("No GranuTap rows parsed.")
    return {"repeats": repeats, "children": {}, "detected": {"n": len(repeats)}, "warnings": warnings}
