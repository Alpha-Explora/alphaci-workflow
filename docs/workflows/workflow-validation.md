# workflow-validation.yml

Checks this repository: workflow syntax, contract docs, the stack catalog, customer templates, starters, runtime pins, and the workflows the backend generator calls. Every job is independent and read-only.

- Source: `.github/workflows/workflow-validation.yml`
- Trigger: `pull_request` that touches `.github/workflows/**`, `catalog/**`, `starter-templates/**`, `workflow-templates/**`, `scripts/**`, `docs/workflows/**`, `.claude/**` or `CLAUDE.md`; `workflow_dispatch`; `workflow_call`
- Used by: Repository maintenance. [publish-v1-tag.yml](publish-v1-tag.md) and [publish-internal-v1-tag.yml](publish-internal-v1-tag.md) call it before moving a tag.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `systems-json` | string | no | | Declared on `workflow_call`. No job reads it. |

## Secrets

None.

## Outputs

None.

## Permissions

Workflow: `contents: read`.

## Jobs

| Job | Runs when | What it checks |
| --- | --- | --- |
| `actionlint` | Always | Runs `rhysd/actionlint:latest` on a fixed list of workflow files (see Notes). |
| `validate-workflow-contracts` | Always | Every `.github/workflows/*.yml` has `docs/workflows/<name>.md` and a `Contract: docs/workflows/<name>.md` comment. `docs/workflows/README.md` exists. |
| `validate-gcp-cloud-run-contract` | Always | `node scripts/validate-gcp-cloud-run-workflow.cjs`: inputs, WIF permissions, preflight, digest deploy, branch gates, private probe, secret references and the template callers of `gcp-cloud-run-deploy.yml`. |
| `validate-eslint-matcher` | Always | `node scripts/validate-eslint-matcher.cjs`: the ESLint problem matcher in `lint-check.yml` matches sample output. |
| `validate-dotnet-trx-summary` | Always | `node scripts/validate-dotnet-trx-summary.cjs`: the TRX summariser in `dotnet-test.yml` against fixtures. |
| `validate-release-manifest-canonical` | Always | `node scripts/validate-release-manifest-canonical.cjs`: `sign-release.yml`'s `jq` canonicalization matches the backend's test vector. |
| `validate-stack-catalog` | Always | Each entry in `catalog/stacks.json` has `key`, `label`, `kind` (`frontend` or `backend`), `runtime`, `language`, `serviceTemplate`; the template's `.yml` and `.properties.json` exist in `workflow-templates/customer/`; keys are unique. |
| `validate-granular-templates` | Always | Each `workflow-templates/customer/*.yml` has a paired `.properties.json`, and every `Alpha-Explora/alphaci-workflow/.github/workflows/<file>@<ref>` it references exists. |
| `validate-catalog-and-starters` | Always | `catalog/customer/project-types.json` and `workflow-recipes.json`: unique IDs, `single-app` enabled, `monorepo`, `fullstack`, `library`, `mobile` disabled, recipes map every supported project type to a template whose first job is `validate-access` and that has the mandatory and option jobs. Each starter in `starter-templates/` has `starter.json`, `package.json`, the required scripts, substitution files and copy excludes, and commits no build output, `.env` files or secrets. |
| `validate-no-legacy-granular-deps` | Always | `workflow-templates/` and `docs/workflows/` do not mention old long-pipeline callers or orchestrators. |
| `validate-runtime-policy` | Always | `.github/workflows/`, `workflow-templates/` and `docs/workflows/` have no Node 20 defaults, no `actions/checkout`, `setup-node` or `upload-artifact` pinned below `v6`, and no legacy caller references. |
| `smoke-test-template-shapes` | Always | Every non-reusable customer template starts with `validate-access`, calls `validate-subscription.yml@v1` with `CI_TOKEN` and `validation-api-url`, and every `needs` names a real job. `validate-subscription.yml` reads `validation-api-url`. The `fe-*` and `be-*` templates call `frontend-tests.yml@v1` and `backend-tests.yml@v1`. |
| `validate-backend-contract` | Always | A fixed list of workflows exists (`validate-subscription`, `backend-tests`, `frontend-tests`, `lint-check`, `security-scan`, `sonarcloud-scan`, `docker-build`, `production-gate`, `promotion`, `gcp-cloud-run-deploy`, `render-deploy`, `release`, `sign-release`, `vercel-deploy`). `catalog/workflow-refs.json` names `Alpha-Explora/alphaci-workflow`, and every stack's `serviceWorkflow` resolves to a file that exists. |
| `validate-retired-organisations` | Always | No file outside this workflow and the GCP script mentions a retired organisation or the retired platform API host. |

## Example

```yaml
jobs:
  validate:
    uses: ./.github/workflows/workflow-validation.yml
```

## Notes

- `actionlint` does not lint `bruno-api-test.yml`, `dotnet-license-scan.yml`, `dotnet-sbom.yml`, `gitleaks-scan.yml`, `mobile-gradle.yml`, `mobile-ios-build.yml`, `mobile-maestro-ios.yml`, `mobile-maestro.yml`, `mobile-react-native.yml`, `mobile-workflow.yml`, `playwright-e2e.yml`, `production-gate.yml`, `publish-internal-v1-tag.yml` or `schemathesis-scan.yml`.
- `validate-backend-contract` does not list every workflow the generator emits: the .NET workflows, `gitleaks-scan.yml`, `sonarcloud-dotnet-scan.yml`, `bruno-api-test.yml`, `schemathesis-scan.yml` and `playwright-e2e.yml` are missing, so deleting one of them would not fail validation.
- `scripts/gcp-cloud-run-smoke-contract.test.cjs` and `scripts/node-smoke-fixture-contract.test.cjs` are not run by any job.
- Run a script locally from the repository root, for example `node scripts/validate-gcp-cloud-run-workflow.cjs`.
