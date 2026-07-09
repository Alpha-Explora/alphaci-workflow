# Phase 1 Starter Kits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Phase 1 starter-kit support by separating app starter repositories from AlphaCI workflow generation for React, Next.js, Node.js, and NestJS.

**Architecture:** Starter kits live as separate Git repositories under the Alpha-Explora organization and contain no AlphaCI workflow files or project metadata folders. The central `cicd-workflow` repo stores catalog metadata and contracts that let AlphaCI create a repo from a starter kit first, then add plan-gated caller workflows afterward. Phase 1 supports single-app repositories only.

**Plan Entitlements:**

- Solo: complete CI only.
- Plus: Solo plus Code Quality.
- Pro: Plus plus managed releases, previews, rollback, and promotion.

## Target Starter Repositories

- `C:\Codes\cicd-ex\alphaexplora-react-starter-kit`
- `C:\Codes\cicd-ex\alphaexplora-nextjs-starter-kit`
- `C:\Codes\cicd-ex\alphaexplora-nodejs-starter-kit`
- `C:\Codes\cicd-ex\alphaexplora-nestjs-starter-kit`

Target remotes:

- `https://github.com/Alpha-Explora/alphaexplora-react-starter-kit.git`
- `https://github.com/Alpha-Explora/alphaexplora-nextjs-starter-kit.git`
- `https://github.com/Alpha-Explora/alphaexplora-nodejs-starter-kit.git`
- `https://github.com/Alpha-Explora/alphaexplora-nestjs-starter-kit.git`

## Central Repository Changes

- Update `catalog/starter-kits.json` with all four external starter repositories.
- Update `catalog/project-types.json` so each Phase 1 project type references the correct starter kit.
- Update `catalog/workflow-recipes.json` descriptions so user-facing recipe copy stays product-level.
- Update `docs/starter-kits/README.md` with the starter lifecycle and workflow boundary.
- Update `docs/superpowers/specs/2026-07-09-tiered-customizable-cicd-design.md` to document starter kits as separate repos.

Validation:

```powershell
node -e "JSON.parse(require('fs').readFileSync('catalog/starter-kits.json','utf8')); JSON.parse(require('fs').readFileSync('catalog/project-types.json','utf8')); JSON.parse(require('fs').readFileSync('catalog/workflow-recipes.json','utf8')); console.log('catalog json ok')"
git diff --check -- catalog docs
```

## Starter Repository Requirements

Each starter repository must:

- Contain app source, package scripts, tests, local developer tooling, and a README.
- Include `.env.example` with local-only defaults.
- Include meaningful tests against real starter behavior.
- Include lint, test, build, and start/dev scripts.
- Include a typecheck script for TypeScript stacks.
- Stay production-shaped without becoming a full product template.
- Omit generated AlphaCI workflow files.
- Omit project metadata folders.
- Omit inherited files or copy from unrelated framework stacks.
- Use a clean local Git history owned by AlphaCI.
- Point `origin` at the matching `Alpha-Explora` repository.

Frontend starters must include reusable UI states, environment helpers, and an API boundary. Backend starters must include a health endpoint, environment validation, structured errors or service boundaries, and request-level traceability.

Validation for each starter:

```powershell
npm install
npm run lint
npm run test
npm run build
```

React, Next.js, and NestJS also expose:

```powershell
npm run typecheck
```

## Publish Steps

1. Commit central catalog and documentation updates in `cicd-workflow`, excluding unrelated GCP plan files.
2. Create a clean initial commit in each starter-kit repository.
3. Push the central workflow branch.
4. Push each starter repository to `Alpha-Explora`.

## Known Blockers

- `gh auth status` currently reports an invalid keyring token for `antoneeeeems`. Creating missing GitHub repositories may require re-authentication.
- Current `cicd-workflow` has unrelated modified GCP plan docs. Do not include them in Phase 1 commits.
