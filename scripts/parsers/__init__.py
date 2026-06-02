"""
Drift Atlas raw -> processed parsers (run in GitHub Actions, not the browser).

Each parser is a pure function: path -> dict with a stable shape:
    {
      "repeats": [ {...}, ... ],   # one entry per repeat measurement
      "children": { ... },         # optional nested series (speed points, curve)
      "detected": { ... },         # diagnostics (test mode, n, delimiter)
      "warnings": [ ... ]
    }

Rules honoured everywhere:
  * File NAMES are never trusted; metadata in the sidecar JSON is authoritative.
  * Test mode/type is detected from file CONTENT where the instrument allows.
  * Every repeat stored separately. n is always knowable. SD only meaningful n>1.
"""
