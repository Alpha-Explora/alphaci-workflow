# Catalog Schema

The AlphaCI backend reads `catalog/` and `workflow-templates/customer/` from a checkout of this
repository. The path is `TEMPLATE_REPO_PATH` (default `../alphaci-workflow`); the template folder is
`TEMPLATE_WORKFLOW_DIR` (default `workflow-templates/customer`). In production the backend refuses
to start when either folder is missing or holds no templates.

## Files the backend reads

| File | How the backend uses it |
| --- | --- |
| `catalog/stacks.json` | The project types offered in the product, and the template each one uses. |
| `catalog/workflow-refs.json` | Node versions offered, and the `workflowRefByProjectType` value returned by the project-options API. |
| `catalog/actions.json`, `catalog/providers.json`, `catalog/plans.json` | Parsed when project options load. A missing or invalid file makes the backend fall back to its built-in stack list. Their contents are not used. |
| `workflow-templates/customer/*.properties.json` + `*.yml` | The template catalog. See [Customer templates](#customer-templates). |

## `stacks.json`

An array. One entry per stack.

| Field | Required | Meaning |
| --- | --- | --- |
| `key` | yes | Stack id: `nextjs`, `react`, `nestjs`, `nodejs`, `dotnet`. |
| `label` | yes | Display name. |
| `kind` | yes | `frontend` or `backend`. Picks the frontend or backend toolchain in the generator. |
| `runtime` | yes | `node` or `dotnet`. |
| `language` | yes | Display language. |
| `serviceTemplate` | yes | Customer template id in `workflow-templates/customer/` (for example `nest-service-pipeline`). |
| `defaultRuntimeVersion` | no | Runtime version the generated pipeline and scaffold use (`.NET` uses `10.0.x`). |
| `repoShapes` | no | Allowed repository shapes. Defaults: backend `standalone, multi, microservices`; frontend adds `mono`. |
| `serviceWorkflow` | no | Key into `workflow-refs.json` `workflows`. Only used to build `workflowRefByProjectType`. |
| `defaultNodeVersion`, `supportedPackageManagers`, `masterWorkflow`, `defaultBuildOutput`, `defaultCommands` | no | Not read by the backend. |

`workflow-validation.yml` (job `validate-stack-catalog`) checks that the required fields exist,
`kind` is valid, keys are unique, and each `serviceTemplate` has both a `.yml` and a
`.properties.json`.

## `workflow-refs.json`

| Field | Meaning |
| --- | --- |
| `repository` | Must be `Alpha-Explora/alphaci-workflow`. |
| `currentStable` | Ref used in `workflowRefByProjectType` (`v1`). The ref written into generated pipelines comes from the backend's `CENTRAL_WORKFLOW_REF` instead. |
| `nodeVersions` | `{ value, label }` list offered for Node stacks. |
| `workflows` | Map of workflow key to path. Entries no stack points at are not checked. |
| `actions` | Map of action key to path. Not read by the backend. |

## Customer templates

Each template is a pair in `workflow-templates/customer/`: `<id>.yml` and `<id>.properties.json`.
The backend lists every pair that has both files.

`<id>.properties.json` fields: `name`, `description`, `iconName`, `categories`, `filePatterns`.
The stack is inferred from the id and categories, then joined with `stacks.json` for `kind`,
`runtime` and `defaultRuntimeVersion`.

How the backend uses a template:

- **New projects (staged generator):** only the template's metadata (stack, kind, runtime). The YAML
  is not copied; the generator builds its own staged files.
- **Existing-repository setup and the catalog generate API:** the template YAML is loaded, its name is
  set to `<service> - <template name>`, and the `workflow_dispatch` input defaults `service_name`,
  `service_path`, `node_version` and `coverage_threshold` are filled in.

## `catalog/customer/`

`project-types.json`, `workflow-recipes.json` and `starter-kits.json` are not read by the backend.
`workflow-validation.yml` (job `validate-catalog-and-starters`) still checks that
`project-types.json` and `workflow-recipes.json` are consistent with the templates and with
`starter-templates/`.
