# Catalog Schema

The `catalog/customer/` folder is the customer-project catalog consumed by the SaaS API. It lets the API expose supported stacks, starter kits, and workflow recipes without parsing workflow YAML.

## Files

- `catalog/customer/project-types.json`: supported project types and starter-kit paths.
- `catalog/customer/starter-kits.json`: external starter repositories used for generated projects.
- `catalog/customer/workflow-recipes.json`: supported workflow recipes and template mappings.

## Common Fields

Catalog keys use dotted namespaces for selectable actions and lowercase identifiers for stacks, plans, and providers.

```json
{
  "key": "testing.playwright",
  "label": "Playwright E2E",
  "plan": "pro",
  "supportedStacks": ["nextjs"],
  "requiresSecrets": [],
  "requiresVariables": ["E2E_BASE_URL"],
  "generatedFiles": ["tests/e2e/playwright-e2e.ts"]
}
```

## Stack Contract

Each stack declares the template repository, default commands, master caller workflow key, and optional service workflow key. The SaaS API should validate wizard choices against `supportedPackageManagers`, `kind`, and the action catalog before provisioning begins.

## Plan Contract

Plans are ordered by `rank`. A plan can enable stacks, actions, auto-promotion, branch protection, private repositories, and team size. Stripe is the billing event source, but this catalog is the application authorization source for the MVP.

## Workflow Ref Contract

`workflow-refs.json` stores the current stable release tag and the canonical reusable workflow paths. Renderers should combine:

```text
{repository}/{workflow path}@{currentStable}
```

Example:

```text
Alpha-Explora/alphaci-workflow/.github/workflows/frontend-tests.yml@v1
```
