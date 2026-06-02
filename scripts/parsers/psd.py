"""PSD vendor text export -> repeats. Each row is one repeat."""
from __future__ import annotations

import csv
import io
from pathlib import Path

from .common import sniff_delimiter, span, to_float

_ALIASES = {
    "record number": "record_number",
    "sample name": "sample_name",
    "measurement date time": "measurement_dt",
    "dx (10)": "d10", "dx(10)": "d10", "d10": "d10",
    "dx (50)": "d50", "dx(50)": "d50", "d50": "d50",
    "dx (90)": "d90", "dx(90)": "d90", "d90": "d90",
    "operator name": "operator",
    "instrument serial no.": "instrument_serial",
    "instrument serial no": "instrument_serial",
    "dispersant name": "dispersant",
    "stirrer speed achieved": "stirrer_speed_rpm",
}


def parse(path: str | Path) -> dict:
    text = Path(path).read_text(encoding="utf-8-sig", errors="replace")
    delim = sniff_delimiter(text)
    reader = csv.DictReader(io.StringIO(text), delimiter=delim)
    repeats, warnings = [], []
    for i, raw in enumerate(reader, start=1):
        row = {}
        for k, v in raw.items():
            if k is None:
                continue
            key = _ALIASES.get(k.strip().lower())
            if key:
                row[key] = v
        d10, d50, d90 = to_float(row.get("d10")), to_float(row.get("d50")), to_float(row.get("d90"))
        repeats.append({
            "repeat_index": i,
            "record_number": (row.get("record_number") or "").strip() or None,
            "measurement_dt": (row.get("measurement_dt") or "").strip() or None,
            "d10": d10, "d50": d50, "d90": d90,
            "span": span(d10, d50, d90) if None not in (d10, d50, d90) else None,
            "dispersant": (row.get("dispersant") or "").strip() or None,
            "stirrer_speed_rpm": to_float(row.get("stirrer_speed_rpm")),
        })
    if not repeats:
        warnings.append("No PSD rows parsed.")
    return {"repeats": repeats, "children": {}, "detected": {"n": len(repeats), "delimiter": delim}, "warnings": warnings}
