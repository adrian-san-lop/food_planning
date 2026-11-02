export function createInventoryLedger({ getState, hasFood, roundAmount, newOperationId, now = () => new Date().toISOString() }) {
  function applyMovement(movement) {
    const state = getState();
    if (!movement?.operationId || !hasFood(movement.foodId)
      || !Number.isFinite(Number(movement.quantity))
      || state.movements.some((item) => item.operationId === movement.operationId)) return false;
    let quantity = roundAmount(movement.quantity);
    if (quantity < 0) quantity = -Math.min(-quantity, Math.max(0, Number(state.stock[movement.foodId] || 0)));
    if (!quantity) return false;
    state.movements.push({ ...movement, quantity, createdAt: movement.createdAt || now() });
    state.stock[movement.foodId] = roundAmount(Math.max(0, Number(state.stock[movement.foodId] || 0) + quantity));
    if (state.stock[movement.foodId] < 0.001) delete state.stock[movement.foodId];
    return true;
  }

  function setInventoryBalance(foodId, value, kind = 'adjustment') {
    const state = getState();
    const current = Number(state.stock[foodId] || 0);
    const next = Math.max(0, Number(value) || 0);
    const delta = roundAmount(next - current);
    if (!delta) return false;
    return applyMovement({ operationId: newOperationId(), foodId, quantity: delta, kind, createdAt: now() });
  }

  return { applyMovement, setInventoryBalance };
}
