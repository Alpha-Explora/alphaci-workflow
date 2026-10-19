# reusable-service-uat.yml

Runs a UAT gate for an API or backend service. It optionally waits for
approval on a GitHub Environment, runs a caller-supplied deploy command, polls
a health URL until it answers, and runs a caller-supplied validation command.
Every step is a command the caller provides; the workflow deploys nothing by
itself.

- Source: `.github/workflows/reusable-service-uat.yml`
- Trigger: `workflow_call`
- Used by: [service-nestjs.yml](service-nestjs.md), [service-node.yml](service-node.md). Not called by the staged generator.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `service-name` | string | yes | | Display name. |
| `service-path` | string | no | `.` | Directory the commands run in. |
| `node-version` | string | no | `24` | Node.js version for `uat-command`. |
| `package-manager` | string | no | `auto` | `auto`, `npm`, `yarn` or `pnpm`, for the install before `uat-command`. |
| `install-command` | string | no | `""` | Install command override. |
| `require-approval` | boolean | no | `true` | Wait for approval on `environment-name`. |
| `environment-name` | string | no | `uat` | GitHub Environment used for approval. |
| `uat-deploy-command` | string | no | `""` | Deploy command. Gets `BASE_URL` and `UAT_BASE_URL`. |
| `uat-command` | string | no | `""` | Validation command. Gets `BASE_URL`, `UAT_BASE_URL` and `UAT_HEALTHCHECK_URL`. |
| `uat-base-url` | string | no | `""` | UAT base URL. |
| `uat-healthcheck-url` | string | no | `""` | URL to poll. Falls back to `uat-base-url`. |
| `uat-timeout-seconds` | number | no | `300` | How long to poll before failing. |

## Secrets

None declared. Commands see only what the runner provides.

## Outputs

None.

## Permissions

Workflow: `contents: read`. The `deploy-uat` job asks for `contents: read` and
`id-token: write`, so a deploy command can use OIDC. The calling job must grant
`id-token: write`, or GitHub rejects the run at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `approval-required` | `require-approval` is true | Runs in the `environment-name` environment, so its protection rules apply. |
| `approval-skipped` | `require-approval` is false | Logs that approval was skipped. |
| `deploy-uat` | `uat-deploy-command` is set and approval did not fail | Checks out and runs the deploy command. |
| `wait-for-uat` | `uat-base-url` or `uat-healthcheck-url` is set and nothing before failed | Polls the URL every 10 seconds; 200, 201, 204, 301 or 302 passes. Fails after `uat-timeout-seconds`. |
| `run-uat-command` | `uat-command` is set and nothing before failed | Installs dependencies and runs the validation command. |

## Example

```yaml
jobs:
  uat:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/reusable-service-uat.yml@v1
    permissions:
      contents: read
      id-token: write
    with:
      service-name: api
      uat-base-url: https://api-uat.example.com
      uat-healthcheck-url: https://api-uat.example.com/health
      uat-command: npm run test:uat
```

## Notes

- With `require-approval: true`, approval only blocks when the GitHub
  Environment has required reviewers configured.
