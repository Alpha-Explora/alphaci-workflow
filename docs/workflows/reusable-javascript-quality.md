# reusable-javascript-quality.yml

Runs the quality checks and build for one JavaScript or TypeScript service.
Each check is its own job and runs only when its command or switch is set:
dependency review, lint/format/type-check, unit tests with a coverage gate,
integration, component, contract and end-to-end tests, dependency audit and
licence check. The build runs last, only when none of those failed, and
uploads the build output as an artifact.

- Source: `.github/workflows/reusable-javascript-quality.yml`
- Trigger: `workflow_call`
- Used by: [service-nextjs.yml](service-nextjs.md), [service-react.yml](service-react.md), [service-nestjs.yml](service-nestjs.md), [service-node.yml](service-node.md). Not called by the staged generator.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `service-name` | string | yes | | Display name, used in artifact names. |
| `service-path` | string | no | `.` | Directory that holds the service. Every job runs there. |
| `stack-name` | string | no | `javascript` | Stack label used in artifact names. |
| `node-version` | string | no | `24` | Node.js version. |
| `package-manager` | string | no | `auto` | `auto`, `npm`, `yarn` or `pnpm`. `auto` picks pnpm, then yarn, then npm from the lockfile; a missing `package.json` fails the job. |
| `install-command` | string | no | `""` | Install command override. Empty uses `npm ci` (or `npm install` with a warning when there is no lockfile), `pnpm install --frozen-lockfile` or `yarn install --immutable`. |
| `lint-command` | string | no | `""` | Lint command. |
| `format-command` | string | no | `""` | Format check command. |
| `typecheck-command` | string | no | `""` | Type-check command. |
| `unit-test-command` | string | no | `""` | Unit test command. Its coverage is gated. |
| `integration-test-command` | string | no | `""` | Integration test command. |
| `component-test-command` | string | no | `""` | Component test command. |
| `contract-test-command` | string | no | `""` | Contract test command. |
| `e2e-test-command` | string | no | `""` | End-to-end test command. |
| `build-command` | string | no | `""` | Build command. Empty skips the build job. |
| `build-output-path` | string | no | `""` | Build output to upload, relative to `service-path`. Empty skips the upload. |
| `build-cache-path` | string | no | `""` | Build cache to restore and save, for example `.next/cache`. |
| `coverage-summary-path` | string | no | `coverage/coverage-summary.json` | Istanbul summary read by the coverage gate. |
| `coverage-threshold` | number | no | `80` | Minimum `total.lines.pct`. |
| `enable-dependency-review` | boolean | no | `false` | Run `actions/dependency-review-action` on pull requests. |
| `enable-audit` | boolean | no | `true` | Run the package manager audit at high severity. |
| `custom-audit-command` | string | no | `""` | Audit command override. |
| `enable-license-check` | boolean | no | `true` | Run `license-checker` against production dependencies. |
| `forbidden-licenses` | string | no | GPL, AGPL, SSPL-1.0, BUSL-1.1 and CC-BY-NC variants | Semicolon-separated deny list for the licence check and dependency review. Packages with no licence or `UNKNOWN` do not fail. |
| `enable-attestation` | boolean | no | `false` | Generate build provenance for `build-output-path`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `build-artifact-name` | Name of the uploaded build artifact: `<service-name>-<stack-name>-build`. |
| `build-result` | `success` when the build job finished; empty when it was skipped. |

## Permissions

Workflow: `contents: read`. The `build` job asks for `contents: read`,
`id-token: write`, `attestations: write` and `artifact-metadata: write`. The
calling job must grant these, or GitHub rejects the run at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dependency-review` | pull request and `enable-dependency-review` | Fails on high-severity vulnerabilities or denied licences in the dependency diff. |
| `static-analysis` | any of `lint-command`, `format-command`, `typecheck-command` is set | Installs dependencies and runs each set command. |
| `unit-tests` | `unit-test-command` is set | Runs the tests, fails when the coverage summary is missing or below `coverage-threshold`, uploads `coverage/` as `<service-name>-<stack-name>-coverage`. |
| `integration-tests` | `integration-test-command` is set | Runs the command. |
| `component-tests` | `component-test-command` is set | Runs the command. No coverage gate. |
| `contract-tests` | `contract-test-command` is set | Runs the command. |
| `e2e-tests` | `e2e-test-command` is set | Runs the command. |
| `dependency-audit` | `enable-audit` | Runs `npm audit --audit-level=high`, `pnpm audit --audit-level=high` or the yarn equivalent, or `custom-audit-command`. Uploads `audit-report.txt` as `<service-name>-<stack-name>-audit`. |
| `license-check` | `enable-license-check` | Prints a licence summary and fails on any licence in `forbidden-licenses`. |
| `build` | `build-command` is set and no earlier job failed or was cancelled | Restores the build cache, runs the build, optionally attests, uploads `build-output-path` (fails when it is empty). |

## Example

```yaml
jobs:
  quality:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/reusable-javascript-quality.yml@v1
    permissions:
      contents: read
      id-token: write
      attestations: write
      artifact-metadata: write
    with:
      service-name: api
      stack-name: nestjs
      lint-command: npm run lint
      typecheck-command: npx tsc --noEmit
      unit-test-command: npm test -- --coverage
      build-command: npm run build
      build-output-path: dist
```

## Notes

- Commands run through `bash -lc` in `service-path`.
- Uploaded artifacts are kept for 14 days.
