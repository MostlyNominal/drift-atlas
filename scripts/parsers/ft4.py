"""
FT4: raw .prb kept verbatim; CSV summary is the reliable numeric path.
Un-decodable .prb -> 'prb_pending' record so the run stays traceable.
"""
from __future__ import annotations

import csv
import io
import re
from pathlib import Path

from .common import to_float

_TEST_TYPES = {
    "stability": "STABILITY", "variable flow": "STABILITY", "vfr": "STABILITY",
    "aeration": "AERATION", "permeability": "PERMEABILITY",
    "compressibility": "COMPRESSIBILITY", "shear": "SHEAR", "wall friction": "WALL_FRICTION",
}
_METRIC = {
    "basic flow energy": "bfe_mJ", "bfe": "bfe_mJ",
    "stability index": "stability_index", "flow rate index": "flow_rate_index",
    "specific energy": "specific_energy_mJ_g",
    "conditioned bulk density": "cbd_g_ml", "cohesion": "cohesion_kPa",
}


def detect_test_type(text):
    low = text.lower()
    for kw, code in _TEST_TYPES.items():
        if kw in low:
            return code
    return None


def parse(path: str | Path) -> dict:
    p = Path(path)
    if p.suffix.lower() == ".prb":
        return {
            "repeats": [{"repeat_index": 1, "test_type": None, "parse_status": "prb_pending",
                         "comment": "Binary .prb stored; export FT4 CSV summary and re-commit."}],
            "children": {}, "detected": {"format": "prb"},
            "warnings": ["FT4 .prb not decoded; CSV summary required for numeric results."],
        }
    text = p.read_text(encoding="utf-8-sig", errors="replace")
    test_type = detect_test_type(text)
    metrics, steps = {}, []
    for row in csv.reader(io.StringIO(text)):
        if len(row) < 2:
            continue
        label = row[0].strip().lower()
        for kw, canon in _METRIC.items():
            if kw in label:
                metrics[canon] = to_float(row[1])
        m = re.match(r"test\s*(\d+)", label)
        if m and to_float(row[1]) is not None:
            steps.append({"step_index": int(m.group(1)), "x_label": "test number",
                          "x_value": float(m.group(1)), "y_label": "flow energy", "y_value": to_float(row[1])})
    return {
        "repeats": [{"repeat_index": 1, "test_type": test_type, "parse_status": "parsed_csv", **metrics}],
        "children": {"step_points": steps}, "detected": {"test_type": test_type}, "warnings": [],
    }
