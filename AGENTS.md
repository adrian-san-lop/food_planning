# Repository Guidance

These instructions apply to the whole repository.

## Before making changes

- Read `README.md`, `context.md`, and the relevant documents under `docs/`.
- Before changing application behavior, inspect `plan_alimentacion_dinamico_3_semanas.html`; it is the current runtime source of truth.
- Check the active branch and working-tree status first. Preserve existing user changes and do not switch branches unless asked.
- Distinguish implemented behavior from accepted design decisions, proposals, and open questions.

## Product and data boundaries

- The current product is a personal, single-user, online app. Do not add offline queues or background/push notifications.
- The weekly backup reminder is in-page only. Do not describe `localStorage` as cloud storage or synchronization.
- Keep the UI in Spanish. Keep `AGENTS.md` and `context.md` in English; write other project documentation in Spanish unless the owner asks otherwise.
- The HTML currently embeds its foods, recipes, and fixed three-week menus. `data/foods.json` and `data/recipes.json` are draft catalogs and are not loaded by the app yet.
- Do not claim that dynamic planning, Supabase persistence, authentication, or device synchronization is implemented until verified in code and runtime.
- State format v5 is the first supported import format; current state is v6. Do not add v1-v4 migrations.

## Catalogs and planner

- Catalog JSON contains generic food and recipe data only. Never put personal profiles, weights, pantry balances, meal history, credentials, or backups in it.
- Keep food IDs stable and ensure every recipe ingredient references an existing food ID. Preserve canonical units and the nutrition basis described in `docs/planner/specification.md`.
- Follow accepted planner decisions in `docs/decisions/`. Treat items marked proposed or open as undecided; do not silently turn them into requirements.
- The accepted planner principles are: preserve current nutrition/portion logic as a reference, favor using stock without blocking for low stock, seek variety while allowing necessary repeats, and let the user review, swap, and lock proposed meals.

## Inventory and privacy

- Use `ud` for eggs and the whole fruits/vegetables listed in `docs/product/requirements.md`; fractions are allowed. Use `g` for weighed/packaged ingredients and `ml` for liquids. Milk is purchased in 1 L cartons; ground coffee is measured in grams and included in breakfasts.
- Record full recipe consumption even if it exceeds recorded stock; show the deficit and allow a negative balance. Reversals must be idempotent.
- GitHub Pages content is public. If Supabase is integrated, use an appropriate public client key with RLS on all user tables; never expose service-role keys or secrets.
- Keep `index.html` at the repository root with a relative destination for GitHub Pages.

## Documentation

- `README.md` is the user-facing entry point; `context.md` is a concise English handoff; detailed requirements and design live under `docs/`.
- Record accepted decisions in dated decision records. Put proposals and unresolved questions in `docs/open-questions.md` until the owner accepts them.
- Update the relevant documentation when product behavior or architecture decisions change. Do not duplicate long specifications in `AGENTS.md`.
