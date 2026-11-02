# Repository Guidance

These instructions apply to the whole repository.

## Before making changes

- Read `README.md`, `context/context.md`, and the relevant documents under `docs/`.
- Before changing application behavior, inspect `menuki.html` and the relevant modules under `js/` and `assets/`; together they are the current runtime source of truth.
- Check the active branch and working-tree status first. Preserve existing user changes and follow the Git workflow below when starting a new task.
- Distinguish implemented behavior from accepted design decisions, proposals, and open questions.

## Repository skills

- Read and follow `.codex/landing-page-audit/SKILL.md` when asked to audit, review, or critique a landing page's visual design or conversion, or when given its URL, screenshot, or page component for design feedback. For Menuki's public homepage, the page is `index.html`.
- The skill checks visual design and landing-page fundamentals, then returns specific, rule-backed findings grouped by severity. It can compare sections with Landingfolio examples when the MCP is available; otherwise use its rules-only workflow. It does not cover copywriting, accessibility, SEO, performance, or code quality. Keep an audit read-only unless the owner asks to implement fixes.

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
- Supabase sync runs automatically after changes while the app is online, checks for remote revisions while visible, and refreshes on focus/reconnection. Reconcile stale writes automatically against the last common local base; Supabase's latest accepted revision wins when both devices changed the same value. Do not show copy-choice prompts during normal device switching. Keep a compact status and offer retry only after a sync error. Do not add manual sync controls to normal use or background/push notifications. Supabase relational tables are canonical for personal data. Account contract 2 uses one consistent read RPC, scoped idempotent actions and a full in-memory session base. Legacy local copies are retained only for transition/old-schema compatibility; never reimport them on ordinary login. See ADR-0051 and docs/backend/account-contract.md; the owner confirmed hosted migration Success, all eight ready=true checks and correct PC/mobile behavior on 2026-10-25. This delivery is closed; distinguish this owner confirmation from independent agent verification. Do not describe it as cloud storage or synchronization.
- Recipe proposals are shared catalog suggestions, separate from personal state. Authenticated users may submit a recipe type, a name (up to 120 characters), up to 30 free-text ingredients (160 characters each), and up to 30 ordered steps (500 characters each). Do not require quantities or nutrition data. Submit through `submit_recipe_proposal`; keep ingredients and steps in their relational child tables. Only accounts in `menuki_admins` may read the shared inbox, download its JSON package, update one proposal through `update_recipe_proposal`, delete one through `delete_recipe_proposal`, or clear the inbox through `clear_recipe_proposals`. Admin changes must use those server-side RPCs; do not grant browser table writes. The project owner assigns admin membership privately; never infer it from a password or expose role grants in the browser.
- Admins use AI outside the web app to enrich raw proposals, verify foods and nutrition, and edit the canonical JSON catalogs manually. The admin export must match `docs/schemas/recipe-proposal-export.schema.json` version 1 and omit submitter identity and personal data. When an admin supplies this package for catalog work, inspect the current catalog files and schemas, preserve stable IDs and units, check duplicates, and show the proposed diff for review. The browser must not write catalog files to GitHub or expose a GitHub token. The global proposal purge is available only after the catalog changes have been published; require confirmation and the current proposal count, and remove only proposal rows and their children.
- Keep the UI in Spanish. Keep `AGENTS.md` and `context.md` in English; write other project documentation in Spanish unless the owner asks otherwise.
- `menuki.html` is the app shell and loads `assets/css/app.css` and the `js/main.js` ES-module entry. `data/foods.json` and `data/recipes.json` are the canonical generic catalogs; derive runtime models from them instead of maintaining duplicate catalog literals. The fixed menu remains a code template of stable recipe IDs for legacy compatibility. New accounts complete the four-step setup and explicitly confirm a first menu from the common generator (ADR-0047).
- Supabase Auth manages accounts, and personal data, including next-cycle proposals, lives in relational Supabase tables. Persist recipe/food versions, meal quantities and dated targets with confirmed plans; a retired generic recipe must remain readable in an existing plan. JSON catalogs remain editorial sources for new generation. Do not archive a cycle because a client cannot render or omits it. Account contract 2 uses session memory; the Auth SDK manages its own session storage. The configured project has the authentication and cloud-sync migrations applied; changes reach GitHub Pages after publication.
- State format v5 is the oldest supported persisted browser state; current state is v12. Keep v5-v11 local-storage migrations plus the v12 planning-fields migration for existing installations, do not add v1-v4 migrations, and do not offer personal-state JSON import or restore controls.
- Do not add export, import, or restore controls for personal state or periodic backup reminders. The only JSON download exception is the admin-only recipe proposal package documented in docs/schemas/recipe-proposal-export.schema.json.

## Catalogs and planner

- Catalog JSON is the canonical source for generic food and recipe data only. Never put personal profiles, weights, pantry balances, meal history, credentials, or backups in it.
- Keep food IDs stable and ensure every recipe ingredient references an existing food ID. `food.unit` is the pantry/purchase unit; `food.recipeUnit` is the recipe measurement unit. Whole fruit portions (banana, apple, kiwi, mandarin, orange, pear, and seasonal fruit) use units in recipes and pantry/purchases; half pieces are allowed when a recipe calls for them. Vegetables used chopped or in partial portions, including avocado, use grams in recipes and units in pantry/purchases when sold whole. Bread de molde uses slices in recipes and grams for pantry/purchases, with an approximate 25 g per slice for conversion and a maximum of two whole slices per meal; eggs use units and liquids use millilitres. Preserve the JSON Schemas and nutrition basis described in `docs/planner/specification.md`.
- Follow accepted planner decisions in `docs/decisions/`. Treat items marked proposed or open as undecided; do not silently turn them into requirements.
- When bone recovery is enabled, new menu proposals qualitatively favor catalog foods tagged as calcium, vitamin D, or vitamin C sources. Do not present those tags as measured micronutrient totals or a treatment.
- Record activity only after it happens. Its estimated net energy `(MET - 1) × weight_kg × hours` applies only to that calendar date; never forecast sessions or change future dates. Keep completed meal quantities fixed and distribute the remaining daily target across uncompleted meals. Keep protein and fat targets stable; extra session energy should primarily affect carbohydrate portions. Use base recipe quantities in catalogs; do not restore `amountOnStrengthDay`.
- Favor stock without blocking for low stock and a familiar base week repeated across the cycle, with gradual renewal by preparation family (ADR-0046). Let the user review, swap individual meals, and preserve every lock when regenerating.

## Inventory and privacy

- Use `ud` for eggs and pantry/purchases of the whole fruits/vegetables listed in `docs/product/requirements.md`; fractional pantry quantities are allowed. Measure fruit portions and bread slices as recipe `ud`, allowing half fruit pieces but keeping bread to whole slices and at most two per meal. Measure vegetables used chopped or in portions and other solids in recipe grams. Use `ud` for eggs and `ml` for liquids. Milk is purchased in 1 L cartons; ground coffee is measured in grams and included in breakfasts.
- Preserve the full recipe usage in the meal snapshot, but deduct no more than the available pantry balance. Pantry stock must never fall below zero. Do not calculate, display, or store a shortfall for a completed meal. Reversals restore only the amount actually deducted and must be idempotent.
- Keep personal-state cloud writes transactional and idempotent through apply_menuki_action (account contract 2), which uses sync_menuki_state/reset_menuki_state internally; bind them to auth.uid(), retain RLS, and reject stale sync_revision writes. Shared recipe proposals are a deliberate separate boundary: use the scoped, transactional submit_recipe_proposal and admin-only clear_recipe_proposals RPCs. Use reset_menuki_state only for an explicitly confirmed full reset. Never store the full personal state as one JSON column.
- GitHub Pages content is public. If Supabase is integrated, use an appropriate public client key with RLS on all user tables; never expose service-role keys or secrets.
- Keep `index.html` at the repository root with a relative destination for GitHub Pages.

## Documentation

- `README.md` is the user-facing entry point; `context/context.md` is a concise English handoff; detailed requirements and design live under `docs/`.
- Record accepted decisions in dated decision records. Put proposals and unresolved questions in `docs/open-questions.md` until the owner accepts them.
- Update the relevant documentation when product behavior or architecture decisions change. Do not duplicate long specifications in `AGENTS.md`.
