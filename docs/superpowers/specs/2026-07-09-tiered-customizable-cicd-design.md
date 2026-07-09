# Tiered Customizable CI/CD Design

Status: Approved for implementation planning
Date: 2026-07-09

## Goal

AlphaCI should offer a recipe-based customizable CI/CD builder. Users choose the outcome they want: checks, code quality, releases, previews, rollback, and notifications. AlphaCI compiles those choices into thin caller workflows in the customer repository and centrally owned reusable workflow modules.

The product must not expose infrastructure mechanics in customer-facing labels, setup copy, status cards, PR copy, or normal workflow summaries. Customer-visible language should stay in product terms such as Quality Checks, Code Quality, Build Check, Release, Preview, Verify, and Rollback.

## Product Positioning

AlphaCI has three self-serve plans:

| Plan | Product promise | Included workflow family |
| --- | --- | --- |
| Solo | Complete CI confidence for small projects | Checks only |
| Plus | CI plus code quality intelligence | Checks plus Code Quality |
| Pro | Full CI/CD for teams that ship | Checks, Code Quality, Releases, Previews, Rollback |

Solo is not a hosting plan. It must still feel complete because it answers whether a change can safely merge. Plus adds deeper code-quality insight. Pro is the shipping tier.

## Plan Capability Matrix

| Capability | Solo | Plus | Pro |
| --- | --- | --- | --- |
| PR checks | Yes | Yes | Yes |
| Branch checks | Yes | Yes | Yes |
| Lint | Yes | Yes | Yes |
| Unit tests | Yes | Yes | Yes |
| Typecheck | Yes | Yes | Yes |
| Build validation | Yes | Yes | Yes |
| Dependency audit | Yes | Yes | Yes |
| Secret scan | Yes | Yes | Yes |
| PR/check summary | Yes | Yes | Yes |
| Basic workflow history | Yes | Yes | Yes |
| Code Quality analysis | No | Yes | Yes |
| Code Quality gate | No | Yes | Yes |
| Code Quality trends | No | Yes | Yes |
| Managed releases | No | No | Yes |
| Preview releases | No | No | Yes |
| Rollback | No | No | Yes |
| Environment promotion | No | No | Yes |
| Release history | No | No | Yes |

Pro includes Plus capabilities. Plus includes Solo capabilities.

## Customization Model

Users customize intent, not raw workflow internals.

Simple mode:

- Project type: frontend, backend, or later fullstack.
- Branch flow: for example, dev to uat to main.
- Recipe: Check, Code Quality, or Release, depending on plan.

Advanced mode:

- Enable or disable checks allowed by the plan.
- Set coverage threshold.
- Choose whether production releases need manual approval.
- Choose preview behavior when Pro is active.
- Configure notifications.

Expert mode:

- Add safe extension hooks such as pre-build command, post-test command, or post-release verification URL.
- Extension hooks must not expose infrastructure credentials, raw provider settings, or unrestricted workflow editing.

Raw YAML editing is not part of the product surface. AlphaCI owns the workflow schema and compiler.

## Starter Kits

Starter kits are separate Git repositories owned by Alpha-Explora. They contain production-shaped app source, package scripts, tests, local tooling, README files, and local environment examples. They do not contain generated AlphaCI workflow files or project metadata folders.

For new projects, AlphaCI creates the repository from the selected starter kit first. After the starter files exist, AlphaCI generates plan-allowed caller workflows in the new repository.

For existing projects, AlphaCI skips starter-kit creation and only detects project settings before adding caller workflows.

Phase 1 supports single-app project structure only. Fullstack and monorepo starters remain out of scope until a later rollout.

Phase 1 starter kits should feel like professional foundations, not empty demos. Frontend starters include reusable UI states, environment helpers, and an API boundary. Backend starters include health checks, environment validation, structured error or service boundaries, and request-level traceability.

## Workflow Families

### Check Recipes

Available to Solo, Plus, and Pro.

Purpose: prove that a branch or pull request is safe enough to continue.

Customer-visible steps:

```text
Authorize
Inspect Project
Quality Checks
Build Check
Record Check Summary
```

Plus and Pro add:

```text
Code Quality
Record Quality Summary
```

### Release Recipes

Available only to Pro.

Purpose: publish, verify, promote, and recover releases.

Customer-visible steps:

```text
Authorize
Inspect Project
Quality Checks
Code Quality
Build
Release
Verify Release
Record Release
```

Preview and operations workflows are also Pro-only.

## Caller Workflows

Customer repositories receive thin parent workflows. These files should remain small and readable. They pass project identity, branch, commit, selected recipe, workflow ref, environment, and approved options into central reusable workflows.

Solo and Plus:

```text
.github/workflows/alphaci-ci.yml
```

Pro:

```text
.github/workflows/alphaci-ci.yml
.github/workflows/alphaci-release.yml
.github/workflows/alphaci-preview.yml
.github/workflows/alphaci-ops.yml
```

The caller workflow is visible in the customer repository, but it should not describe the internal hosting or runtime implementation.

## Branch Journey

Default branch mapping:

```text
dev  -> Development
uat  -> UAT
main -> Production
```

Solo push to dev:

```text
Authorize
Inspect Project
Quality Checks
Build Check
Record Check Summary
```

User sees that the Development branch was checked. No release is created.

Plus push to dev:

```text
Authorize
Inspect Project
Quality Checks
Code Quality
Build Check
Record Quality Summary
```

User reviews Code Quality findings, fixes blockers, and merges when healthy.

Pro push to dev:

```text
Authorize
Inspect Project
Quality Checks
Code Quality
Build
Release to Development
Verify Release
Record Release
```

User opens the Development release, tests it, then promotes by merging toward UAT and Production.

## Entitlement Rules

The backend is the source of truth for plan entitlements. The workflow compiler must not generate unavailable capabilities.

Rules:

- Solo cannot generate release, preview, rollback, or Code Quality jobs.
- Plus cannot generate release, preview, or rollback jobs.
- Pro can generate all supported workflow jobs.
- Downgrades must remove or disable unavailable workflow paths through a workflow update PR.
- If a stale caller workflow tries to run a locked capability, central authorization must fail early with a safe product-level message.

Safe failure messages:

```text
This workflow is not available on your current plan.
Upgrade to Pro to enable managed releases.
Upgrade to Plus or Pro to enable Code Quality.
```

## Data Flow

1. User creates or connects a project from the existing onboarding flow.
2. AlphaCI reads the workspace plan, project type, repo shape, selected recipe, branch flow, and allowed settings.
3. Backend validates the active workspace plan and builds a normalized workflow settings object.
4. Workflow compiler generates thin caller workflows.
5. AlphaCI opens a workflow update PR in the customer repository.
6. After merge, GitHub runs the caller workflow on the configured event.
7. Caller workflow invokes central reusable workflows.
8. Central workflows authorize the run before doing any expensive or locked work.
9. Results are recorded back into AlphaCI as check, quality, or release history.

## Error Handling

Errors should be user-actionable and product-level.

Examples:

```text
Quality Checks failed: unit tests did not pass.
Build Check failed: the project could not be built.
Code Quality failed: quality gate did not pass.
Release failed: AlphaCI could not publish this version.
Verify Release failed: the release did not become healthy.
Plan check failed: this workflow is not available on your current plan.
```

Internal errors may be logged privately with correlation IDs, but customer-facing summaries should not expose implementation-specific provider/runtime names.

## Testing Strategy

Catalog and compiler tests:

- Solo recipe generation includes checks and excludes Code Quality and release jobs.
- Plus recipe generation includes Code Quality and excludes release jobs.
- Pro recipe generation includes checks, Code Quality, releases, previews, and operations.
- Generated caller workflows do not include customer-facing infrastructure/provider wording.
- Stale caller workflows fail early when they request a locked capability.

Backend entitlement tests:

- Active Solo subscription rejects Code Quality and release requests.
- Active Plus subscription accepts Code Quality and rejects release requests.
- Active Pro subscription accepts release, preview, and rollback requests.
- Downgrade creates a workflow update request that removes unavailable capabilities.

Frontend tests:

- Solo workflow builder shows CI options and locked quality/release affordances.
- Plus workflow builder shows Code Quality options and locked release affordances.
- Pro workflow builder shows release, preview, rollback, and promotion options.
- User-facing labels use product terms only.

Workflow contract tests:

- Caller workflows remain thin.
- Central workflows run authorization first.
- Locked capabilities fail before build or release work.
- Workflow summaries use safe product-level names.

## Rollout

Phase 1: Add plan-aware recipe metadata.

Phase 2: Update backend workflow settings normalization and entitlement checks.

Phase 3: Update caller workflow generation.

Phase 4: Update frontend workflow builder and pricing copy.

Phase 5: Add downgrade/update PR behavior.

Phase 6: Run end-to-end checks for Solo, Plus, and Pro projects.

## Non-Goals

- Raw YAML editor.
- Bring-your-own hosting provider setup.
- Exposing internal hosting or runtime choices in normal product surfaces.
- Full monorepo/fullstack support in the first workflow-plan rollout unless explicitly approved later.
