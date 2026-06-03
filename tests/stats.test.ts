import { describe, expect, it } from "vitest";
import { calculateMeanSDN, pearson, showErrorBars } from "../src/lib/stats";

describe("calculateMeanSDN", () => {
  it("returns mean for n=1 without SD or error bars", () => {
    const stat = calculateMeanSDN([4.5]);

    expect(stat.n).toBe(1);
    expect(stat.mean).toBe(4.5);
    expect(stat.sd).toBeNull();
    expect(showErrorBars(stat)).toBe(false);
  });

  it("uses sample SD when n is greater than 1", () => {
    const stat = calculateMeanSDN([1, 2, 3]);

    expect(stat.n).toBe(3);
    expect(stat.mean).toBe(2);
    expect(stat.sd).toBeCloseTo(1.0, 10);
    expect(showErrorBars(stat)).toBe(true);
  });

  it("ignores null and NaN values", () => {
    expect(calculateMeanSDN([1, null, NaN, 3]).n).toBe(2);
  });
});

describe("pearson", () => {
  it("returns 1 for perfect positive correlation", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });

  it("needs at least two points", () => {
    expect(pearson([1], [2])).toBeNull();
  });
});
