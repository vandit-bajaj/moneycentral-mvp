import { describe, it, expect } from "vitest";
import { formatINR } from "@/utils/portfolio";

describe("formatINR", () => {
  it("formats a standard number to Indian locale", () => {
    expect(formatINR(1234567)).toBe("₹12,34,567.00");
  });

  it("handles values below 1000 without commas", () => {
    expect(formatINR(500)).toBe("₹500.00");
  });

  it("formats decimal values correctly", () => {
    expect(formatINR(1234.56)).toBe("₹1,234.56");
  });

  it("returns ₹0.00 for NaN", () => {
    expect(formatINR(NaN)).toBe("₹0.00");
  });

  it("returns ₹0.00 for 0", () => {
    expect(formatINR(0)).toBe("₹0.00");
  });

  it("handles negative values (unrealised loss display)", () => {
    expect(formatINR(-5000)).toBe("-₹5,000.00");
  });
});
