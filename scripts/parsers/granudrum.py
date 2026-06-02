"""
GranuDrum / GranuFlow .ini-style files.
Mode detected from CONTENT (not filename). Speed-level series preserved.
"""
from __future__ import annotations

import configparser
import re
from pathlib import Path

from .common import to_float

_MODE_PATTERNS = {
    "Speed Hysteresis": [r"hysteresis"],
    "Speed Reverse": [r"reverse"],
    "Speed Sequence": [r"sequence"],
    "First Avalanches": [r"first\s*avalanch", r"avalanche"],
}


def detect_mode(text: str):
    low = text.lower()
    for mode, pats in _MODE_PATTERNS.items():
        if any(re.search(p, low) for p in pats):
            return mode
    return None


def _speed_points(section: dict):
    speeds: dict[int, dict] = {}
    pat = re.compile(r"(speed|angle|cohes\w*|roughness)[_ ]?(\d+)", re.I)
    for key, val in section.items():
        m = pat.match(key)
        if not m:
            continue
        kind, idx = m.group(1).lower(), int(m.group(2))
        d = speeds.setdefault(idx, {})
        if kind.startswith("speed"):
            d["rotation_speed_rpm"] = to_float(val)
        elif kind.startswith("angle"):
            d["dynamic_angle"] = to_float(val)
        elif kind.startswith("cohes"):
            d["cohesive_index"] = to_float(val)
        elif kind.startswith("roughness"):
            d["interface_roughness"] = to_float(val)
    return [dict(speeds[k], sequence_index=j) for j, k in enumerate(sorted(speeds))]


def parse(path: str | Path) -> dict:
    raw = Path(path).read_text(encoding="utf-8-sig", errors="replace")
    mode = detect_mode(raw)
    cp = configparser.ConfigParser(strict=False)
    warnings = []
    try:
        cp.read_string(raw)
    except configparser.Error as e:
        warnings.append(f"INI parse issue: {e}")

    sections = [s for s in cp.sections()
                if re.search(r"(measurement|repeat|run)\s*[_ ]?\d+", s, re.I)]
    if not sections and cp.sections():
        sections = [cp.sections()[0]]

    repeats, speed_points = [], []
    for i, sec in enumerate(sections, start=1):
        d = {k.lower(): v for k, v in cp.items(sec)}
        repeats.append({
            "repeat_index": i,
            "test_mode": mode,
            "cohesive_index": to_float(d.get("cohesive_index") or d.get("cohesion")),
            "avg_dynamic_angle": to_float(d.get("dynamic_angle") or d.get("avg_angle")),
            "avg_flow_rate": to_float(d.get("flow_rate")),
        })
        for p in _speed_points(d):
            p["repeat_index"] = i
            speed_points.append(p)

    if not repeats:
        warnings.append("No GranuDrum repeats detected from content.")
    return {
        "repeats": repeats,
        "children": {"speed_points": speed_points},
        "detected": {"test_mode": mode, "n": len(repeats)},
        "warnings": warnings,
    }
