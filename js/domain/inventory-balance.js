export function consumeAvailableStock(balance, requested, roundAmount) {
  const available = Math.max(0, Number(balance) || 0);
  const demand = Math.max(0, Number(requested) || 0);
  const deducted = roundAmount(Math.min(available, demand));
  const shortfall = roundAmount(Math.max(0, demand - deducted));
  return { deducted, shortfall, balance: roundAmount(Math.max(0, available - deducted)) };
}

export function projectAvailableStock(balance, pendingUsage, roundAmount) {
  return roundAmount(Math.max(0, (Number(balance) || 0) - Math.max(0, Number(pendingUsage) || 0)));
}

export function normalizeLegacyDeduction(deducted, shortfall, roundAmount) {
  const result = { ...(deducted || {}) };
  for (const [foodId, amount] of Object.entries(shortfall || {})) {
    result[foodId] = roundAmount(Math.max(0, Number(result[foodId] || 0) - Number(amount || 0)));
    if (result[foodId] < 0.001) delete result[foodId];
  }
  return result;
}
