# Workflow Templates

`workflow-templates/customer/` holds the caller templates the AlphaCI backend serves. Each
template is a pair: `<id>.yml` and `<id>.properties.json` (name, description, icon, categories,
file patterns). The backend lists every complete pair. See
[docs/catalog-schema.md](../docs/catalog-schema.md#customer-templates) for how it reads them.

## How the backend uses them

- **New projects:** the backend picks the template named by the stack's `serviceTemplate` in
  `catalog/stacks.json` and uses only its metadata. The pipeline files themselves come from the
  staged generator ([generated-project-contract.md](../docs/generated-project-contract.md)).
- **Existing repositories and the catalog generate API:** the backend renders the template YAML,
  fills in the `workflow_dispatch` defaults, and commits it to the customer repository through a
  pull request.

## Templates

| Template | Picked for | Calls |
| --- | --- | --- |
| `nextjs-service-pipeline` | Next.js stack | `validate-subscription`, `discover-service`, `service-nextjs` |
| `react-service-pipeline` | React stack | `validate-subscription`, `discover-service`, `service-react` |
| `nest-service-pipeline` | NestJS stack | `validate-subscription`, `discover-service`, `service-nestjs` |
| `nodejs-service-pipeline` | Node.js stack | `validate-subscription`, `discover-service`, `service-node` |
| `dotnet-service-pipeline` | .NET stack | `validate-subscription`, `dotnet-test`, `dotnet-format`, `dotnet-analyze`, `dotnet-audit`, `docker-build`, `gcp-cloud-run-deploy` |
| `react-native-service-pipeline` | Catalog only | `validate-subscription`, `discover-service`, `service-react-native` |
| `expo-service-pipeline` | Catalog only | `validate-subscription`, `discover-service`, `service-expo` |
| `be-nestjs`, `be-nodejs` | Catalog only | `validate-subscription`, `lint-check`, `backend-tests`, `security-scan`, `docker-build`, `gcp-cloud-run-deploy` |
| `fe-nextjs`, `fe-react` | Catalog only | `validate-subscription`, `lint-check`, `frontend-tests`, `security-scan`, `gcp-cloud-run-deploy` |
| `standalone-lint` | Catalog only | `validate-subscription`, `lint-check` |
| `promotion`, `quality-gate`, `trivy-scan` | Catalog only | Self-contained `workflow_call` workflows to copy into a repository. |

"Catalog only" means no stack in `catalog/stacks.json` points at the template; it is reachable
through the catalog list and generate API.

## Rules

- Pin every central reference to `Alpha-Explora/alphaci-workflow/...@v1`.
- Make `validate-access` the first job, calling `validate-subscription.yml@v1` with
  `validation-api-url` and the `CI_TOKEN` secret.
- Order jobs with `needs`.
- Default Node.js to the active LTS (24).
- Add a `.properties.json` for every new `.yml`.

`workflow-validation.yml` enforces these (jobs `validate-granular-templates`,
`validate-catalog-and-starters`, `smoke-test-template-shapes`, `validate-runtime-policy`).
The secrets and variables the templates read are listed in
[customer-secret-setup.md](../docs/customer-secret-setup.md#customer-templates-existing-repository-setup).
