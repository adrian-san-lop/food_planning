# Project Context

Last updated: 2026-10-11. This file is a short handoff index, not the full product specification. Detailed decisions and unresolved proposals are linked below.

## Product

- Menuki (Mi Plan Saludable) is currently a personal, single-user web app, used online and published as a static GitHub Pages site.
- The current interface is Spanish. It plans three weeks with five meal slots per day (105 planned meals per cycle), tracks recipes, shopping, pantry stock, completed activity sessions, and weight.
- Supabase Auth and the HTML login are configured for email/password without email confirmation. The repository now has transactional relational sync to the existing thirteen RLS-protected tables; migrations `20261011120000_menuki_cloud_sync.sql` and `20261011130000_menuki_cloud_reset.sql` were applied through SQL Editor on 2026-10-11. The updated HTML still needs to be published to GitHub Pages before remote sync runs there. The first access imports local v8 state once; later devices load the remote state. `localStorage` remains a working copy, not the source of cross-device synchronization. Sync uses a revision check and stops stale writes; there is no offline queue. Confirmed reset/restore replaces the account's rows transactionally. Credentials stay in `auth.users`, not `public.profiles`. Snapshots have indefinite retention while the parent completion and account exist; no timed purge is configured. Monitor total and per-table database size as users are added, reviewing around 350 MB of the 500 MB Free quota. SQL Editor does not track repository migration history.
- The in-page weekly backup reminder is implemented; there are no push or background notifications.

## Catalogs and planning

- Generic food and recipe catalogs are stored in `data/foods.json` and `data/recipes.json`, version `0.5.0`: 83 foods, 107 recipes, and 512 ingredient references. Bone-recovery tags qualitatively mark selected calcium, vitamin D, and vitamin C food sources; these are not nutrient amounts or clinical targets. When recovery is active, new or regenerated proposals favor recipes with these sources and show ingredient presence across the 21 days. The active cycle is not replaced automatically. Whole fruit and vegetables are weighed in recipe grams and tracked in pantry/purchases as units; nutrition and portions use the recipe measure. Eggs remain units and liquids use millilitres. Their contracts are in `data/foods.schema.json` and `data/recipes.schema.json`.
- The HTML loads both JSON catalogs over HTTP(S), checks IDs, units, ingredient references, and meal types, and maps them into the existing runtime model. The fixed `WEEK_1`–`WEEK_3` menu remains the initial cycle.
- The user can generate a 105-meal proposal for the next cycle, review and swap recipes within the same meal type, lock selections, regenerate unlocked meals, and save the proposal in Supabase through the relational sync. The proposal records its catalog version and activates when its start date arrives. Stock is a soft preference; there is no minimum count of unused recipes, taste filter, or allergy filter.
- Four initial planning principles are accepted. Exact scoring thresholds, dislike handling, and multi-person preference aggregation are not decided. See the planner specification and open questions.
- Activity sessions are entered after they happen. Net estimated energy `(MET - 1) × weight_kg × duration_hours` affects only uncompleted meals on that date. Completed quantities stay fixed; the remaining daily target is distributed across the meals still pending, primarily through carbohydrates. Future dates use the base goal; history does not automatically learn or alter a routine. The manual-activity-summary idea remains open. See decision ADR-0005.

## Data and safety rules

- Keep public generic catalogs separate from personal profiles and activity data.
- State format v5 is the oldest supported import; the current state format is v8. Accept v5-v8 and do not support v1-v4. Migration converts old recipe usage snapshots while preserving stock movements in their historical inventory units.
- `food.unit` is the pantry/purchase unit and `food.recipeUnit` is the recipe unit. Whole produce uses recipe `g` and pantry/purchase `ud`; eggs use `ud`, solids are weighed in `g`, and liquids use `ml`. Milk is purchased in 1 L cartons.
- If a logged meal consumes more than recorded stock, record the full consumption and show the deficit. Reversals must not be applied twice.
- Legacy strength-day flags may remain in imported state but are inert; fixed-menu third-amount overrides were removed. Activity sessions, weights, pantry movements, menu cycles, and shopping selections sync to their corresponding tables.
- ADR-0007 accepts immutable per-ingredient completion snapshots in recipe units, separate from inventory movements, with indefinite retention and no scheduled purge. Track database size as users are added; review near 350 MB. ADR-0008 accepts email + password, open registration, and no email confirmation. ADR-0009 records relational sync and its one-time import. Two-user RLS isolation and published PC/mobile flow remain unverified.
- No offline queue. The UI must only report a successful remote save after Supabase confirms it; on failure it keeps the local working copy and shows pending/conflict status.

## Source-of-truth map

- [README.md](README.md): user-facing overview, current capabilities, and deployment.
- [AGENTS.md](AGENTS.md): repository-wide instructions for coding agents.
- [Product requirements](docs/product/requirements.md): scope and user workflows.
- [Architecture](docs/architecture.md): implemented state and planned data boundaries.
- [Supabase database model](docs/supabase_db_model.md): applied schema, columns, keys, relations, and RLS status.
- [Planner specification](docs/planner/specification.md): catalog contract and accepted planner rules.
- [Roadmap](docs/roadmap.md): candidate stages and acceptance criteria.
- [Decision records](docs/decisions/): rationale and acceptance status.
- [Actual activity-session nutrition decision](docs/decisions/0005-actual-activity-session-nutrition.md): same-date, post-session calculation and its limits.
- [Meal completion ingredient snapshot decision](docs/decisions/0007-meal-completion-ingredient-snapshots.md): immutable recipe-unit quantities, separate from inventory movements.
- [Supabase state-sync decision](docs/decisions/0009-supabase-relational-state-sync.md): normalized persistence, first import, and stale-write conflicts.
- [Open questions](docs/open-questions.md): proposals and decisions still needed.

Before editing, check the active branch and working tree, then verify current behavior in `plan_alimentacion_dinamico_3_semanas.html`. Do not infer implementation from plans in the documentation.
