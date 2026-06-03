# Statistics & error bars

The same rule is implemented in Python (`scripts/parsers/common.py`) and
TypeScript (`src/lib/stats.ts`) so server-side processing and browser-side
uploads agree exactly:

| n | mean | SD (ddof=1) | error bar |
|---|------|-------------|-----------|
| 0 | — | — | none |
| 1 | shown | NULL | **none** (annotate `n=1`) |
| ≥2 | shown | shown | **shown** (= SD; SEM available) |

`n` is always displayed via the `NBadge` component.
