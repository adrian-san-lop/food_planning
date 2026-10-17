export function scaleBreadSlices(amount, factor, maxSlices = 2) {
  const scaled = Math.max(1, Math.round((Number(amount) || 0) * (Number(factor) || 0)));
  return Math.min(maxSlices, scaled);
}
