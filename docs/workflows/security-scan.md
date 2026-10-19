# security-scan.yml

Runs `npm audit` on a Node.js project and a production licence check with
`license-checker`. The audit fails the job on HIGH or CRITICAL advisories when
`fail-on-high` is true, and publishes the vulnerable packages as outputs.

- Source: `.github/workflows/security-scan.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` for Node stacks (job `security`);
  customer templates `be-nestjs`, `be-nodejs`, `fe-nextjs` and `fe-react`;
  `mobile-workflow.yml` and `mobile-react-native.yml`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `working-directory` | string | no | `.` | Project directory. |
| `node-version` | number | no | `24` | Node.js version. |
| `fail-on-high` | boolean | no | `true` | Fail when `npm audit --audit-level=high` reports findings. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `audit-result` | Outcome of the audit step (`success` or `failure`). |
| `vulnerabilities-critical` | Number of packages with a critical advisory. |
| `vulnerabilities-high` | Number of packages with a high advisory. |
| `vulnerabilities-items` | JSON array of `{package, severity, title}` for high and critical findings, at most 20. |

## Permissions

Workflow: `contents: read`. The caller needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dependency-audit` | always | Installs dependencies, runs `npm audit`, summarises counts by severity, uploads `audit-report.json`. |
| `license-check` | always | Installs dependencies and runs `npx license-checker --production --excludePrivatePackages --onlyAllow <list>`. |

## Example

```yaml
jobs:
  security:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/security-scan.yml@v1
    with:
      system-name: api
      working-directory: .
      node-version: 24
      fail-on-high: true
```

## Notes

- The licence check always fails the job on a licence outside the allow list,
  regardless of `fail-on-high`. The list is fixed in the workflow: MIT, ISC,
  BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, CC0-1.0, CC-BY-3.0, CC-BY-4.0,
  MPL-2.0, Unlicense, Python-2.0, BlueOak-1.0.0, LGPL-3.0-or-later and a few
  dual-licence expressions.
- All outputs come from `dependency-audit`. `license-check` has no outputs.
- Artifact: `<system-name>-audit-report` (`audit-report.json`, 30 days).
- Install uses `npm ci --ignore-scripts` when a lockfile exists. Without one it
  warns and runs `npm install --ignore-scripts` pinned to packages published at
  least one day ago.
