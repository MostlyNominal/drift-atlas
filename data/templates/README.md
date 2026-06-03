# Data entry templates

Copy these into the raw data tree, fill them in, and commit. GitHub Actions
(`process-data.yml`) regenerates the website's JSON automatically. **Raw files
are never modified; metadata you provide here is authoritative; filenames are
labels only.**

## Folder convention

```
data/raw/
  <sample_id>/
    sample.meta.json                 # ← sample.meta.json template
    <batch_id>/
      batch.meta.json                # ← batch.meta.json template
      psd/        export.csv         export.csv.meta.json   (← file.meta.json)
      granutap/   tap.csv            tap.csv.meta.json
      kf/         kf.json            (← kf.json template; manual entry)
      granudrum/  mode.ini           mode.ini.meta.json
      ft4/        test.prb           test.csv               summary.csv.meta.json
      asem/       particles.csv      particles.csv.meta.json
      dsc_tga/    curve.txt          curve.txt.meta.json
      xrd/        result.csv | xrd_manual_template.csv
      sem/        img001.tif         img001.tif.meta.json   (← sem.meta.json)
      ebsd/       map.ctf            map.ctf.meta.json + comments in notes
```

## Files

| Template | Purpose |
|----------|---------|
| `sample.meta.json` | one per sample folder — material, supplier, nominal PSD |
| `batch.meta.json` | one per batch folder — conditioning, humidity, reuse cycle |
| `file.meta.json` | generic sidecar `<export>.meta.json` — operator, instrument, datetime, test_mode |
| `kf.json` / `kf_template.csv` | manual KF repeats (n = 1, 2, 3+) |
| `sem.meta.json` | per-image SEM metadata sidecar |
| `psd_example_export.csv` | worked PSD vendor export (each row = a repeat) |
| `granutap_example_export.csv` | worked GranuTap export |
| `xrd_manual_template.csv` | manual XRD phase table |

## Rules recap

- Store **every repeat** separately. The website computes mean / SD / **n**.
- **Error bars only when n > 1.** n is always displayed.
- Test type/mode (GranuDrum, FT4) is detected from file **content**, not name.
- FT4 `.prb` is kept verbatim; if it can't be decoded, also commit the CSV summary.
