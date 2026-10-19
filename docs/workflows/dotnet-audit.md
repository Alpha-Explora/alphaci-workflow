# dotnet-audit.yml

Audits NuGet dependencies, direct and transitive, against known advisories with
`dotnet list package --vulnerable`, and fails at a chosen severity. This is
the .NET counterpart of `security-scan.yml`.

- Source: `.github/workflows/dotnet-audit.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `security`, `fail-on-severity: High`); customer template `dotnet-service-pipeline` (job `security`)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the solution or projects. |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `dotnet-version` | string | no | `10.0.x` | .NET SDK version. |
| `solution-path` | string | no | `""` | Solution or project, relative to `working-directory`. Empty lets the SDK discover it. |
| `fail-on-severity` | string | no | `High` | Lowest severity that fails the job: `Low`, `Moderate`, `High`, `Critical`, or `none` to report only. |
| `include-transitive` | boolean | no | `true` | Audit transitive dependencies too. |
| `upload-artifact` | boolean | no | `true` | Upload the raw JSON report. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `audit-result` | Outcome of the evaluation step (`success` or `failure`). |
| `vulnerability-count` | Distinct vulnerable findings (package, version, advisory). |
| `vulnerabilities-critical` | Findings at critical severity. |
| `vulnerabilities-high` | Findings at high severity. |
| `vulnerabilities-items` | JSON array of `{package,severity,title}`, at most 20, most severe first. `title` is the advisory URL; `severity` is lower case. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dotnet-audit` | always | Restore, write `dotnet list package --vulnerable --format json` to `audit/vulnerable.json`, evaluate it with Node, upload the report. |

## Example

```yaml
jobs:
  security:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/dotnet-audit.yml@v1
    with:
      system-name: orders-api
      fail-on-severity: High
```

## Notes

- `dotnet list package --vulnerable` exits `0` whether or not it finds
  anything, so the workflow decides from the JSON, not the exit code.
- Findings are deduplicated by package, resolved version and advisory URL. The
  same package listed by several projects counts once.
- A severity name the workflow does not know is treated as blocking.
- An unsupported `fail-on-severity` value fails the job.
- Artifact: `<system-name>-dotnet-audit` (14 days) when `upload-artifact` is
  `true`.
