# mobile-tests.yml

Runs the unit tests of a mobile app (Expo or React Native) and checks line
coverage against a threshold. Uploads the `coverage/` folder.

- Source: `.github/workflows/mobile-tests.yml`
- Trigger: `workflow_call`
- Used by: [mobile-workflow.yml](mobile-workflow.md), [mobile-react-native.yml](mobile-react-native.md). Not called by the staged generator.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory that holds the app. |
| `system-name` | string | yes | | Display name, used in the artifact name. |
| `node-version` | number | no | `24` | Node.js version. |
| `test-command` | string | no | `npx jest --coverage --verbose --ci --forceExit` | Test command. Runs with `NODE_ENV=test`. |
| `coverage-threshold` | number | no | `80` | Minimum `total.lines.pct`. |
| `upload-artifact` | boolean | no | `true` | Upload `coverage/` as `<system-name>-coverage`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `test-result` | Outcome of the test step: `success` or `failure`. |
| `coverage-percent` | Line coverage from `coverage/coverage-summary.json`, or `unknown`. |

## Permissions

Workflow: `contents: read`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `mobile-unit-tests` | always | Detects yarn, pnpm or npm from the lockfile, installs dependencies, runs `test-command`, then reads `coverage/coverage-summary.json` and fails when coverage is below `coverage-threshold`. |

## Example

```yaml
jobs:
  unit-tests:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/mobile-tests.yml@v1
    with:
      system-name: mobile
      working-directory: apps/mobile
      coverage-threshold: 80
```

## Notes

- When `coverage/coverage-summary.json` is missing, the threshold is not
  enforced: the run warns and reports `unknown`. Jest writes that file only when
  `json-summary` is in `coverageReporters`.
