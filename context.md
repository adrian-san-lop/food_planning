# Project Context

Last updated: 2026-10-10. This file is a short handoff index, not the full product specification. Detailed decisions and unresolved proposals are linked below.

## Product

- Mi Plan Saludable is currently a personal, single-user web app, used online and published as a static GitHub Pages site.
- The current interface is Spanish. It plans three weeks with five meal slots per day (105 planned meals per cycle), tracks recipes, shopping, pantry stock, strength training, and weight.
- The application currently saves user state in browser `localStorage`. It has no verified remote database, authentication, or cross-device synchronization. A Supabase project was created by the owner, but no schema or integration has been implemented.
- The in-page weekly backup reminder is implemented; there are no push or background notifications.

## Catalogs and planning

- Generic food and recipe catalogs are stored in `data/foods.json` and `data/recipes.json`, version `0.2.0`: 83 foods, 107 recipes, and 512 ingredient references. The catalogs preserve the original 63 foods and 84 recipes and add 20 foods plus 23 recipes. New food entries include generic USDA FoodData Central references and approximate nutrient values. Their contracts are in `data/foods.schema.json` and `data/recipes.schema.json`.
- The HTML loads both JSON catalogs over HTTP(S), checks IDs, units, ingredient references, and meal types, and maps them into the existing runtime model. The fixed `WEEK_1`–`WEEK_3` menu remains the initial cycle.
- The user can generate a 105-meal proposal for the next cycle, review and swap recipes within the same meal type, lock selections, regenerate unlocked meals, and save the proposal in `localStorage`. The proposal records its catalog version and activates when its start date arrives. Stock is a soft preference; there is no minimum count of unused recipes, taste filter, or allergy filter.
- Four initial planning principles are accepted. Exact scoring thresholds, dislike handling, and multi-person preference aggregation are not decided. See the planner specification and open questions.

## Data and safety rules

- Keep public generic catalogs separate from personal profiles and activity data.
- State format v5 is the oldest supported import; the current state format is v6. Do not support v1-v4.
- Use fractional `ud` for eggs and the specified whole produce; `g` for weighed foods and ground coffee; `ml` for liquids. Milk is purchased in 1 L cartons.
- If a logged meal consumes more than recorded stock, record the full consumption and show the deficit. Reversals must not be applied twice.
- No offline queue. Do not claim the current `localStorage` state is synchronized or backed up in the cloud.

## Source-of-truth map

- [README.md](README.md): user-facing overview, current capabilities, and deployment.
- [AGENTS.md](AGENTS.md): repository-wide instructions for coding agents.
- [Product requirements](docs/product/requirements.md): scope and user workflows.
- [Architecture](docs/architecture.md): implemented state and planned data boundaries.
- [Planner specification](docs/planner/specification.md): catalog contract and accepted planner rules.
- [Roadmap](docs/roadmap.md): candidate stages and acceptance criteria.
- [Decision records](docs/decisions/): rationale and acceptance status.
- [Open questions](docs/open-questions.md): proposals and decisions still needed.

Before editing, check the active branch and working tree, then verify current behavior in `web/plan_alimentacion_dinamico_3_semanas.html`. Do not infer implementation from plans in the documentation.
