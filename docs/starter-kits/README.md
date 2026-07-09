# Starter Kits

Starter kits are production-shaped app foundations. They are not workflow packs and they do not contain AlphaCI workflow files.

## Phase 1 Kits

- React Starter Kit: `Alpha-Explora/alphaexplora-react-starter-kit`
- Next.js Starter Kit: `Alpha-Explora/alphaexplora-nextjs-starter-kit`
- Node.js Starter Kit: `Alpha-Explora/alphaexplora-nodejs-starter-kit`
- NestJS Starter Kit: `Alpha-Explora/alphaexplora-nestjs-starter-kit`

## Baseline Standard

Every Phase 1 starter must include:

- App or API source with a realistic first structure.
- `.env.example` with local-only defaults.
- Lint, test, build, and start/dev scripts.
- Typecheck script when the stack uses TypeScript.
- At least one meaningful test that exercises real starter behavior.
- Local README instructions.
- No generated AlphaCI workflow files.
- No project metadata folders.

Frontend starters must include reusable UI states, environment helpers, and an API boundary. Backend starters must include a health endpoint, environment validation, structured errors or service boundaries, and request-level traceability.

## New Project Flow

1. User chooses a starter kit.
2. AlphaCI creates a new repository from the selected starter kit.
3. AlphaCI reads central starter-kit metadata from `catalog/starter-kits.json`.
4. AlphaCI applies plan entitlements.
5. AlphaCI adds thin caller workflows.
6. The first AlphaCI check or release run starts.

## Existing Repository Flow

Existing repositories skip starter-kit creation. AlphaCI detects project settings, asks the user to confirm them, and adds plan-allowed caller workflows.

## Phase 1 Scope

Phase 1 supports single-app repositories only.

## Workflow Boundary

Starter kits must not contain generated AlphaCI workflow files. Workflow generation is owned by AlphaCI after repository creation.