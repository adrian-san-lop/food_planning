export function createInventoryUnitService({ getFoodMeta, getFood, roundAmount }) {
  function foodStockUnit(id) {
    return getFoodMeta()[id]?.unit || getFood()[id]?.[1] || '';
  }

  function foodRecipeUnit(id) {
    return getFoodMeta()[id]?.recipeUnit || getFood()[id]?.[1] || '';
  }

  function foodPieceWeight(id) {
    return Number(getFoodMeta()[id]?.approximateEdibleWeight_g_per_unit) || 0;
  }

  function recipeToStockAmount(id, amount) {
    const value = Number(amount) || 0;
    const stockUnit = foodStockUnit(id);
    const recipeUnit = foodRecipeUnit(id);
    const weight = foodPieceWeight(id);
    if (stockUnit === recipeUnit || weight <= 0) return value;
    if (stockUnit === 'ud' && recipeUnit === 'g') return value / weight;
    if (stockUnit === 'g' && recipeUnit === 'ud') return value * weight;
    return value;
  }

  function stockToRecipeAmount(id, amount) {
    const value = Number(amount) || 0;
    const stockUnit = foodStockUnit(id);
    const recipeUnit = foodRecipeUnit(id);
    const weight = foodPieceWeight(id);
    if (stockUnit === recipeUnit || weight <= 0) return value;
    if (stockUnit === 'ud' && recipeUnit === 'g') return value * weight;
    if (stockUnit === 'g' && recipeUnit === 'ud') return value / weight;
    return value;
  }

  function storedRecipeToCurrentAmount(id, amount, storedUnit) {
    const value = Number(amount) || 0;
    const currentUnit = foodRecipeUnit(id);
    const weight = foodPieceWeight(id);
    if (!weight || storedUnit === currentUnit) return value;
    if (storedUnit === 'g' && currentUnit === 'ud') return value / weight;
    if (storedUnit === 'ud' && currentUnit === 'g') return value * weight;
    return value;
  }

  function normalizeQuantityMap(values, convert) {
    const out = {};
    for (const [id, value] of Object.entries(values || {})) {
      const quantity = Number(value);
      if (getFood()[id] && Number.isFinite(quantity)) out[id] = roundAmount(convert(id, quantity));
    }
    return out;
  }

  function convertLegacyPack(id, count, size) {
    const amount = Number(count) * Number(size);
    const weight = foodPieceWeight(id);
    if (foodStockUnit(id) === 'ud' && weight > 0 && Number.isFinite(amount)) {
      return { count: Math.max(1, Math.ceil(amount / weight)), size: 1 };
    }
    return { count: Number(count), size: Number(size) };
  }

  return {
    foodStockUnit,
    foodRecipeUnit,
    foodPieceWeight,
    recipeToStockAmount,
    stockToRecipeAmount,
    storedRecipeToCurrentAmount,
    normalizeQuantityMap,
    convertLegacyPack,
  };
}
