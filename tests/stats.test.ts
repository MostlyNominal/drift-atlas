import { describe, expect, it } from "vitest";
import { pearson, showErrorBars, summarise } from "../src/lib/stats";

describe("summarise (mirrors Python pipeline)", () => {
  it("n=1 → mean but no SD, no error bars", () => {
    const s = summarise([4.5]);
    expect(s.n).toBe(1);
    expect(s.mean).toBe(4.5);
    expect(s.sd).toBeNull();
    expect(showErrorBars(s)).toBe(false);
  });

  it("n>1 → sample SD (ddof=1) and error bars shown", () => {
    const s = summarise([1, 2, 3]);
    expect(s.n).toBe(3);
    expect(s.mean).toBe(2);
    expect(s.sd).toBeCloseTo(1.0, 10); // ddof=1
    expect(showErrorBars(s)).toBe(true);
  });

  it("ignores null/NaN", () => {
    expect(summarise([1, null, NaN, 3]).n).toBe(2);
  });
});

describe("pearson", () => {
  it("perfect positive correlation = 1", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });
  it("needs ≥2 points", () => {
    expect(pearson([1], [2])).toBeNull();
  });
});
