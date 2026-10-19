# lint-check.yml

Installs a Node.js project's dependencies, runs its lint command and, when
given one, a format check. ESLint output is turned into GitHub annotations
(file, line, message) through a problem matcher.

- Source: `.github/workflows/lint-check.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` for Node stacks (job `lint`);
  customer templates `be-nestjs`, `be-nodejs`, `fe-nextjs`, `fe-react` and
  `standalone-lint`; `mobile-workflow.yml` and `mobile-react-native.yml`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | yes | | Name used in logs. |
| `working-directory` | string | no | `.` | Project directory. |
| `node-version` | number | no | `24` | Node.js version. |
| `lint-command` | string | no | `npx eslint . --max-warnings=0` | Lint command. |
| `format-check-command` | string | no | `""` | Format check command, for example `npx prettier --check .`. Empty skips the step. |
| `fail-on-warning` | boolean | no | `false` | Declared but not read by any step. See Notes. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `lint-result` | Outcome of the lint step (`success` or `failure`). |

## Permissions

Workflow: `contents: read`. The caller needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `lint-check` | always | Installs dependencies, registers the ESLint matcher, runs `lint-command`, then `format-check-command` when set. |

## Example

```yaml
jobs:
  lint:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/lint-check.yml@v1
    with:
      system-name: web
      working-directory: .
      node-version: 24
      lint-command: npm run lint
```

## Notes

- `fail-on-warning` has no effect. Whether warnings fail the job depends only on
  `lint-command` (the default passes `--max-warnings=0`). The generator passes
  `fail-on-warning` from its branch policy, but with `lint-command: npm run lint`
  that value changes nothing.
- The matcher understands ESLint's default `stylish` output. Other linters run
  normally but produce no annotations.
- Install uses `npm ci --ignore-scripts` when a lockfile exists. Without one it
  warns and runs `npm install --ignore-scripts` pinned to packages published at
  least one day ago.
