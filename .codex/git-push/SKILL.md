---
name: git-push
description: Publishes the current Git branch to GitHub origin after a local commit, only when the user explicitly asks to push or publish it. Reviewing or preparing a pull request alone does not authorize publication.
---

# Git push workflow

Use this Skill after a local commit is ready to publish.

1. Check `git status --short` and `git branch --show-current`.
2. Stop if the workspace is dirty, the branch is detached, or a Git operation is in progress.
3. Verify the `origin` remote and the current branch.
4. Push only when the user explicitly asks to publish the branch. A request to review or prepare a pull request alone is not push authorization. Do not push `main` or `dev` unless the user explicitly authorizes that protected-branch push. After authorization, use:

   ```powershell
   .\scripts\push-origin.ps1 -AllowProtectedBranch -Yes
   ```

5. For a task branch, run:

   ```powershell
   .\scripts\push-origin.ps1 -Yes
   ```

6. Confirm the remote branch and report the pull request target: work branches target `dev`.

## Policy

- Never force-push.
- Never push uncommitted changes.
- Never create a pull request automatically.
- Push task branches with their current name and set upstream on first push.
- `-Yes` carries the user's explicit push authorization through to the script without asking twice. Without it, the script retains its interactive confirmation for manual use.
- Promote changes through `task branch -> dev -> main` pull requests.
