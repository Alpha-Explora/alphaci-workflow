# dotnet-format.yml

Checks C# formatting and style with `dotnet format --verify-no-changes`. It
reports and never rewrites files. This is the .NET counterpart of
`lint-check.yml`.

- Source: `.github/workflows/dotnet-format.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `lint`); customer template `dotnet-service-pipeline` (job `lint`)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the solution or projects. |
| `system-name` | string | yes | | Name used in logs. |
| `dotnet-version` | string | no | `10.0.x` | .NET SDK version. |
| `solution-path` | string | no | `""` | Solution or project, relative to `working-directory`. Empty lets the SDK discover it. |
| `fail-on-warning` | boolean | no | `true` | `true` checks at severity `warn`; `false` checks at `error`. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `format-result` | Outcome of the format check step (`success` or `failure`). |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dotnet-format` | always | Restore, then `dotnet format --verify-no-changes --severity <warn\|error> --no-restore`. |

## Example

```yaml
jobs:
  lint:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/dotnet-format.yml@v1
    with:
      system-name: orders-api
      fail-on-warning: true
```

## Notes

- The exit code of `dotnet format` is the result.
- `fail-on-warning: false` still fails on error-level violations. The generated
  pipeline sets it from `branch-policy`: `true` on `uat` and `main`, `false`
  elsewhere.
- Rules come from the repository's `.editorconfig`. Without one, the SDK
  defaults apply.
