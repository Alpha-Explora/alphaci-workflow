# backend-tests.yml

Runs a Node.js backend's unit tests with coverage and, when asked, a separate
integration-test job against throwaway Postgres and Redis containers. Coverage
is read and enforced by the `coverage-gate` composite action.

- Source: `.github/workflows/backend-tests.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` for the `nestjs` and `nodejs`
  stacks (job `backend-tests`); customer templates `be-nestjs` and `be-nodejs`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `working-directory` | string | no | `.` | Project directory. |
| `backend-stack` | string | no | `nestjs` | `nestjs` or `nodejs`. Only printed in the log. |
| `node-version` | number | no | `24` | Node.js version. |
| `test-command` | string | no | `npm run test:cov` | Unit test command. |
| `integration-test-command` | string | no | `""` | Integration test command. Empty skips the integration job. |
| `coverage-threshold` | number | no | `80` | Minimum line coverage, in percent. |
| `promotion-coverage-threshold` | number | no | `0` | Threshold uat and main enforce. Coverage that passes `coverage-threshold` but not this one gets a warning only. `0` turns it off. |
| `coverage-report-path` | string | no | `coverage/coverage-summary.json` | Coverage report, relative to `working-directory`. |
| `coverage-format` | string | no | `istanbul-summary` | `istanbul-summary`, `cobertura`, `lcov` or `jacoco`. |
| `enforce-coverage` | boolean | no | `true` | Fail when coverage is missing or below `coverage-threshold`. |
| `run-parallel` | boolean | no | `true` | Append `--maxWorkers=50%` (true) or `--runInBand` (false) to the test command. |
| `upload-artifact` | boolean | no | `true` | Upload the `coverage/` folder as an artifact. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `unit-test-result` | Outcome of the unit test step (`success` or `failure`). |
| `integration-test-result` | Outcome of the integration test step. Empty when the job was skipped. |
| `coverage-percent` | Line coverage percent, or `unknown` when the report is missing and enforcement is off. |

## Permissions

Workflow: `contents: read`. The caller needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `backend-unit-tests` | always | Installs dependencies, runs `test-command` with `NODE_ENV=test`, runs the coverage gate, uploads artifacts. |
| `backend-integration-tests` | `integration-test-command` is not empty | Starts `postgres:16` and `redis:7` services and runs `integration-test-command` with `DATABASE_URL` and `REDIS_URL` set. |

## Example

```yaml
jobs:
  backend-tests:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/backend-tests.yml@v1
    with:
      system-name: api
      working-directory: .
      backend-stack: nestjs
      node-version: 24
      test-command: npm test -- --coverage --coverageReporters=json-summary --coverageReporters=lcov
      coverage-threshold: 80
```

## Notes

- Install uses `npm ci --ignore-scripts` when a lockfile exists. Without one it
  warns and runs `npm install --ignore-scripts` pinned to packages published at
  least one day ago. The npm cache is enabled only when a lockfile exists.
- `run-parallel` is ignored when `test-command` already contains `--runInBand`
  or `--maxWorkers`.
- The coverage gate reads line coverage only. A missing report and a
  below-threshold value fail with different messages: the first means the test
  command does not emit the expected format, the second means the code is
  under-tested.
- Artifacts: `<system-name>-coverage` (the `coverage/` folder, 14 days, when
  `upload-artifact` is true), `<system-name>-unit-test-results` and
  `<system-name>-integration-test-results` (7 days). The generated SonarCloud
  job downloads `<system-name>-coverage` to read `coverage/lcov.info`.
- Integration test database: `postgresql://test:test@localhost:5432/testdb`.
