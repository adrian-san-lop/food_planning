export function createRecipeProposalService({ getClient }) {
  function client() {
    const value = getClient?.();
    if (!value) throw new Error('Supabase no está disponible.');
    return value;
  }

  function unwrap(result) {
    if (result?.error) throw result.error;
    return result?.data;
  }

  return {
    async isAdmin() {
      return unwrap(await client().rpc('is_menuki_admin')) === true;
    },

    async submit({ clientId, mealType, recipeName, ingredients, steps }) {
      return unwrap(await client().rpc('submit_recipe_proposal', {
        p_client_id: clientId,
        p_meal_type: mealType,
        p_recipe_name: recipeName,
        p_ingredients: ingredients,
        p_steps: steps,
      }));
    },

    async list() {
      const db = client();
      const [proposalsResult, ingredientsResult, stepsResult] = await Promise.all([
        db.from('recipe_proposals')
          .select('id, meal_type, recipe_name, created_at')
          .order('created_at', { ascending: false }),
        db.from('recipe_proposal_ingredients')
          .select('proposal_id, position, ingredient_text')
          .order('position', { ascending: true }),
        db.from('recipe_proposal_steps')
          .select('proposal_id, position, step_text')
          .order('position', { ascending: true }),
      ]);
      const proposals = unwrap(proposalsResult) || [];
      const ingredients = unwrap(ingredientsResult) || [];
      const steps = unwrap(stepsResult) || [];
      const ingredientsByProposal = new Map();
      const stepsByProposal = new Map();

      for (const row of ingredients) {
        if (!ingredientsByProposal.has(row.proposal_id)) ingredientsByProposal.set(row.proposal_id, []);
        ingredientsByProposal.get(row.proposal_id)[Number(row.position) - 1] = row.ingredient_text;
      }
      for (const row of steps) {
        if (!stepsByProposal.has(row.proposal_id)) stepsByProposal.set(row.proposal_id, []);
        stepsByProposal.get(row.proposal_id)[Number(row.position) - 1] = row.step_text;
      }

      return proposals.map(row => ({
        ...row,
        ingredients: (ingredientsByProposal.get(row.id) || []).filter(Boolean),
        steps: (stepsByProposal.get(row.id) || []).filter(Boolean),
      }));
    },

    async clearAll(expectedCount) {
      return unwrap(await client().rpc('clear_recipe_proposals', {
        p_expected_count: expectedCount,
      }));
    },
  };
}
