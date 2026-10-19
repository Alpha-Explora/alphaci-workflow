# Workflow Release Policy

Customer pipelines call the workflows in this repository by tag, never by branch.

## Refs

| Ref | Moves when | Who uses it |
| --- | --- | --- |
| `v1` | Every push to `main` that passes Workflow Validation ([publish-v1-tag.yml](workflows/publish-v1-tag.md)). | Default for every generated pipeline and every customer template. |
| `internal-v1` | Every push to `refactor-internal` that passes Workflow Validation ([publish-internal-v1-tag.yml](workflows/publish-internal-v1-tag.md)). | An AlphaCI deployment that sets `CENTRAL_WORKFLOW_REF=internal-v1`. |

`v1` is a floating tag. It is force-moved, so a merge to `main` reaches every customer on their
next run. There are no patch or minor tags.

The AlphaCI backend picks the ref from `CENTRAL_WORKFLOW_REF` (default `v1`) and the repository
from `CENTRAL_WORKFLOW_REPO` (default `Alpha-Explora/alphaci-workflow`). A project can override
the ref; the dropdown lists the tags that exist in this repository.

## Compatibility rules

Because `v1` moves under live customers, every merge to `main` must be backward compatible:

- Keep existing input, output and secret names, and keep their types compatible.
- Give new inputs safe defaults. Add new secrets as `required: false`.
- Do not remove or rename a workflow that the generator or a customer template calls.
- Do not tighten permissions a caller must grant without changing the generator first.
- A breaking change needs a new major tag (`v2`), a generator change to emit it, and a catalog
  update (`catalog/workflow-refs.json` `currentStable`).

## Before merging to `main`

1. Workflow Validation passes on the pull request.
2. The contract doc in `docs/workflows/` matches the changed `.yml`.
3. If the change affects generated pipelines, the backend's generator tests pass against it.
