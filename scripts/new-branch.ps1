[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Name
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([string[]]$Arguments)

    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git exited with code ${LASTEXITCODE}: git $($Arguments -join ' ')"
    }
}

function Test-GitRef {
    param([Parameter(Mandatory = $true)][string]$Ref)

    & git -C $repoRoot show-ref --verify --quiet $Ref
    return $LASTEXITCODE -eq 0
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    throw 'The current directory is not inside a Git repository.'
}

$status = @(& git -C $repoRoot status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Could not read the repository status.' }
$currentBranch = (& git -C $repoRoot branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Could not identify the current branch.' }
if ($status.Count -gt 0) {
    throw 'The current checkout has pending changes. Ask the user to clean it before creating a branch.'
}

$gitPaths = @('MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'index.lock') | ForEach-Object {
    (& git -C $repoRoot rev-parse --path-format=absolute --git-path $_).Trim()
}
if ($gitPaths | Where-Object { Test-Path -LiteralPath $_ }) {
    throw 'A Git operation is in progress. Finish it before creating a branch.'
}

& git -C $repoRoot check-ref-format --branch $Name *> $null
if ($LASTEXITCODE -ne 0) { throw "Invalid branch name: $Name" }

if (Test-GitRef -Ref "refs/heads/$Name") { throw "Branch already exists: $Name" }

if ($Name -eq 'main') { throw 'main cannot be created by this script.' }
if ($Name -eq 'dev') {
    if (Test-GitRef -Ref 'refs/remotes/origin/dev') {
        Write-Host 'Base branch: origin/dev'
        Write-Host 'New local branch: dev'
        Invoke-Git -Arguments @('-C', $repoRoot, 'switch', '--create', 'dev', '--track', 'origin/dev')
    }
    else {
        if (-not (Test-GitRef -Ref 'refs/heads/main')) {
            throw 'The local main branch has no commit. Create and review the initial commit on main before initializing dev.'
        }

        Write-Host 'Base branch: main'
        Write-Host 'New local branch: dev'
        Invoke-Git -Arguments @('-C', $repoRoot, 'switch', '--create', 'dev', 'main')
    }
}
elseif ($Name -match '^(docs|fix|chore)/[^/]+$') {
    $baseBranch = 'dev'
}
else {
    throw 'Branch names must use docs/, fix/, or chore/ followed by a description.'
}

if ($Name -ne 'dev') {
    if ($currentBranch -ne 'dev') {
        throw 'Switch to a clean dev checkout in this directory before creating a task branch.'
    }
    if (-not (Test-GitRef -Ref "refs/heads/$baseBranch")) {
        throw "The local $baseBranch branch does not exist. Initialize it before creating $Name."
    }

    if (Test-GitRef -Ref "refs/remotes/origin/$baseBranch") {
        $localCommit = (& git -C $repoRoot rev-parse $baseBranch).Trim()
        $remoteCommit = (& git -C $repoRoot rev-parse "origin/$baseBranch").Trim()
        if ($localCommit -ne $remoteCommit) {
            throw "Local $baseBranch and origin/$baseBranch do not point to the same commit. Fetch and reconcile them before creating $Name."
        }
    }

    Write-Host "Base branch: $baseBranch"
    Write-Host "New branch: $Name"
    Invoke-Git -Arguments @('-C', $repoRoot, 'switch', '--create', $Name, $baseBranch)
}

Write-Host 'Final status:'
& git -C $repoRoot status --short
Write-Host 'Active branch:'
& git -C $repoRoot branch --show-current
