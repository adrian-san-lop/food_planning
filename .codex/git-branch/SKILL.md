---
name: git-branch
description: Create a task branch from a clean dev checkout in the current repository directory before new repository work. Also supports dev initialization.
---

# Git branch workflow

First resolve the task's [repository Git policy](../../AGENTS.md#git-workflow). Continue the current branch for the same unfinished task. If its explicit task exception requires work directly on `dev`, apply that exception and skip task-branch creation. The clean-checkout procedure below applies when starting a new task under the standard branch workflow; do not reject changes already produced by the current unfinished task.

1. Before editing for a new task, check `git status --short` including untracked files, `git branch --show-current`, and whether a Git operation is in progress. If there are any pending changes, stop and tell the user which paths must be cleaned. Do not stash, commit, discard, or carry them automatically.
2. Confirm that the repository has an initial commit on `main`. In a repository with no commits, review the initial content and obtain user authorization before creating that commit.
3. If local `dev` is missing, initialize it:

   ```powershell
   ./scripts/new-branch.ps1 -Name "dev"
   ```

   When `origin/dev` is already known locally, the script creates a tracking branch from it. Otherwise, it creates `dev` from local `main`.
4. For a new task, switch to `dev` in the current repository directory if a different clean branch is active. Confirm that `dev` is clean, then create `docs/<description>`, `fix/<description>`, or `chore/<description>` from `dev` in this same directory:

   ```powershell
   ./scripts/new-branch.ps1 -Name "docs/update-codex-guide"
   ```

   If switching to `dev` is blocked, stop and explain the obstruction. Never create or use another Git worktree for the new task.

5. Confirm the active task branch and that the checkout status matches the expected pending changes.

## Remote state and safety

- The script does not access the network. If current remote state matters, fetch `origin` with the required authorization before running it.
- When a matching `origin/<base>` remote-tracking branch exists, the script requires the local base to point to the same commit.
- Do not push, merge, rebase, stash, delete branches, or create commits automatically.
- Task branches target `dev`; promotion from `dev` to `main` is a separate pull request.
