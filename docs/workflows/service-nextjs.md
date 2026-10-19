# service-nextjs.yml

Runs the CI pipeline for one Next.js service. It runs the shared JavaScript
quality checks and build, then optional UAT checks (deploy command, health
wait, Playwright, k6), then an optional production approval gate.

- Source: `.github/workflows/service-nextjs.yml`
- Trigger: `workflow_call`
- Used by: the customer template `workflow-templates/customer/nextjs-service-pipeline.yml`. AlphaCI renders that template for the existing-repository setup pull request and for the catalog generate API. New projects use the staged generator, which does not call this workflow.
- Calls: [reusable-javascript-quality.yml](reusable-javascript-quality.md), [reusable-web-uat.yml](reusable-web-uat.md), [production-gate.yml](production-gate.md)

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
| `unit-test-command` | string | no | `""` | Unit test command. Empty skips the unit test job and its coverage gate. |
| `component-test-command` | string | no | `npm test -- --watch=false --coverage` | Component test command. |
| `build-command` | string | no | `npm run build` | Build command. |
| `build-output-path` | string | no | `.next` | Build output uploaded as an artifact. |
| `coverage-threshold` | number | no | `80` | Minimum line coverage for the unit test job. |
| `enable-dependency-review` | boolean | no | `false` | Run GitHub dependency review on pull requests. |
| `enable-audit` | boolean | no | `true` | Run the dependency audit (fails on high severity). |
| `custom-audit-command` | string | no | `""` | Audit command override. |
| `enable-license-check` | boolean | no | `true` | Fail on forbidden licences. |
| `enable-attestation` | boolean | no | `false` | Generate build provenance for the build output. |
| `uat-deploy-command` | string | no | `""` | Command that deploys the service to UAT. |
| `uat-base-url` | string | no | `""` | UAT base URL for health wait, Playwright and k6. |
| `uat-healthcheck-url` | string | no | `""` | URL polled before UAT checks. Falls back to `uat-base-url`. |
| `require-uat-approval` | boolean | no | `true` | Wait for approval on the `uat` GitHub Environment. |
| `run-playwright` | boolean | no | `false` | Run Playwright against UAT. |
| `playwright-command` | string | no | `npx playwright test --project={browser}` | Playwright command. `{browser}` is replaced per matrix browser. |
| `playwright-tests-directory` | string | no | `tests/e2e` | Playwright test folder. |
| `playwright-browsers` | string | no | `["chromium"]` | Browsers, as a JSON array or CSV. |
| `run-k6` | boolean | no | `false` | Run k6 against UAT. |
| `k6-command` | string | no | `""` | k6 command override. |
| `k6-script-path` | string | no | `tests/performance` | k6 script file or directory. |
| `require-production-approval` | boolean | no | `false` | Run the production gate. |
| `production-staging-url` | string | no | `""` | URL shown by the production gate. Falls back to `uat-base-url`. |

## Secrets

None declared. Every nested call uses `secrets: inherit`, so the secrets the
caller passes reach [playwright-e2e.yml](playwright-e2e.md) through
`reusable-web-uat.yml`.

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
| `quality` | always | Calls `reusable-javascript-quality.yml` with `stack-name: nextjs` and `build-cache-path: .next/cache`. |
| `uat` | `uat-deploy-command`, `uat-base-url` or `uat-healthcheck-url` is set, or `run-playwright` or `run-k6` is true | Calls `reusable-web-uat.yml`. Needs `quality`. |
| `production-gate` | `require-production-approval` is true, `quality` succeeded and `uat` succeeded or was skipped | Calls `production-gate.yml` with `app-type: web`. |

## Example

```yaml
jobs:
  pipeline:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/service-nextjs.yml@v1
    with:
      service-name: web
      service-path: apps/web
      node-version: "24"
      uat-base-url: ${{ vars.UAT_BASE_URL }}
      run-playwright: true
    secrets: inherit
```

## Notes

- The customer template fills most inputs from the `discover-service` action and
  reads `UAT_DEPLOY_COMMAND`, `UAT_BASE_URL`, `UAT_HEALTHCHECK_URL`,
  `REQUIRE_UAT_APPROVAL`, `REQUIRE_PRODUCTION_APPROVAL` and
  `PRODUCTION_STAGING_URL` from repository variables.
- With the defaults, only `component-test-command` produces coverage, and no
  coverage threshold is enforced unless `unit-test-command` is set.
