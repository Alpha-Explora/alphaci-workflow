# discover-service

Composite action. Scans the repository for `package.json` directories that match a stack, picks one
service, and outputs the commands the service workflows should run.

- Source: `.github/actions/discover-service/action.yml` (logic in `discover-service.mjs`)
- Used by: the `*-service-pipeline.yml` customer templates in `workflow-templates/customer/`, before
  they call the matching `service-*.yml`. The staged generator does not use it.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `stack` | yes | | `nodejs`, `nestjs`, `react`, `nextjs`, `react-native` or `expo`. |
| `service-path` | no | `""` | Use this directory instead of detecting one. Fails if it is not a candidate. |
| `service-name` | no | `""` | Display name. Defaults to the `package.json` name. |
| `repository-root` | no | `.` | Directory to scan. |

## Outputs

| Output | Description |
| --- | --- |
| `should-run` | `false` when the push changed nothing in the selected service (and no global file). Always `true` for `workflow_dispatch`. |
| `reason` | How the service was chosen: `manual-override`, `single-candidate`, `changed-files`, `best-changed-match` or `best-candidate`. |
| `service-path`, `service-name` | The selected service. |
| `package-manager`, `install-command` | Detected from the lockfile. |
| `lint-command`, `format-command`, `typecheck-command` | From `package.json` scripts, empty when absent. |
| `unit-test-command`, `integration-test-command`, `component-test-command`, `contract-test-command`, `e2e-test-command` | From `package.json` scripts. Component tests only for React/Next.js; e2e only for Node.js/NestJS. |
| `build-command`, `build-output-path` | Build script and its expected output (`.next`, `dist`, `build`, and so on). |
| `coverage-summary-path` | Expected coverage summary file. |
| `run-playwright`, `playwright-command`, `playwright-tests-directory` | React/Next.js only, when Playwright is installed and a tests folder exists. |
| `run-k6`, `k6-script-path` | React/Next.js only, when k6 scripts exist. |
| `candidate-paths`, `changed-files` | JSON arrays used for the decision. |

## Notes

- With several candidates, the action prefers the one with changed files, then the deepest and most
  stack-specific directory. If two candidates tie, it fails and asks for `service-path`.
- Changes under `.github/` and to root-level global files count as changes to every service.
