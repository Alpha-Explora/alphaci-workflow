# Phase 1 Starter Kits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Phase 1 starter-kit support by separating app starter repositories from AlphaCI workflow generation, starting with a Laravel + React starter kit adapted from Laravel's official React starter kit.

**Architecture:** Starter kits live as separate Git repositories under the Alpha-Explora organization and contain no AlphaCI workflow files. The central `cicd-workflow` repo stores catalog metadata and contracts that let AlphaCI create a repo from a starter kit first, then add plan-gated caller workflows afterward. The first implementation keeps repo shape to single-app projects only.

**Tech Stack:** GitHub template repositories, React, TypeScript, Vite/Laravel starter-kit source, AlphaCI starter metadata, central workflow catalog JSON, Markdown docs.

---

## Current Context

Approved product rules:

- Solo is complete CI only.
- Plus is Solo plus Code Quality.
- Pro is Plus plus managed releases, previews, rollback, and promotion.
- Starter kits are separate repositories and should not contain AlphaCI workflows.
- For new projects, AlphaCI creates the repo from the starter kit first, then adds workflows based on plan.
- Existing repos skip the starter kit and only receive workflows.
- Phase 1 supports single-app project structure only.

Official source for the first starter kit:

- `https://github.com/laravel/react-starter-kit`

Target local starter-kit repo:

- `C:\Codes\cicd-ex\alphaexplora-react-starter-kit`

Target remote after local edits:

- `https://github.com/Alpha-Explora/alphaexplora-react-starter-kit.git`

## Files And Repositories

### `cicd-workflow`

- Create or modify `docs/superpowers/plans/2026-07-09-phase-1-starter-kits.md`
- Modify `docs/superpowers/specs/2026-07-09-tiered-customizable-cicd-design.md`
- Modify `catalog/project-types.json`
- Create `catalog/starter-kits.json`
- Create `docs/starter-kits/README.md`

### New separate repository

- Create local repo: `C:\Codes\cicd-ex\alphaexplora-react-starter-kit`
- Source from Laravel React starter kit
- Remove any copied workflow files
- Add `.alphaci/project.json`
- Update `README.md` for AlphaCI starter-kit usage
- Keep app source, scripts, tests, and local developer tooling

## Task 1: Document The Starter-Kit Phase In The Existing Spec

**Files:**

- Modify: `C:\Codes\cicd-ex\cicd-workflow\docs\superpowers\specs\2026-07-09-tiered-customizable-cicd-design.md`

- [ ] Add a "Starter Kits" section after "Customization Model".

Required content:

```markdown
## Starter Kits

Starter kits are separate Git repositories owned by Alpha-Explora. They contain app source, package scripts, tests, local tooling, README files, and an `.alphaci/project.json` contract. They do not contain generated AlphaCI workflow files.

For new projects, AlphaCI creates the repository from the selected starter kit first. After the starter files exist, AlphaCI generates plan-allowed caller workflows in the new repository.

For existing projects, AlphaCI skips starter-kit creation and only detects project settings before adding caller workflows.

Phase 1 supports single-app project structure only. Fullstack and monorepo starters remain out of scope until a later rollout.
```

- [ ] Run: `rg -n "Starter Kits|Fullstack|monorepo|Cloud Run|GCP" docs/superpowers/specs/2026-07-09-tiered-customizable-cicd-design.md`

Expected:

- The new Starter Kits section exists.
- The non-goal still states fullstack/monorepo are not part of the first rollout.
- No customer-facing implementation-provider wording is introduced.

## Task 2: Add Starter-Kit Catalog Metadata

**Files:**

- Create: `C:\Codes\cicd-ex\cicd-workflow\catalog\starter-kits.json`
- Inspect only: `C:\Codes\cicd-ex\cicd-workflow\catalog\project-types.json`

- [ ] Create `catalog/starter-kits.json`.

Required structure:

```json
{
  "schemaVersion": 1,
  "starterKits": [
    {
      "id": "react-starter-kit",
      "label": "React Starter Kit",
      "description": "A Laravel + React single-app starter adapted for AlphaCI projects.",
      "repo": "Alpha-Explora/alphaexplora-react-starter-kit",
      "source": {
        "type": "adapted",
        "from": "laravel/react-starter-kit"
      },
      "projectType": "laravel-react-app",
      "repoShape": "single-app",
      "language": "php-typescript",
      "framework": "laravel-react",
      "defaultWorkingDirectory": ".",
      "workflowTiming": "after-template",
      "containsWorkflows": false,
      "defaultRecipesByPlan": {
        "solo": "laravel-react-checks",
        "plus": "laravel-react-code-quality",
        "pro": "laravel-react-release"
      }
    }
  ]
}
```

- [ ] Do not register this starter as `react-spa`. It remains a starter-kit catalog entry until Laravel + React workflow recipes are implemented.

- [ ] Run JSON validation:

```powershell
node -e "JSON.parse(require('fs').readFileSync('catalog/starter-kits.json','utf8')); JSON.parse(require('fs').readFileSync('catalog/project-types.json','utf8')); console.log('catalog json ok')"
```

Expected output:

```text
catalog json ok
```

## Task 3: Add Starter-Kit Documentation

**Files:**

- Create: `C:\Codes\cicd-ex\cicd-workflow\docs\starter-kits\README.md`

- [ ] Create documentation explaining the starter-kit lifecycle.

Required sections:

```markdown
# Starter Kits

Starter kits are app foundations. They are not workflow packs.

## New Project Flow

1. User chooses a starter kit.
2. AlphaCI creates a new repository from the selected starter kit.
3. AlphaCI reads `.alphaci/project.json`.
4. AlphaCI applies plan entitlements.
5. AlphaCI adds thin caller workflows.
6. The first AlphaCI check or release run starts.

## Existing Repository Flow

Existing repositories skip starter-kit creation. AlphaCI detects project settings, asks the user to confirm them, and adds plan-allowed caller workflows.

## Phase 1 Scope

Phase 1 supports single-app repositories only.

## Workflow Boundary

Starter kits must not contain generated AlphaCI workflow files. Workflow generation is owned by AlphaCI after repository creation.
```

- [ ] Run: `rg -n "Starter kits are app foundations|Phase 1 supports single-app" docs/starter-kits/README.md`

Expected: both phrases are found.

## Task 4: Create The Local AlphaCI React Starter Kit Repo

**Files:**

- Create local repo: `C:\Codes\cicd-ex\alphaexplora-react-starter-kit`

- [ ] Clone Laravel's React starter kit into the target local repo.

Run:

```powershell
git clone https://github.com/laravel/react-starter-kit.git C:\Codes\cicd-ex\alphaexplora-react-starter-kit
```

Expected:

- The directory exists.
- The source has no generated AlphaCI workflow files.

- [ ] Set the target remote.

Run:

```powershell
git remote set-url origin https://github.com/Alpha-Explora/alphaexplora-react-starter-kit.git
```

Expected:

```powershell
git remote -v
```

shows `Alpha-Explora/alphaexplora-react-starter-kit.git`.

## Task 5: Add The Starter-Kit Contract

**Files:**

- Create: `C:\Codes\cicd-ex\alphaexplora-react-starter-kit\.alphaci\project.json`

- [ ] Add `.alphaci/project.json`.

Required content:

```json
{
  "schemaVersion": 1,
  "starterKit": "react-starter-kit",
  "projectType": "laravel-react-app",
  "repoShape": "single-app",
  "language": "php-typescript",
  "framework": "laravel-react",
  "defaultRecipe": "laravel-react-checks",
  "workingDirectory": ".",
  "commands": {
    "install": "composer install --no-interaction --prefer-dist --optimize-autoloader && npm ci",
    "lint": "composer lint:check && npm run lint:check && npm run format:check",
    "test": "php artisan test",
    "typecheck": "composer types:check && npm run types:check",
    "build": "npm run build"
  },
  "workflowPolicy": {
    "generatedByAlphaCI": true,
    "templateContainsWorkflows": false,
    "workflowInstallTiming": "after-template"
  }
}
```

- [ ] Run JSON validation:

```powershell
node -e "JSON.parse(require('fs').readFileSync('.alphaci/project.json','utf8')); console.log('starter contract ok')"
```

Expected output:

```text
starter contract ok
```

## Task 6: Remove Workflow Files From The Starter Kit

**Files:**

- Inspect: `C:\Codes\cicd-ex\alphaexplora-react-starter-kit\.github`

- [ ] Check for workflow files.

Run:

```powershell
if (Test-Path -LiteralPath .github\workflows) { Get-ChildItem -LiteralPath .github\workflows -Recurse } else { "no workflows" }
```

- [ ] If workflow files exist, remove only `.github/workflows`.

Run:

```powershell
if (Test-Path -LiteralPath .github\workflows) { Remove-Item -LiteralPath .github\workflows -Recurse -Force }
```

- [ ] Verify there are no workflow files.

Run:

```powershell
if (Test-Path -LiteralPath .github\workflows) { throw "workflow files still exist" } else { "starter kit has no workflows" }
```

Expected output:

```text
starter kit has no workflows
```

## Task 7: Rebrand README For AlphaCI Starter-Kit Usage

**Files:**

- Modify: `C:\Codes\cicd-ex\alphaexplora-react-starter-kit\README.md`

- [ ] Replace the README with AlphaCI starter-kit copy that preserves attribution.

Required sections:

```markdown
# AlphaCI React Starter Kit

This starter kit is an AlphaCI-ready React application foundation adapted from Laravel's official React starter kit.

## How AlphaCI Uses This Repository

AlphaCI uses this repository as an application template. It does not store generated AlphaCI workflow files here.

New project flow:

1. Create a repository from this starter kit.
2. Read `.alphaci/project.json`.
3. Apply the user's plan entitlements.
4. Add the plan-allowed AlphaCI caller workflows.
5. Start the first check or release run.

## Local Development

Install dependencies:

```bash
npm ci
```

Run local development:

```bash
npm run dev
```

Run checks:

```bash
npm run lint
php artisan test
composer types:check && npm run types:check
npm run build
```

## Attribution

This starter kit is adapted from `laravel/react-starter-kit`, which is open-sourced under the MIT license.
```

- [ ] Run: `rg -n "AlphaCI React Starter Kit|does not store generated AlphaCI workflow files|laravel/react-starter-kit" README.md`

Expected: all phrases are found.

## Task 8: Validate And Commit Central Catalog Changes

**Files:**

- `C:\Codes\cicd-ex\cicd-workflow\catalog\starter-kits.json`
- `C:\Codes\cicd-ex\cicd-workflow\catalog\project-types.json`
- `C:\Codes\cicd-ex\cicd-workflow\docs\starter-kits\README.md`
- `C:\Codes\cicd-ex\cicd-workflow\docs\superpowers\specs\2026-07-09-tiered-customizable-cicd-design.md`
- `C:\Codes\cicd-ex\cicd-workflow\docs\superpowers\plans\2026-07-09-phase-1-starter-kits.md`

- [ ] Run validation:

```powershell
node -e "JSON.parse(require('fs').readFileSync('catalog/starter-kits.json','utf8')); JSON.parse(require('fs').readFileSync('catalog/project-types.json','utf8')); console.log('catalog json ok')"
git diff --check -- catalog docs
```

Expected:

- `catalog json ok`
- no `git diff --check` output

- [ ] Commit only Phase 1 central changes.

Run:

```powershell
git add -- catalog/starter-kits.json catalog/project-types.json docs/starter-kits/README.md docs/superpowers/specs/2026-07-09-tiered-customizable-cicd-design.md docs/superpowers/plans/2026-07-09-phase-1-starter-kits.md
git commit -m "Plan phase 1 starter kit catalog"
```

## Task 9: Validate And Commit Starter Kit Repo

**Files:**

- `C:\Codes\cicd-ex\alphaexplora-react-starter-kit`

- [ ] Run local checks available in the starter kit.

Run:

```powershell
npm install
npm run lint
php artisan test
composer types:check && npm run types:check
npm run build
```

Expected:

- Dependencies install.
- Lint, tests, typecheck, and build pass or produce concrete follow-up fixes.

- [ ] Commit starter-kit changes.

Run:

```powershell
git add -- .alphaci/project.json README.md .github
git commit -m "Adapt React starter kit for AlphaCI"
```

## Task 10: Push Starter Kit Repo

**Files:**

- `C:\Codes\cicd-ex\alphaexplora-react-starter-kit`

- [ ] Check GitHub auth before push.

Run:

```powershell
gh auth status
```

Expected:

- Authenticated account has access to `Alpha-Explora`.

- [ ] If the repository does not exist, create it in `Alpha-Explora`.

Run:

```powershell
gh repo create Alpha-Explora/alphaexplora-react-starter-kit --private --source . --remote origin --push
```

- [ ] If the repository already exists, push.

Run:

```powershell
git push -u origin main
```

Expected:

- `Alpha-Explora/alphaexplora-react-starter-kit` contains the adapted starter kit.
- No generated AlphaCI workflow files are present.

## Known Blockers

- `gh auth status` currently reports an invalid keyring token for `antoneeeeems`. Pushing or creating the remote repository may require re-authentication.
- Current `cicd-workflow` has unrelated modified GCP plan docs. Do not include them in Phase 1 commits.
