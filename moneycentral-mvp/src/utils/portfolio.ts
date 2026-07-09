export interface PnL {
  absolute: number;
  percent: number;
}

/**
 * Format a number using the Indian Rupee (₹) numbering system.
 * e.g., 150000 -> ₹1,50,000.00
 */
export function formatINR(value: number): string {
  if (isNaN(value)) return "₹0.00";
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? "-" : ""}₹${formatted}`;
}

/**
 * Calculate the Profit and Loss (P&L) metrics for a given quantity, buy price, and current price.
 */
export function calculatePnL(
  quantity: number,
  avgBuyPrice: number,
  currentPrice: number
): PnL {
  const invested = quantity * avgBuyPrice;
  const current = quantity * currentPrice;
  const absolute = current - invested;
  const percent = invested === 0 ? 0 : (absolute / invested) * 100;
  return { absolute, percent };
}

/**
 * Calculate the total invested value across an array of holdings.
 */
export function getTotalInvested(
  holdings: Array<{ quantity: number; avg_buy_price: number }>
): number {
  return holdings.reduce(
    (sum, h) => sum + Number(h.quantity) * Number(h.avg_buy_price),
    0
  );
}
