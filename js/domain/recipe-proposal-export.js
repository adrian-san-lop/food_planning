const EXPORT_FORMAT = 'menuki.recipe-proposal-export';
const EXPORT_VERSION = 1;
const MEAL_TYPES = new Set(['desayuno', 'comida', 'snack', 'cena']);

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function validDateTime(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function createRecipeProposalExport({ proposals, catalogVersion, exportedAt = new Date().toISOString() }) {
  if (!Array.isArray(proposals) || proposals.length === 0) {
    throw new Error('El paquete de propuestas debe contener al menos una propuesta.');
  }
  if (typeof catalogVersion !== 'string' || catalogVersion.length === 0 || !validDateTime(exportedAt)) {
    throw new Error('Los metadatos del paquete no son válidos.');
  }

  const normalizedProposals = proposals.map(proposal => {
    const ingredients = proposal?.ingredients;
    const steps = proposal?.steps;
    if (
      typeof proposal?.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proposal.id) ||
      !MEAL_TYPES.has(proposal.meal_type) ||
      !validText(proposal.recipe_name, 120) ||
      !validDateTime(proposal.created_at) ||
      !Array.isArray(ingredients) || ingredients.length < 1 || ingredients.length > 30 ||
      ingredients.some(value => !validText(value, 160)) ||
      !Array.isArray(steps) || steps.length < 1 || steps.length > 30 ||
      steps.some(value => !validText(value, 500))
    ) {
      throw new Error('Una propuesta no cumple el formato de exportación. Actualiza el buzón e inténtalo de nuevo.');
    }

    return {
      id: proposal.id,
      mealType: proposal.meal_type,
      name: proposal.recipe_name,
      submittedAt: proposal.created_at,
      ingredients: [...ingredients],
      steps: [...steps],
    };
  });

  return {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_VERSION,
    exportedAt,
    catalogVersion,
    proposalCount: normalizedProposals.length,
    proposals: normalizedProposals,
  };
}

export function serializeRecipeProposalExport(exportPackage) {
  return `${JSON.stringify(exportPackage, null, 2)}\n`;
}
