"""DSC/TGA text table -> full curve + derived mass-change event."""
from __future__ import annotations

import csv
import io
from pathlib import Path

from .common import to_float

_ALIASES = {"index": "idx", "ts": "ts", "t": "t", "hf": "hf", "weight": "weight", "tr": "tr"}


def _ws_rows(text):
    lines = [ln for ln in text.splitlines() if ln.strip()]
    if not lines:
        return []
    header = lines[0].split()
    out = []
    for ln in lines[1:]:
        parts = ln.split()
        if len(parts) == len(header):
            out.append(dict(zip(header, parts)))
    return out


def parse(path: str | Path) -> dict:
    text = Path(path).read_text(encoding="utf-8-sig", errors="replace")
    first = text.splitlines()[0] if text else ""
    delim = "\t" if "\t" in first else ("," if "," in first else None)
    rows = (list(csv.DictReader(io.StringIO(text), delimiter=delim)) if delim else _ws_rows(text))

    curve, weights = [], []
    for raw in rows:
        pt = {}
        for k, v in raw.items():
            if k is None:
                continue
            key = _ALIASES.get(k.strip().lower())
            if key:
                pt[key] = to_float(v)
        if not pt:
            continue
        if pt.get("idx") is not None:
            pt["idx"] = int(pt["idx"])
        if pt.get("weight") is not None:
            weights.append(pt["weight"])
        curve.append(pt)

    events = []
    if len(weights) >= 2 and weights[0]:
        delta = weights[-1] - weights[0]
        events.append({"event_type": "mass_change", "value_pct": 100.0 * delta / weights[0],
                       "comment": f"Total mass change {delta:.4f} mg"})
    return {"repeats": curve, "children": {"events": events}, "detected": {"n_points": len(curve)}, "warnings": []}
