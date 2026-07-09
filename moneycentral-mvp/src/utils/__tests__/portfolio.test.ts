import { describe, it, expect } from "vitest";
import { calculatePnL, getTotalInvested } from "@/utils/portfolio";

describe("calculatePnL", () => {
  it("returns correct profit when price rises", () => {
    const result = calculatePnL(10, 100, 150);
    expect(result.absolute).toBe(500);
    expect(result.percent).toBe(50);
  });

  it("returns correct loss when price falls", () => {
    const result = calculatePnL(10, 100, 80);
    expect(result.absolute).toBe(-200);
    expect(result.percent).toBe(-20);
  });

  it("handles zero quantity without division by zero", () => {
    const result = calculatePnL(0, 100, 150);
    expect(result.absolute).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("handles very small fractional quantities", () => {
    const result = calculatePnL(0.5, 200, 300);
    expect(result.absolute).toBe(50);
    expect(result.percent).toBe(50);
  });
});

describe("getTotalInvested", () => {
  it("calculates the correct sum across holdings", () => {
    const holdings = [
      { quantity: 10, avg_buy_price: 100 },
      { quantity: 5, avg_buy_price: 200 },
    ];
    expect(getTotalInvested(holdings)).toBe(2000);
  });

  it("returns 0 for an empty array", () => {
    expect(getTotalInvested([])).toBe(0);
  });
});
