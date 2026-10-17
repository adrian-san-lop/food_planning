export function validateCatalogDocuments(foodDoc, recipeDoc, { slotTypes, recoveryTags }) {
  const allowedRecoveryTags = recoveryTags instanceof Set ? recoveryTags : new Set(recoveryTags || []);
  if (
    !foodDoc
    || !recipeDoc
    || foodDoc.schemaVersion !== 1
    || recipeDoc.schemaVersion !== 1
    || foodDoc.catalogVersion !== recipeDoc.catalogVersion
    || !Array.isArray(foodDoc.foods)
    || !Array.isArray(recipeDoc.recipes)
  ) throw new Error('Los JSON no tienen el esquema esperado o sus versiones no coinciden.');

  const foodIds = new Set();
  const foodRows = {};
  for (const food of foodDoc.foods) {
    if (
      !food
      || typeof food.id !== 'string'
      || !/^[a-z][a-zA-Z0-9_]*$/.test(food.id)
      || foodIds.has(food.id)
      || !food.name
      || !['g', 'ml', 'ud'].includes(food.unit)
      || !['g', 'ml', 'ud'].includes(food.recipeUnit)
      || !food.nutrition
      || !food.purchase
    ) throw new Error('Hay un alimento con campos incompletos o un identificador repetido.');

    foodIds.add(food.id);
    foodRows[food.id] = food;
    const nutrition = food.nutrition;
    if (
      !['per_100g', 'per_100ml', 'per_unit'].includes(nutrition.basis)
      || !['kcal', 'protein_g', 'carbohydrates_g', 'fat_g'].every((key) => Number.isFinite(Number(nutrition[key])) && Number(nutrition[key]) >= 0)
    ) throw new Error(`Revisa los valores nutricionales de ${food.name}.`);

    if (
      (food.recipeUnit === 'g' && nutrition.basis !== 'per_100g')
      || (food.recipeUnit === 'ml' && nutrition.basis !== 'per_100ml')
      || (
        food.recipeUnit === 'ud'
        && nutrition.basis !== 'per_unit'
        && !(nutrition.basis === 'per_100g' && Number(food.approximateEdibleWeight_g_per_unit) > 0)
      )
    ) throw new Error(`La unidad de receta y la base nutricional no coinciden en ${food.name}.`);

    if (
      food.unit !== food.recipeUnit
      && !(
        ['g', 'ud'].includes(food.unit)
        && ['g', 'ud'].includes(food.recipeUnit)
        && Number(food.approximateEdibleWeight_g_per_unit) > 0
      )
    ) throw new Error(`No se puede convertir la unidad de receta a inventario en ${food.name}.`);

    if (
      (food.recipeUnitLabel || food.recipeUnitLabelPlural)
      && (food.recipeUnit !== 'ud' || food.recipeUnitLabelPlural && !food.recipeUnitLabel)
      || food.recipeUnitLabel !== undefined && typeof food.recipeUnitLabel !== 'string'
      || food.recipeUnitLabelPlural !== undefined && typeof food.recipeUnitLabelPlural !== 'string'
    ) {
      throw new Error(`La etiqueta de unidad de receta solo se admite para unidades en piezas (${food.name}).`);
    }

    if (
      food.purchase.unit !== food.unit
      || !Number.isFinite(Number(food.purchase.quantity))
      || Number(food.purchase.quantity) <= 0
      || !['supermercado', 'fruteria'].includes(food.purchase.store)
    ) throw new Error(`Revisa el formato de compra de ${food.name}.`);
  }

  for (const food of foodDoc.foods) {
    if (
      food.recoveryTags !== undefined
      && (
        !Array.isArray(food.recoveryTags)
        || food.recoveryTags.some((tag) => !allowedRecoveryTags.has(tag))
        || new Set(food.recoveryTags).size !== food.recoveryTags.length
      )
    ) throw new Error(`Revisa las etiquetas de recuperación de ${food.name}.`);
  }

  const recipeIds = new Set();
  const types = new Set();
  for (const recipe of recipeDoc.recipes) {
    if (
      !recipe
      || typeof recipe.id !== 'string'
      || !/^[a-z][a-zA-Z0-9_]*$/.test(recipe.id)
      || recipeIds.has(recipe.id)
      || !recipe.name
      || !slotTypes.includes(recipe.mealType)
      || !Array.isArray(recipe.ingredients)
      || !recipe.ingredients.length
      || !Array.isArray(recipe.steps)
      || !recipe.steps.length
    ) throw new Error('Hay una receta incompleta o con un identificador repetido.');

    recipeIds.add(recipe.id);
    types.add(recipe.mealType);
    for (const ingredient of recipe.ingredients) {
      const food = foodRows[ingredient.foodId];
      if (!food || ingredient.unit !== food.recipeUnit || !Number.isFinite(Number(ingredient.amount)) || Number(ingredient.amount) <= 0) {
        throw new Error(`La receta «${recipe.name}» contiene un ingrediente incompatible con el catálogo.`);
      }
    }
    if (recipe.mealType === 'desayuno') {
      if (!recipe.ingredients.some((ingredient) => ingredient.foodId === 'coffee')) {
        throw new Error('Cada desayuno debe incluir café en el catálogo.');
      }
      if (recipe.ingredients.some((ingredient) => /queso|cheese/i.test(`${ingredient.foodId} ${foodRows[ingredient.foodId].name}`))) {
        throw new Error('El catálogo incluye queso en un desayuno, pero no está permitido.');
      }
    }
  }

  if (!slotTypes.every((type) => types.has(type))) throw new Error('Faltan recetas para uno o más espacios de comida.');
  return { foods: foodRows, recipes: recipeDoc.recipes };
}

export async function loadCatalogs({ slotTypes, recoveryTags }) {
  const paths = ['../../data/foods.json', '../../data/recipes.json'].map((path) => new URL(path, import.meta.url));
  const responses = await Promise.all(paths.map((url) => fetch(url, { cache: 'no-cache' })));
  if (responses.some((response) => !response.ok)) {
    throw new Error('No se han podido descargar los catálogos. Abre la app desde GitHub Pages o desde un servidor web.');
  }

  const [foodDoc, recipeDoc] = await Promise.all(responses.map((response) => response.json()));
  const clean = validateCatalogDocuments(foodDoc, recipeDoc, { slotTypes, recoveryTags });
  const foods = Object.fromEntries(Object.values(clean.foods).map((food) => {
    const nutrition = food.nutrition;
    const factor = nutrition.basis === 'per_100g' && food.recipeUnit === 'ud'
      ? Number(food.approximateEdibleWeight_g_per_unit) / 100
      : 1;
    return [food.id, [
      food.name,
      food.recipeUnit,
      nutrition.kcal * factor,
      nutrition.protein_g * factor,
      nutrition.carbohydrates_g * factor,
      nutrition.fat_g * factor,
    ]];
  }));
  const recipes = clean.recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    type: recipe.mealType,
    time: Number(recipe.timeMinutes),
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.foodId,
      rest: Number(ingredient.amount) / Number(recipe.baseServings || 1),
    })),
    steps: recipe.steps.slice(),
    tip: recipe.tip || '',
    intro: recipe.description || '',
  }));
  const catalog = Object.fromEntries(Object.values(clean.foods).map((food) => [
    food.id,
    [food.purchase.store === 'fruteria' ? 'fruit' : 'merc', food.purchase.section, Number(food.purchase.quantity)],
  ]));
  return {
    foodMeta: clean.foods,
    foods,
    recipes,
    recipeById: Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])),
    catalog,
    catalogVersion: foodDoc.catalogVersion,
  };
}
