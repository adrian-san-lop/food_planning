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
    if (foodStockUnit(id) === 'ud' && foodRecipeUnit(id) === 'g') {
      const weight = foodPieceWeight(id);
      return weight > 0 ? value / weight : value;
    }
    return value;
  }

  function stockToRecipeAmount(id, amount) {
    const value = Number(amount) || 0;
    if (foodStockUnit(id) === 'ud' && foodRecipeUnit(id) === 'g') return value * foodPieceWeight(id);
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
    if (foodStockUnit(id) === 'ud' && foodRecipeUnit(id) === 'g' && weight > 0 && Number.isFinite(amount)) {
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
    normalizeQuantityMap,
    convertLegacyPack,
  };
}
