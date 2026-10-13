# Project Context

Last updated: 2026-10-13. This file is a short handoff index, not the full product specification. Detailed decisions and unresolved proposals are linked below.

## Product

- Menuki (Mi Plan Saludable) is currently a personal, single-user web app, used online and published as a static GitHub Pages site from the `dev` branch.
- The current interface is Spanish. It plans three weeks with five meal slots per day (105 planned meals per cycle), tracks recipes, shopping, pantry stock, completed activity sessions, and weight.
- Supabase Auth and the HTML login are configured for email/password without email confirmation. The repository has transactional relational sync to thirteen RLS-protected tables. Seven migrations are applied through SQL Editor, including `20261011120000_menuki_cloud_sync.sql`, `20261011130000_menuki_cloud_reset.sql`, and `20261011150000_profile_confirmation.sql` (2026-10-11). The eighth migration, `20261013120000_menuki_sync_conflict_http_409.sql`, is prepared but not yet applied; it changes stale-revision RPC conflicts from SQLSTATE `40001` to PostgREST HTTP 409 (`PT409`) to stop PostgREST 14 retry loops. The first access imports local v8 state once. Later devices read Supabase and the client checks `sync_revision` every 15 seconds while visible, on focus, and on reconnection. Stale writes are automatically rebased against a local common base; Supabase's latest accepted revision wins same-value conflicts. `localStorage` remains a working copy, not cross-device storage. There is no offline queue. Confirmed reset/restore replaces the account's rows transactionally and is separate from normal sync. Credentials stay in `auth.users`, not `public.profiles`. Snapshots have indefinite retention while the parent completion and account exist; no timed purge is configured. Monitor total and per-table database size as users are added, reviewing around 350 MB of the 500 MB Free quota. The owner reported 27 MB database size on 2026-10-13. SQL Editor does not track repository migration history.
- Inicio shows a compact banner, KPIs, today's nutrition target, and only today's menu, in that order. The separate Menú page holds the week and seven-day navigation and displays the selected date. First-use guidance lives in Guía and directs the user to review generic profile values; saving persists `profile_confirmed` locally and remotely. Future meals are labeled planned and cannot be completed before their date. Published browser flows and two-user RLS validation are still pending.
- Supabase sync runs automatically after changes while online. The compact account status offers retry only after a sync error. JSON export and periodic backup reminders are not part of the interface; supported v5-v8 imports remain available with explicit confirmation.
- On mobile, Inicio, Menú, Compra, and Actividad are in the bottom navigation; Perfil, Despensa, Recetas, and Guía are under **Más**. The activity page starts with session history and labeled delete actions. The shopping page has product search and a fixed progress/finalize bar. Physical-phone validation is still pending.
- Compra labels its primary store **Supermercado** and keeps Frutería separate; the existing internal store key remains unchanged.

## Catalogs and planning

- Generic food and recipe catalogs are stored in `data/foods.json` and `data/recipes.json`, version `0.6.0`: 83 foods, 107 recipes, and 512 ingredient references. Recipes have no food-photo metadata; the app keeps only brand imagery. Bone-recovery tags qualitatively mark selected calcium, vitamin D, and vitamin C food sources; these are not nutrient amounts or clinical targets. When recovery is active, new or regenerated proposals favor recipes with these sources and show ingredient presence across the 21 days. The active cycle is not replaced automatically. Whole fruit and vegetables are weighed in recipe grams and tracked in pantry/purchases as units; nutrition and portions use the recipe measure. Eggs remain units and liquids use millilitres. Their contracts are in `data/foods.schema.json` and `data/recipes.schema.json`.
- The HTML loads both JSON catalogs over HTTP(S), checks IDs, units, ingredient references, and meal types, and maps them into the existing runtime model. The fixed `WEEK_1`–`WEEK_3` menu remains the initial cycle.
- `menuki.html` is the page shell. It loads `assets/css/app.css`, a pinned `@supabase/supabase-js@2.117.3` CDN build, and the `js/main.js` ES-module entry; the stylesheet groups base, shell, shared controls and views, with responsive rules at the end. JavaScript templates have no inline `style` attributes; progress indicators use `<progress>`. Food photos were removed; the brand logo remains. Dates are resolved against `Europe/Madrid`, while civil-day arithmetic uses `YYYY-MM-DD` dates carried at UTC midnight. Date/catalog/unit/local-state/Supabase transport modules and the shared HTML encoding helper have been extracted; UI and remaining orchestration still live in `js/main.js`. `npm test` runs the Node 20+ domain/catalog/HTML checks. Published browser flows and two-account RLS isolation remain to be validated.
- `data/foods.json` and `data/recipes.json` are the canonical generic catalogs. Supabase relational tables are canonical for personal data; `localStorage` is only the browser working copy. Runtime catalog models are derived from JSON, and the fixed initial menu remains a template of recipe IDs. Duplicate food/recipe/weight/pack literals have been removed from `js/main.js`.
- The user can generate a 105-meal proposal for the next cycle, review and swap recipes within the same meal type, lock selections, regenerate unlocked meals, and save the proposal in Supabase through the relational sync. The proposal records its catalog version and activates when its start date arrives. Stock is a soft preference; there is no minimum count of unused recipes, taste filter, or allergy filter.
- Four initial planning principles are accepted. Exact scoring thresholds, dislike handling, and multi-person preference aggregation are not decided. See the planner specification and open questions.
- Activity sessions are entered after they happen. Net estimated energy `(MET - 1) × weight_kg × duration_hours` affects only uncompleted meals on that date. Completed quantities stay fixed; the remaining daily target is distributed across the meals still pending, primarily through carbohydrates. Future dates use the base goal; history does not automatically learn or alter a routine. The manual-activity-summary idea remains open. See decision ADR-0005.

## Data and safety rules

- Keep public generic catalogs separate from personal profiles and activity data.
- State format v5 is the oldest supported import; the current state format is v8. Accept v5-v8 and do not support v1-v4. Migration converts old recipe usage snapshots while preserving stock movements in their historical inventory units.
- `food.unit` is the pantry/purchase unit and `food.recipeUnit` is the recipe unit. Whole produce uses recipe `g` and pantry/purchase `ud`; eggs use `ud`, solids are weighed in `g`, and liquids use `ml`. Milk is purchased in 1 L cartons.
- If a logged meal consumes more than recorded stock, record the full consumption and show the deficit. Reversals must not be applied twice.
- Legacy strength-day flags may remain in imported state but are inert; fixed-menu third-amount overrides were removed. Activity sessions, weights, pantry movements, menu cycles, and shopping selections sync to their corresponding tables.
- ADR-0008 accepts immutable per-ingredient completion snapshots in recipe units, separate from inventory movements, with indefinite retention and no scheduled purge. Track database size as users are added; review near 350 MB. ADR-0009 accepts email + password, open registration, and no email confirmation. ADR-0010 records relational sync and its one-time import. Two-user RLS isolation and published PC/mobile flow remain unverified.
- No offline queue. The UI must only report a successful remote save after Supabase confirms it; on failure it keeps the local working copy and shows pending/error status. Ordinary cross-device changes reconcile automatically; confirmed full reset/restore remains a separate operation.

## Source-of-truth map

- [README.md](README.md): user-facing overview, current capabilities, and deployment.
- [AGENTS.md](AGENTS.md): repository-wide instructions for coding agents.
- [Product requirements](docs/product/requirements.md): scope and user workflows.
- [Architecture](docs/architecture.md): implemented state and planned data boundaries.
- [Front-end and back-end audit](docs/front-end-audit.md): findings, recommendations, and progress of the staged client refactor.
- [Supabase database model](docs/supabase_db_model.md): applied schema, columns, keys, relations, and RLS status.
- [Planner specification](docs/planner/specification.md): catalog contract and accepted planner rules.
- [Roadmap](docs/roadmap.md): candidate stages and acceptance criteria.
- [Decision records](docs/decisions/): rationale and acceptance status.
- [Actual activity-session nutrition decision](docs/decisions/0005-actual-activity-session-nutrition.md): same-date, post-session calculation and its limits.
- [Meal completion ingredient snapshot decision](docs/decisions/0008-meal-completion-ingredient-snapshots.md): immutable recipe-unit quantities, separate from inventory movements.
- [Email/password authentication decision](docs/decisions/0009-email-password-auth.md): open registration without email confirmation.
- [Supabase state-sync decision](docs/decisions/0010-supabase-relational-state-sync.md): normalized persistence, first import, and revision control.
- [Automatic reconciliation and activity history decision](docs/decisions/0017-automatic-reconciliation-and-activity-history.md): remote refresh, stale-write merging, and session discoverability.
- [PostgREST conflict response-code decision](docs/decisions/0020-postgrest-conflict-response-code.md): return HTTP 409 for stale revisions instead of SQLSTATE `40001` retries.
- [First-use and meal-registration decision](docs/decisions/0011-first-use-profile-and-meal-registration.md): profile review and future meal handling.
- [Daily home and menu navigation decision](docs/decisions/0019-daily-home-and-menu-navigation.md): daily-only Inicio, week/day navigation in Menú, and the generic supermarket label in Compra.
- [Mobile shopping and sync interface decision](docs/decisions/0012-mobile-shopping-and-sync-ui.md): automatic sync retry, mobile purchase flow, pantry labels, and grouped navigation.
- [Client modules and Madrid dates decision](docs/decisions/0013-front-end-modules-and-madrid-dates.md): native ES modules, incremental extraction, and civil dates in `Europe/Madrid`.
- [Canonical data sources decision](docs/decisions/0014-canonical-data-sources.md): JSON catalogs, Supabase personal state, and the local working copy boundary.
- [UX/UI audit](docs/ux-ui-audit.md): desktop/mobile findings and verification still required before publication.
- [Open questions](docs/open-questions.md): proposals and decisions still needed.

Before editing, check the active branch and working tree, then verify current behavior in `menuki.html` and the relevant modules under `js/` and `assets/`. Do not infer implementation from plans in the documentation.
