// Client-side statistics. Mirrors scripts/parsers/common.py exactly so the
// website can also compute stats from raw repeats uploaded in the browser.
import type { Stat } from "./types";

export function summarise(values: (number | null | undefined)[]): Stat {
  const xs = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  const n = xs.length;
  if (n === 0) return { n: 0, mean: null, sd: null, sem: null };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { n, mean, sd: null, sem: null };
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1); // ddof=1
  const sd = Math.sqrt(variance);
  return { n, mean, sd, sem: sd / Math.sqrt(n) };
}

/** Error bars are shown ONLY when n > 1 and SD is defined. */
export function showErrorBars(stat: Stat): boolean {
  return stat.n > 1 && stat.sd != null;
}

export function pearson(xs: number[], ys: number[]): number | null {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const n = pairs.length;
  if (n < 2) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
  const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : null;
}
