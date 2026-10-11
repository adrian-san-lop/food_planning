# Repository Guidance

These instructions apply to the whole repository.

## Before making changes

- Read `README.md`, `context/context.md`, and the relevant documents under `docs/`.
- Before changing application behavior, inspect `plan_alimentacion_dinamico_3_semanas.html`; it is the current runtime source of truth.
- Check the active branch and working-tree status first. Preserve existing user changes and do not switch branches unless asked.
- Distinguish implemented behavior from accepted design decisions, proposals, and open questions.

## Product and data boundaries

- The current product is a personal, single-user, online app. Do not add offline queues or background/push notifications.
- The weekly backup reminder is in-page only. Do not describe `localStorage` as cloud storage or synchronization.
- Keep the UI in Spanish. Keep `AGENTS.md` and `context.md` in English; write other project documentation in Spanish unless the owner asks otherwise.
- `plan_alimentacion_dinamico_3_semanas.html` is the runtime app. It loads the generic food and recipe catalogs from `data/foods.json` and `data/recipes.json` over HTTP(S); the current fixed menu remains the initial plan.
- Dynamic next-cycle proposals are implemented locally. Do not claim that Supabase persistence, authentication, or device synchronization is implemented.
- State format v5 is the first supported import format; current state is v8. Accept v5-v8 imports and do not add v1-v4 migrations.

## Catalogs and planner

- Catalog JSON contains generic food and recipe data only. Never put personal profiles, weights, pantry balances, meal history, credentials, or backups in it.
- Keep food IDs stable and ensure every recipe ingredient references an existing food ID. `food.unit` is the pantry/purchase unit; `food.recipeUnit` is the recipe measurement unit. Whole fruit and vegetables use grams in recipes and units in pantry/purchases; eggs use units and liquids use millilitres. Preserve the JSON Schemas and nutrition basis described in `docs/planner/specification.md`.
- Follow accepted planner decisions in `docs/decisions/`. Treat items marked proposed or open as undecided; do not silently turn them into requirements.
- Record activity only after it happens. Its estimated net energy `(MET - 1) × weight_kg × hours` applies only to that calendar date; never forecast sessions or change future dates. Keep completed meal quantities fixed and distribute the remaining daily target across uncompleted meals. Keep protein and fat targets stable; extra session energy should primarily affect carbohydrate portions. Use base recipe quantities in catalogs; do not restore `amountOnStrengthDay`.
- Also favor stock without blocking for low stock, seek variety while allowing necessary repeats, and let the user review, swap, and lock proposed meals.

## Inventory and privacy

- Use `ud` for eggs and pantry/purchases of the whole fruits/vegetables listed in `docs/product/requirements.md`; fractions are allowed. Measure all solid ingredients, including whole produce, in recipe grams; use `ud` for eggs and `ml` for liquids. Milk is purchased in 1 L cartons; ground coffee is measured in grams and included in breakfasts.
- Record full recipe consumption even if it exceeds recorded stock; show the deficit and allow a negative balance. Reversals must be idempotent.
- GitHub Pages content is public. If Supabase is integrated, use an appropriate public client key with RLS on all user tables; never expose service-role keys or secrets.
- Keep `index.html` at the repository root with a relative destination for GitHub Pages.

## Documentation

- `README.md` is the user-facing entry point; `context/context.md` is a concise English handoff; detailed requirements and design live under `docs/`.
- Record accepted decisions in dated decision records. Put proposals and unresolved questions in `docs/open-questions.md` until the owner accepts them.
- Update the relevant documentation when product behavior or architecture decisions change. Do not duplicate long specifications in `AGENTS.md`.
