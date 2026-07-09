# Onboarding Project Creation Starter Kits Design

Status: Approved for review
Date: 2026-07-09

## Goal

Add starter-kit project creation to the existing AlphaCI onboarding and create-project flow. Users should be able to start a new project from a supported starter kit or connect an existing repository without seeing implementation details or choosing a subscription plan during project setup.

The workspace subscription is already known. Project creation must read that subscription and apply the allowed setup automatically.

## Product Rule

Project creation is not a billing flow.

Users choose:

- Source: start from starter kit or connect existing repository.
- Starter kit or detected project type.
- Repository name and visibility.
- Supported project settings such as default branch flow and allowed check options.

Users do not choose:

- Solo, Plus, or Pro plan.
- Raw workflow files.
- Internal runtime, hosting, or provider settings.

The create-project UI may show plan-aware included features and locked upgrade affordances, but plan changes belong in billing or workspace settings.

## Plan Entitlement Behavior

The backend is the source of truth for the active workspace plan.

| Workspace plan | Project setup result |
| --- | --- |
| Solo | Configure checks only. Do not configure Code Quality, releases, previews, rollback, or promotion. |
| Plus | Configure checks and Code Quality. Do not configure releases, previews, rollback, or promotion. |
| Pro | Configure checks, Code Quality, releases, previews, rollback, and promotion where supported. |

The frontend can render the effective setup summary from entitlement data, but it must not trust client-selected capabilities.

## Existing Product Surfaces

The feature should be built into the existing product surfaces, not as a separate builder.

Frontend targets:

- `cicd-workflow-fe/src/app/onboarding/page.tsx`
- `cicd-workflow-fe/src/features/dashboard/onboarding/onboarding-page.tsx`
- `cicd-workflow-fe/src/hooks/use-create-project-form.ts`
- `cicd-workflow-fe/src/hooks/use-project-options-catalog.ts`
- `cicd-workflow-fe/src/lib/api/projects.ts`
- `cicd-workflow-fe/src/lib/api/catalog.ts`
- `cicd-workflow-fe/src/lib/onboarding/create-project-tour.ts`

Backend targets:

- Existing project creation route and service.
- Existing catalog/options route.
- Existing repository setup integration.
- Existing workflow setup path.

Central workflow targets:

- `catalog/starter-kits.json`
- `catalog/project-types.json`
- `catalog/workflow-recipes.json`

## Starter Kit Source

Phase 1 supports these starter kits:

- React Starter Kit
- Next.js Starter Kit
- Node.js Starter Kit
- NestJS Starter Kit

Starter kit repositories are owned by Alpha-Explora and contain app source only. They do not contain `.alphaci`, generated workflow files, or project metadata folders.

AlphaCI creates the repository from the selected starter kit first. After the repository exists, AlphaCI adds the plan-allowed workflow setup.

## User Journey

### New Project From Starter Kit

1. User opens onboarding or create project.
2. User selects `Start from starter kit`.
3. User selects React, Next.js, Node.js, or NestJS.
4. User enters repository name and basic repository settings.
5. AlphaCI shows a setup summary based on the current workspace plan.
6. User confirms project creation.
7. AlphaCI creates the repository from the starter kit.
8. AlphaCI configures the allowed checks and workflow setup.
9. User lands on the project setup result with the first run ready or the next action clearly shown.

### Existing Repository

1. User opens onboarding or create project.
2. User selects `Connect existing repo`.
3. AlphaCI detects or asks for the project type.
4. AlphaCI shows a setup summary based on the current workspace plan.
5. AlphaCI creates a setup pull request for workflow changes.
6. User reviews and merges the setup pull request.

New starter-kit repositories can use direct setup because they do not contain user code yet. Existing repositories should use a setup pull request because they already contain user-owned code.

## Frontend Design

The onboarding/create-project screen should become a source-aware flow:

- Source step: `Start from starter kit` or `Connect existing repo`.
- Template step: visible only for starter-kit projects.
- Repository step: repository name and visibility.
- Setup summary step: read-only summary of what the current workspace includes.

The setup summary should use customer-facing product language:

- Checks
- Code Quality
- Releases
- Previews
- Rollback

It must not expose internal hosting, runtime, provider, or deployment mechanics.

Locked features should be visible only as upgrade prompts. For example:

- Solo can see `Code Quality available on Plus`.
- Solo and Plus can see `Releases available on Pro`.

Locked features are not submitted as selected capabilities.

## Backend Design

The create-project request should not accept a plan field.

Proposed shape:

```json
{
  "projectName": "customer-web",
  "sourceType": "starter-kit",
  "starterKitId": "react-starter-kit",
  "repositoryName": "customer-web",
  "visibility": "private",
  "branchFlow": {
    "development": "dev",
    "uat": "uat",
    "production": "main"
  },
  "selectedOptions": {
    "lint": true,
    "unit": true,
    "typecheck": true,
    "build": true
  }
}
```

Backend responsibilities:

1. Resolve workspace and active plan from authenticated context.
2. Load starter kit and project type metadata from the catalog.
3. Validate that the selected source type and starter kit are supported.
4. Create the repository from the starter kit when `sourceType` is `starter-kit`.
5. Build a normalized setup request from project type, selected options, and active plan.
6. Remove or reject capabilities unavailable to the active plan.
7. Apply direct setup for new starter-kit repositories.
8. Create a setup pull request for existing repositories.
9. Persist the project with source type, starter kit id, project type, effective plan, and effective capabilities.

The backend must treat client-provided selected options as preferences, not entitlements.

## Data Flow

1. Frontend requests project options catalog.
2. Backend returns supported source types, starter kits, project types, and entitlement summary for the current workspace.
3. User submits create-project form without a plan field.
4. Backend resolves the workspace plan.
5. Backend creates or connects the repository.
6. Backend compiles the allowed workflow setup.
7. Backend applies direct setup or opens setup pull request based on source type.
8. Backend returns project id, setup status, effective capabilities, and next action.

## Error Handling

Customer-facing errors must be product-level and actionable.

Examples:

```text
This starter kit is not available yet.
Repository name is already in use.
Checks could not be configured.
Code Quality is not available on your current plan.
Releases are not available on your current plan.
Setup pull request could not be created.
```

Internal logs may include provider details and correlation ids. User-facing copy should not.

## Testing Strategy

Frontend tests:

- Create-project flow does not render a plan selector.
- Starter-kit flow submits `starterKitId` and no `plan`.
- Existing-repo flow skips starter-kit selection.
- Solo setup summary shows checks and locked quality/release affordances.
- Plus setup summary shows checks and Code Quality, with releases locked.
- Pro setup summary shows checks, Code Quality, releases, previews, and rollback.
- Customer-facing labels do not include internal provider/runtime wording.

Backend tests:

- Create-project request rejects or ignores any plan field.
- Workspace plan is resolved from authenticated context.
- Solo project setup excludes Code Quality and release capabilities.
- Plus project setup includes Code Quality and excludes release capabilities.
- Pro project setup includes release capabilities where supported.
- Starter-kit creation uses direct workflow setup after repository creation.
- Existing repository creation uses setup pull request workflow.
- Unsupported starter kit ids fail with a product-level error.

Catalog tests:

- Every starter kit maps to an enabled Phase 1 project type.
- Every starter kit maps to default recipes by plan.
- Starter kit metadata declares that workflows are added after template creation.

## Rollout

Phase 1 vertical slice:

1. Add starter-kit source selection to onboarding/create project.
2. Wire React Starter Kit creation for Solo workspaces.
3. Configure checks-only workflow setup after repository creation.
4. Return a setup result screen with first-run status or next action.

Follow-up slices:

1. Add Next.js, Node.js, and NestJS to the same flow.
2. Add Plus Code Quality setup.
3. Add Pro release, preview, rollback, and promotion setup.
4. Harden downgrade and entitlement refresh behavior.

## Non-Goals

- Plan selection inside project creation.
- Billing changes inside onboarding.
- Raw workflow editing.
- Fullstack or monorepo starter kits in Phase 1.
- Exposing internal hosting or provider mechanics in customer-facing setup.
