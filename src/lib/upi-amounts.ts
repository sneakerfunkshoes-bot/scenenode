/** Shared checkout amount constants (safe for client bundles). */
export const UPI_AMOUNT_INR = 249;
export const UPI_AMOUNT_MIN = 249.01;
export const UPI_AMOUNT_MAX = 249.2;

export function formatInrAmount(amount: number): string {
  return amount.toFixed(2);
}

export function amountsEqual(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

export function isCheckoutAmountRange(amount: number): boolean {
  return amount >= UPI_AMOUNT_MIN - 0.001 && amount <= UPI_AMOUNT_MAX + 0.001;
}

/** Unique paisa amount so SMS credits can match one pending order. */
export function pickUniqueCheckoutAmount(usedAmounts: number[]): number {
  const used = new Set(usedAmounts.map((a) => Math.round(a * 100)));
  const candidates: number[] = [];

  for (let paisa = 1; paisa <= 20; paisa++) {
    const amount = Number((UPI_AMOUNT_INR + paisa / 100).toFixed(2));
    if (!used.has(Math.round(amount * 100))) candidates.push(amount);
  }

  if (candidates.length === 0) {
    const paisa = Math.floor(Math.random() * 20) + 1;
    return Number((UPI_AMOUNT_INR + paisa / 100).toFixed(2));
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
