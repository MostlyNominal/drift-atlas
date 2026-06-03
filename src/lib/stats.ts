import type { Stat } from "./types";

export function calculateMeanSDN(values: (number | null | undefined)[]): Stat {
  const xs = values.filter((value): value is number => {
    return typeof value === "number" && Number.isFinite(value);
  });
  const n = xs.length;

  if (n === 0) {
    return { n: 0, mean: null, sd: null, sem: null };
  }

  const mean = xs.reduce((sum, value) => sum + value, 0) / n;

  if (n === 1) {
    return { n, mean, sd: null, sem: null };
  }

  const variance = xs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(variance);
  return { n, mean, sd, sem: sd / Math.sqrt(n) };
}

export function showErrorBars(stat: Stat): boolean {
  return stat.n > 1 && stat.sd != null;
}

export function pearson(xs: number[], ys: number[]): number | null {
  const pairs = xs
    .map((x, index) => [x, ys[index]])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  const n = pairs.length;
  if (n < 2) return null;

  const meanX = pairs.reduce((sum, pair) => sum + pair[0], 0) / n;
  const meanY = pairs.reduce((sum, pair) => sum + pair[1], 0) / n;

  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;

  for (const [x, y] of pairs) {
    numerator += (x - meanX) * (y - meanY);
    sumXSquared += (x - meanX) ** 2;
    sumYSquared += (y - meanY) ** 2;
  }

  return sumXSquared && sumYSquared
    ? numerator / Math.sqrt(sumXSquared * sumYSquared)
    : null;
}
