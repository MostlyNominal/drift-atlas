"""AZtecFeature / ASEM full particle export -> one row per particle + flags."""
from __future__ import annotations

import csv
import io
from pathlib import Path

from .common import circularity, elongation, sniff_delimiter, to_float

OXIDE_RICH_O_WT = 5.0
CONTAMINANT_RULES = {"ca_wt": 1.0, "k_wt": 0.5, "na_wt": 0.5, "s_wt": 1.0}

_COLMAP = {
    "feature": ["feature"], "rank": ["rank"],
    "area_um2": ["area (sq. µm)", "area (sq. um)", "area"],
    "aspect_ratio": ["aspect ratio"],
    "breadth_um": ["breadth (µm)", "breadth (um)", "breadth"],
    "ecd_um": ["ecd (µm)", "ecd (um)", "ecd"],
    "length_um": ["length (µm)", "length (um)", "length"],
    "perimeter_um": ["perimeter (µm)", "perimeter (um)", "perimeter"],
    "shape": ["shape"], "mean_grey": ["mean grey", "mean gray"],
    "spectrum_area": ["spectrum area"],
    "stage_x": ["stage x"], "stage_y": ["stage y"], "stage_z": ["stage z"],
    "o_wt": ["o wt%"], "na_wt": ["na wt%"], "mg_wt": ["mg wt%"], "al_wt": ["al wt%"],
    "si_wt": ["si wt%"], "p_wt": ["p wt%"], "s_wt": ["s wt%"], "k_wt": ["k wt%"],
    "ca_wt": ["ca wt%"], "ti_wt": ["ti wt%"], "cr_wt": ["cr wt%"], "mn_wt": ["mn wt%"],
    "fe_wt": ["fe wt%"], "ni_wt": ["ni wt%"], "nb_wt": ["nb wt%"],
}
_LOOKUP = {a: c for c, al in _COLMAP.items() for a in al}


def _contaminant(row):
    return any(row.get(e) is not None and row[e] > t for e, t in CONTAMINANT_RULES.items())


def parse(path: str | Path) -> dict:
    text = Path(path).read_text(encoding="utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text), delimiter=sniff_delimiter(text))
    particles, warnings = [], []
    for raw in reader:
        row = {}
        for k, v in raw.items():
            if k is None:
                continue
            canon = _LOOKUP.get(k.strip().lower())
            if canon:
                row[canon] = v if canon == "feature" else to_float(v)
        if not row:
            continue
        area, perim, ar = row.get("area_um2"), row.get("perimeter_um"), row.get("aspect_ratio")
        row["circularity"] = circularity(area, perim) if area and perim else None
        row["elongation"] = elongation(ar) if ar else None
        o = row.get("o_wt")
        row["is_oxide_rich"] = bool(o is not None and o > OXIDE_RICH_O_WT)
        row["is_contaminant"] = _contaminant(row)
        if isinstance(row.get("rank"), float):
            row["rank"] = int(row["rank"])
        particles.append(row)
    if not particles:
        warnings.append("No particle rows parsed.")
    return {"repeats": particles, "children": {}, "detected": {"n_particles": len(particles)}, "warnings": warnings}
