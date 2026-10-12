# Repository Guidance

These instructions apply to the whole repository.

## Before making changes

- Read `README.md`, `context/context.md`, and the relevant documents under `docs/`.
- Before changing application behavior, inspect `menuki.html` and the relevant modules under `js/` and `assets/`; together they are the current runtime source of truth.
- Check the active branch and working-tree status first. Preserve existing user changes and follow the Git workflow below when starting a new task.
- Distinguish implemented behavior from accepted design decisions, proposals, and open questions.

## Git workflow

- Work in the existing repository checkout. Do not create or use Git worktrees for repository tasks.
- Continue on the current task branch when resuming that same unfinished task. Before a new task, require a clean working tree, including untracked files. If it is dirty, report the paths and wait for the owner to decide how to handle them; never stash, commit, discard, or transfer changes automatically.
- Use `dev` as the base for task branches. Fetch `origin` when its current state matters, switch to `dev` in this checkout, and require local `dev` to match `origin/dev`. Fast-forward only when possible; if branches have diverged, stop for review instead of resetting or rebasing automatically.
- Create task branches with `./scripts/new-branch.ps1 -Name "docs/<description>"`, `fix/<description>`, or `chore/<description>`. The script requires a clean checkout and does not fetch from the network.
- Task branches are proposed to `dev` through a pull request. Promoting `dev` to `main` is a separate pull request. GitHub Pages currently publishes from `dev`.
- Never commit or push unless the owner explicitly asks. For commits, use `./scripts/commit.ps1` with explicit `-Path` values, or `-All` only when all changes are explicitly approved. `-Yes` skips the script's confirmation and is allowed only when the owner explicitly authorized that commit; without it, retain the interactive confirmation.
- Push only after explicit authorization, using `./scripts/push-origin.ps1 -Yes` for a task branch. Direct pushes to `main` or `dev` additionally require explicit authorization and `-AllowProtectedBranch`. Without `-Yes`, retain the interactive confirmation.
- Do not merge, rebase, force-push, delete branches, or stash changes automatically.

## Product and data boundaries

- The current product is a personal, single-user, online app. Do not add offline queues or background/push notifications.
- Supabase sync runs automatically after changes while the app is online. Keep a compact status, offer retry only after a sync error, and retain explicit conflict choices. Do not add manual sync controls to normal use or background/push notifications. Supabase relational tables are the canonical remote source for personal data; `localStorage` is only the browser working copy and may hold pending changes. Do not describe it as cloud storage or synchronization.
- Keep the UI in Spanish. Keep `AGENTS.md` and `context.md` in English; write other project documentation in Spanish unless the owner asks otherwise.
- `menuki.html` is the app shell and loads `assets/css/app.css` and the `js/main.js` ES-module entry. `data/foods.json` and `data/recipes.json` are the canonical generic catalogs; derive runtime models from them instead of maintaining duplicate catalog literals. The fixed initial menu remains a code template of stable recipe IDs.
- Supabase Auth manages accounts, and personal data, including next-cycle proposals, syncs to relational Supabase tables. `localStorage` is a browser working copy. The configured project has the authentication and cloud-sync migrations applied; changes reach GitHub Pages after publication.
- State format v5 is the first supported import format; current state is v8. Accept v5-v8 imports and do not add v1-v4 migrations.
- Do not add JSON export/download controls or periodic backup reminders. Keep the supported v5-v8 JSON restore flow.

## Catalogs and planner

- Catalog JSON is the canonical source for generic food and recipe data only. Never put personal profiles, weights, pantry balances, meal history, credentials, or backups in it.
- Keep food IDs stable and ensure every recipe ingredient references an existing food ID. `food.unit` is the pantry/purchase unit; `food.recipeUnit` is the recipe measurement unit. Whole fruit and vegetables use grams in recipes and units in pantry/purchases; eggs use units and liquids use millilitres. Preserve the JSON Schemas and nutrition basis described in `docs/planner/specification.md`.
- Follow accepted planner decisions in `docs/decisions/`. Treat items marked proposed or open as undecided; do not silently turn them into requirements.
- When bone recovery is enabled, new menu proposals qualitatively favor catalog foods tagged as calcium, vitamin D, or vitamin C sources. Do not present those tags as measured micronutrient totals or a treatment.
- Record activity only after it happens. Its estimated net energy `(MET - 1) × weight_kg × hours` applies only to that calendar date; never forecast sessions or change future dates. Keep completed meal quantities fixed and distribute the remaining daily target across uncompleted meals. Keep protein and fat targets stable; extra session energy should primarily affect carbohydrate portions. Use base recipe quantities in catalogs; do not restore `amountOnStrengthDay`.
- Also favor stock without blocking for low stock, seek variety while allowing necessary repeats, and let the user review, swap, and lock proposed meals.

## Inventory and privacy

- Use `ud` for eggs and pantry/purchases of the whole fruits/vegetables listed in `docs/product/requirements.md`; fractions are allowed. Measure all solid ingredients, including whole produce, in recipe grams; use `ud` for eggs and `ml` for liquids. Milk is purchased in 1 L cartons; ground coffee is measured in grams and included in breakfasts.
- Record full recipe consumption even if it exceeds recorded stock; show the deficit and allow a negative balance. Reversals must be idempotent.
- Keep cloud writes transactional and idempotent through `sync_menuki_state`; bind all writes to `auth.uid()`, retain RLS, and reject stale `sync_revision` writes. Use `reset_menuki_state` only for an explicitly confirmed full reset/import. Never store the full personal state as one JSON column.
- GitHub Pages content is public. If Supabase is integrated, use an appropriate public client key with RLS on all user tables; never expose service-role keys or secrets.
- Keep `index.html` at the repository root with a relative destination for GitHub Pages.

## Documentation

- `README.md` is the user-facing entry point; `context/context.md` is a concise English handoff; detailed requirements and design live under `docs/`.
- Record accepted decisions in dated decision records. Put proposals and unresolved questions in `docs/open-questions.md` until the owner accepts them.
- Update the relevant documentation when product behavior or architecture decisions change. Do not duplicate long specifications in `AGENTS.md`.
