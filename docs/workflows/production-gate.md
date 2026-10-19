# production-gate.yml

Production readiness check. The job runs in the GitHub Environment named
`production`, so any required reviewers configured there must approve before it
starts. It then checks the run is on `main`, optionally checks a staging URL
answers, and writes an audit record.

- Source: `.github/workflows/production-gate.yml`
- Trigger: `workflow_call`
- Used by: generated `20-alphaci-package.yml` (job `production-gate`, `main`
  only, after `build`); `service-nextjs.yml`, `service-react.yml`,
  `service-nestjs.yml`, `service-node.yml`, `service-react-native.yml` and
  `service-expo.yml`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-dir` | string | yes | | Name of the system being released. Used in the job name, audit record and artifact name. |
| `app-type` | string | yes | | `web`, `api` or `mobile`. Recorded in the audit log. |
| `staging-url` | string | no | `""` | URL that must answer 200, 301 or 302. Empty skips the check with a warning. |
| `require-approval` | boolean | no | `true` | Only changes the log message. Approval is enforced by the `production` environment's reviewers, not by this input. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `approved` | Always `true` when the job succeeds. |
| `audit-id` | `AUDIT-<epoch>-<run id>`. |

## Permissions

Workflow: `contents: read`. The job uses `environment: production`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `production-gate` | always | Waits for the `production` environment, runs the checklist, sets `approved`, writes and uploads `audit-log.json`. |

## Example

```yaml
jobs:
  production-gate:
    needs: [build]
    if: ${{ github.ref_name == 'main' }}
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/production-gate.yml@v1
    with:
      system-dir: api
      app-type: api
      require-approval: true
```

## Notes

- To block unattended production releases, add required reviewers to the
  `production` environment in the repository settings. Without reviewers the
  job runs straight through.
- The checklist fails unless `github.ref_name` is `main`. In a `workflow_run`
  chain this is the default branch, not the branch that was built.
- The gate does not re-check test results. The caller must only call it after
  its own checks passed.
- Artifact: `<system-dir>-production-audit` (`audit-log.json`, 365 days).
