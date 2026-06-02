#!/usr/bin/env python3
"""Generate SEM thumbnails + a sem.json index during CI."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

THUMB = (480, 480)
IMG_EXT = {".tif", ".tiff", ".png", ".jpg", ".jpeg", ".bmp"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default="data/raw")
    ap.add_argument("--out", default="public/data/processed/thumbnails")
    args = ap.parse_args()
    raw, out = Path(args.raw), Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    index = []
    for img in raw.rglob("*"):
        if img.suffix.lower() not in IMG_EXT:
            continue
        meta = {}
        mp = Path(str(img) + ".meta.json")
        if mp.exists():
            meta = json.loads(mp.read_text(encoding="utf-8"))
        thumb_name = img.stem + ".png"
        if HAS_PIL:
            with Image.open(img) as im:
                im.thumbnail(THUMB)
                im.convert("RGB").save(out / thumb_name, "PNG")
        index.append({
            "sample_id": meta.get("sample_id"),
            "run_id": meta.get("run_id"),
            "magnification": meta.get("magnification"),
            "detector": meta.get("detector"),
            "accelerating_voltage_kV": meta.get("accelerating_voltage_kV"),
            "working_distance_mm": meta.get("working_distance_mm"),
            "notes": meta.get("notes"),
            "image_path": str(img.relative_to(raw.parent)),
            "thumbnail": f"thumbnails/{thumb_name}",
        })
    (out.parent / "sem.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"Indexed {len(index)} SEM images (PIL={'on' if HAS_PIL else 'off'})")


if __name__ == "__main__":
    main()
