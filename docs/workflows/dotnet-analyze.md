# dotnet-analyze.yml

Builds a .NET solution with the .NET analyzers enabled and, when asked,
treats compiler and analyzer warnings as errors. .NET has no separate type
check, so this job fills the slot `typecheck` fills for Node projects.

- Source: `.github/workflows/dotnet-analyze.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `typecheck`); customer template `dotnet-service-pipeline` (job `analyze`)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the solution or projects. |
| `system-name` | string | yes | | Name used in logs. |
| `dotnet-version` | string | no | `10.0.x` | .NET SDK version. |
| `solution-path` | string | no | `""` | Solution or project, relative to `working-directory`. Empty lets the SDK discover it. |
| `configuration` | string | no | `Release` | Build configuration. |
| `treat-warnings-as-errors` | boolean | no | `true` | Fail the build on compiler and analyzer warnings. |
| `analysis-level` | string | no | `latest` | Value for `AnalysisLevel` (for example `latest`, `latest-recommended`, `none`). |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `analyze-result` | Outcome of the build step (`success` or `failure`). |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dotnet-analyze` | always | Restore, then `dotnet build --no-restore --no-incremental -p:EnableNETAnalyzers=true -p:AnalysisLevel=<level>`, adding `-warnaserror` when strict. |

## Example

```yaml
jobs:
  typecheck:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/dotnet-analyze.yml@v1
    with:
      system-name: orders-api
      treat-warnings-as-errors: true
```

## Notes

- `--no-incremental` makes the analyzers run over every file, so the result
  does not depend on what an earlier build cached.
- NuGet Audit warnings `NU1901`-`NU1904` are kept as warnings
  (`-warnnotaserror`). Vulnerable packages are judged by `dotnet-audit.yml`,
  not here.
- The generated pipeline sets `treat-warnings-as-errors` from `branch-policy`:
  `true` on `uat` and `main`, `false` elsewhere. Errors fail either way.
