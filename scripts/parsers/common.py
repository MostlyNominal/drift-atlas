"""Shared helpers + statistics for the processing pipeline."""
from __future__ import annotations

import math
from typing import Iterable


def to_float(v):
    if v is None:
        return None
    s = str(v).strip().replace(",", ".")
    if s == "":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def sniff_delimiter(text: str) -> str:
    head = text.splitlines()[0] if text else ""
    for d in ("\t", ";", ","):
        if d in head:
            return d
    return ","


def summarise(values: Iterable[float]) -> dict:
    """Return {n, mean, sd, sem}. sd/sem are null unless n > 1.

    This mirrors the website's rule: always report n; error bars only n>1.
    """
    xs = [v for v in values if v is not None and not (isinstance(v, float) and math.isnan(v))]
    n = len(xs)
    if n == 0:
        return {"n": 0, "mean": None, "sd": None, "sem": None}
    mean = sum(xs) / n
    if n < 2:
        return {"n": n, "mean": mean, "sd": None, "sem": None}
    var = sum((x - mean) ** 2 for x in xs) / (n - 1)  # sample variance, ddof=1
    sd = math.sqrt(var)
    return {"n": n, "mean": mean, "sd": sd, "sem": sd / math.sqrt(n)}


def span(d10, d50, d90):
    if not d50:
        return None
    return (d90 - d10) / d50


def hausner(bulk, tapped):
    return tapped / bulk if bulk else None


def carr(bulk, tapped):
    return 100.0 * (tapped - bulk) / tapped if tapped else None


def circularity(area, perimeter):
    if not perimeter:
        return None
    return 4.0 * math.pi * area / (perimeter ** 2)


def elongation(aspect_ratio):
    if not aspect_ratio:
        return None
    return 1.0 - 1.0 / aspect_ratio
