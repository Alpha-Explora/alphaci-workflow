# service-node.yml

Runs the CI pipeline for one plain Node.js service. It runs the shared
JavaScript quality checks and build, then optional UAT steps (deploy command,
health wait, validation command), then an optional production approval gate.
It matches [service-nestjs.yml](service-nestjs.md) except for the stack label,
some defaults and the `production-app-type` input.

- Source: `.github/workflows/service-node.yml`
- Trigger: `workflow_call`
- Used by: the customer template `workflow-templates/customer/nodejs-service-pipeline.yml`. AlphaCI renders that template for the existing-repository setup pull request and for the catalog generate API. New projects use the staged generator, which does not call this workflow.
- Calls: [reusable-javascript-quality.yml](reusable-javascript-quality.md), [reusable-service-uat.yml](reusable-service-uat.md), [production-gate.yml](production-gate.md)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `service-name` | string | yes | | Display name, also used in artifact names. |
| `service-path` | string | no | `.` | Directory that holds the service. |
| `node-version` | string | no | `24` | Node.js version. |
| `package-manager` | string | no | `auto` | `auto`, `npm`, `yarn` or `pnpm`. `auto` picks from the lockfile. |
| `install-command` | string | no | `""` | Install command override. Empty uses the package manager default. |
| `lint-command` | string | no | `npm run lint` | Lint command. |
| `format-command` | string | no | `""` | Format check command. Empty skips it. |
| `typecheck-command` | string | no | `npx tsc --noEmit` | Type-check command. |
| `unit-test-command` | string | no | `npm test -- --runInBand --coverage` | Unit test command. Its coverage summary is gated. |
| `integration-test-command` | string | no | `""` | Integration test command. Empty skips it. |
| `contract-test-command` | string | no | `""` | Contract test command. Empty skips it. |
| `e2e-test-command` | string | no | `""` | End-to-end test command. Empty skips it. |
| `build-command` | string | no | `npm run build` | Build command. |
| `build-output-path` | string | no | `dist` | Build output uploaded as an artifact. |
| `coverage-threshold` | number | no | `80` | Minimum line coverage. |
| `enable-dependency-review` | boolean | no | `false` | Run GitHub dependency review on pull requests. |
| `enable-audit` | boolean | no | `true` | Run the dependency audit (fails on high severity). |
| `custom-audit-command` | string | no | `""` | Audit command override. |
| `enable-license-check` | boolean | no | `true` | Fail on forbidden licences. |
| `enable-attestation` | boolean | no | `false` | Generate build provenance for the build output. |
| `uat-deploy-command` | string | no | `""` | Command that deploys the service to UAT. |
| `uat-command` | string | no | `""` | Command that validates UAT. Gets `BASE_URL`, `UAT_BASE_URL` and `UAT_HEALTHCHECK_URL`. |
| `uat-base-url` | string | no | `""` | UAT base URL. |
| `uat-healthcheck-url` | string | no | `""` | URL polled before UAT validation. Falls back to `uat-base-url`. |
| `require-uat-approval` | boolean | no | `true` | Wait for approval on the `uat` GitHub Environment. |
| `require-production-approval` | boolean | no | `false` | Run the production gate. |
| `production-app-type` | string | no | `api` | `app-type` passed to the production gate (`web`, `api` or `mobile`). |
| `production-staging-url` | string | no | `""` | URL shown by the production gate. Falls back to `uat-base-url`. |

## Secrets

None declared. Nested calls use `secrets: inherit`.

## Outputs

None.

## Permissions

Workflow: `contents: read`. Nested jobs ask for more: the quality `build` job
asks for `id-token: write`, `attestations: write` and `artifact-metadata: write`,
and the UAT `deploy-uat` job asks for `id-token: write`. The calling job must
grant at least these, or GitHub rejects the run at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `quality` | always | Calls `reusable-javascript-quality.yml` with `stack-name: nodejs`. |
| `uat` | any of `uat-deploy-command`, `uat-command`, `uat-base-url`, `uat-healthcheck-url` is set | Calls `reusable-service-uat.yml`. Needs `quality`. |
| `production-gate` | `require-production-approval` is true, `quality` succeeded and `uat` succeeded or was skipped | Calls `production-gate.yml` with `app-type` from `production-app-type`. |

## Example

```yaml
jobs:
  pipeline:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/service-node.yml@v1
    with:
      service-name: worker
      node-version: "24"
    secrets: inherit
```

## Notes

- The customer template fills most inputs from the `discover-service` action and
  reads the UAT and production settings from repository variables.
- The unit test job fails when `coverage/coverage-summary.json` is missing.
  Configure the test runner to write a coverage summary.
