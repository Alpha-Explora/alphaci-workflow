# Starter Kits

Starter kits are app foundations. They are not workflow packs and they do not contain AlphaCI workflow files.

## Phase 1 Kits

- React Starter Kit: `Alpha-Explora/alphaexplora-react-starter-kit`
- Next.js Starter Kit: `Alpha-Explora/alphaexplora-nextjs-starter-kit`
- Node.js Starter Kit: `Alpha-Explora/alphaexplora-nodejs-starter-kit`
- NestJS Starter Kit: `Alpha-Explora/alphaexplora-nestjs-starter-kit`

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