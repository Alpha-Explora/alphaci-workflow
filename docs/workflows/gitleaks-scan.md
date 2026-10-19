# gitleaks-scan.yml

Scans for committed secrets with the Gitleaks release binary and reports the
rule, file and line of each finding. Secret values are never printed or
uploaded. The check is language-agnostic.

- Source: `.github/workflows/gitleaks-scan.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `secrets`)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory to scan. |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `gitleaks-version` | string | no | `8.30.0` | Gitleaks release to install. |
| `fail-on-findings` | boolean | no | `true` | Fail when a secret is found. `false` reports only. |
| `scan-history` | boolean | no | `false` | Scan every commit instead of the working tree. Checks out full history. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `secrets-result` | Outcome of the scan step (`success` or `failure`). |
| `findings-count` | Secrets found. `0` when clean. |
| `findings-items` | JSON array of `{rule,file,line}`, at most 20. Never the secret value. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `gitleaks-scan` | always | Check out (depth 1, or full history with `scan-history`), install Gitleaks from its GitHub release, run `gitleaks detect --redact --exit-code 0`, evaluate the JSON report, upload it when there are findings. |

## Example

```yaml
jobs:
  secrets:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/gitleaks-scan.yml@v1
    with:
      system-name: orders-api
      fail-on-findings: true
```

## Notes

- The workflow uses the release binary, not `gitleaks-action`, which needs a
  paid licence for organisation repositories.
- `--exit-code 0` keeps "secret found" and "scanner broke" apart. A non-zero
  scanner exit or a missing report fails the job, whatever
  `fail-on-findings` says.
- Without `scan-history` the scan uses `--no-git` on the working tree.
- The generated pipeline scans the working tree only and sets
  `fail-on-findings` from `branch-policy`: `true` on `uat` and `main`,
  `false` elsewhere.
- Artifact: `gitleaks-report-<system-name>` (7 days, redacted), only when
  findings are not `0`.
