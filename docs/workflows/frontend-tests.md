# frontend-tests.yml

Runs a Node.js frontend's unit tests with coverage and enforces a threshold on
lines, functions, branches and statements read from
`coverage/coverage-summary.json`.

- Source: `.github/workflows/frontend-tests.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` for the `nextjs`, `react`,
  `react-native` and `expo` stacks (job `frontend-tests`); customer templates
  `fe-nextjs` and `fe-react`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `working-directory` | string | no | `.` | Project directory. |
| `node-version` | number | no | `24` | Node.js version. |
| `test-command` | string | no | `npm run test -- --coverage --coverageReporters=json-summary tests/unit` | Test command. Must write `coverage/coverage-summary.json`. |
| `unit-tests-directory` | string | no | `tests/unit` | Folder that must exist, relative to `working-directory`. The job fails when it is missing. |
| `coverage-threshold` | number | no | `80` | Minimum coverage, in percent, for each of the four metrics. |
| `promotion-coverage-threshold` | number | no | `0` | Threshold uat and main enforce. A metric that passes `coverage-threshold` but not this one gets a warning only. `0` turns it off. |
| `enforce-coverage` | boolean | no | `true` | Fail when coverage is missing or below `coverage-threshold`. |
| `upload-artifact` | boolean | no | `true` | Upload the `coverage/` folder as an artifact. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `test-result` | Outcome of the test step (`success` or `failure`). |
| `coverage-percent` | Line coverage percent, or `unknown` when the summary is missing. |

## Permissions

Workflow: `contents: read`. The caller needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `frontend-unit-tests` | always | Checks `unit-tests-directory` exists, installs dependencies, runs `test-command`, checks coverage, uploads artifacts. |

## Example

```yaml
jobs:
  frontend-tests:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/frontend-tests.yml@v1
    with:
      system-name: web
      working-directory: .
      node-version: 24
      unit-tests-directory: tests/unit
      test-command: npm run test -- --coverage --coverageReporters=json-summary --coverageReporters=lcov
```

## Notes

- `unit-tests-directory` is only checked for existence. It is not passed to the
  test command; put the path in `test-command` if the runner needs it.
- The coverage summary is always read from `coverage/coverage-summary.json`
  (Istanbul `json-summary`). There is no input to change the path or format.
- Install uses `npm ci --ignore-scripts` when a lockfile exists. Without one it
  warns and runs `npm install --ignore-scripts` pinned to packages published at
  least one day ago.
- Artifacts: `<system-name>-coverage` (the `coverage/` folder, 14 days, when
  `upload-artifact` is true) and `<system-name>-test-results` (7 days). The
  generated SonarCloud job downloads `<system-name>-coverage`.
