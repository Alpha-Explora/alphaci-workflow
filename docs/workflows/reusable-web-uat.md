# reusable-web-uat.yml

Runs a UAT gate for a web app. It optionally waits for approval on a GitHub
Environment, runs a caller-supplied deploy command, polls a health URL, then
runs Playwright (through [playwright-e2e.yml](playwright-e2e.md)) and k6
against the UAT URL.

- Source: `.github/workflows/reusable-web-uat.yml`
- Trigger: `workflow_call`
- Used by: [service-nextjs.yml](service-nextjs.md), [service-react.yml](service-react.md). Not called by the staged generator.
- Calls: [playwright-e2e.yml](playwright-e2e.md)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `service-name` | string | yes | | Display name, used in artifact names. |
| `service-path` | string | no | `.` | Directory the commands run in. |
| `node-version` | string | no | `24` | Node.js version for Playwright. |
| `package-manager` | string | no | `auto` | Passed to `playwright-e2e.yml`. |
| `install-command` | string | no | `""` | Install command passed to `playwright-e2e.yml`. Set it when calling directly: an empty value installs nothing there. |
| `require-approval` | boolean | no | `true` | Wait for approval on `environment-name`. |
| `environment-name` | string | no | `uat` | GitHub Environment used for approval. |
| `uat-deploy-command` | string | no | `""` | Deploy command. Gets `BASE_URL` and `UAT_BASE_URL`. |
| `uat-base-url` | string | no | `""` | UAT base URL for Playwright and k6. |
| `uat-healthcheck-url` | string | no | `""` | URL to poll. Falls back to `uat-base-url`. |
| `uat-timeout-seconds` | number | no | `300` | How long to poll before failing. |
| `run-playwright` | boolean | no | `true` | Run Playwright. |
| `playwright-command` | string | no | `npx playwright test --project={browser}` | Playwright command. `{browser}` is replaced per matrix browser. |
| `playwright-tests-directory` | string | no | `tests/e2e` | Playwright test folder. |
| `playwright-browsers` | string | no | `["chromium"]` | Browsers, as a JSON array or CSV. |
| `run-k6` | boolean | no | `false` | Run k6. |
| `k6-command` | string | no | `""` | k6 command override. |
| `k6-script-path` | string | no | `tests/performance` | k6 script file, or a directory whose `*.js` and `*.ts` files all run. |

## Secrets

None declared. The Playwright job uses `secrets: inherit`, so
`VERCEL_AUTOMATION_BYPASS_SECRET` and `ALPHACI_TOKEN` reach
`playwright-e2e.yml` when the caller has them.

## Outputs

None.

## Permissions

Workflow: `contents: read`. The `deploy-uat` job asks for `contents: read` and
`id-token: write`. The calling job must grant `id-token: write`, or GitHub
rejects the run at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `approval-required` | `require-approval` is true | Runs in the `environment-name` environment, so its protection rules apply. |
| `approval-skipped` | `require-approval` is false | Logs that approval was skipped. |
| `deploy-uat` | `uat-deploy-command` is set and approval did not fail | Checks out and runs the deploy command. |
| `wait-for-uat` | `uat-base-url` or `uat-healthcheck-url` is set and nothing before failed | Polls the URL every 10 seconds; 200, 201, 204, 301 or 302 passes. Fails after `uat-timeout-seconds`. |
| `playwright-uat` | `run-playwright` and nothing before failed | Calls `playwright-e2e.yml` with `e2e-base-url: uat-base-url` and `run-only-on-branch: "*"`. |
| `k6-uat` | `run-k6` and nothing before failed | Installs k6 and runs `k6-command`, or every script under `k6-script-path`, with `BASE_URL` and `K6_BASE_URL` set. Uploads `k6-output.log` as `<service-name>-k6-uat`. |

## Example

```yaml
jobs:
  uat:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/reusable-web-uat.yml@v1
    permissions:
      contents: read
      id-token: write
    with:
      service-name: web
      install-command: npm ci
      uat-base-url: https://web-uat.example.com
      run-k6: true
    secrets: inherit
```

## Notes

- With `require-approval: true`, approval only blocks when the GitHub
  Environment has required reviewers configured.
- A missing k6 script path, or a directory with no scripts, fails `k6-uat`.
