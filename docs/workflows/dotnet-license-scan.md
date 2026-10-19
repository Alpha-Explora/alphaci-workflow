# dotnet-license-scan.yml

Inventories the licences of the resolved NuGet graph with `nuget-license`,
including transitive packages, and fails when a package uses a forbidden
licence. Test projects are excluded.

- Source: `.github/workflows/dotnet-license-scan.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `licenses`)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the solution. |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `dotnet-version` | string | no | `10.0.x` | .NET SDK version. |
| `solution-path` | string | no | `""` | Solution or project, relative to `working-directory`. Empty uses the first `*.sln` in `working-directory`. |
| `forbidden-licenses` | string | no | `GPL-2.0,GPL-3.0,AGPL-3.0,SSPL-1.0` | Comma-separated SPDX ids that fail the scan. Matched case-insensitively. |
| `fail-on-forbidden` | boolean | no | `true` | Fail when a forbidden licence is found. `false` reports only. |
| `tool-version` | string | no | `4.0.16` | `nuget-license` version. |
| `exclude-projects` | string | no | `*.Tests.csproj;*.Test.csproj;*.IntegrationTests.csproj;*.Spec.csproj;*.Specs.csproj` | Project file patterns excluded from the scan, matched case-insensitively against the project path. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `license-result` | Outcome of the policy step (`success` or `failure`). |
| `forbidden-count` | Packages under a forbidden licence. `0` when clean. |
| `forbidden-items` | JSON array of `{package,version,license}`, at most 20. |
| `unknown-count` | Packages that report no licence. Warned about, not counted as forbidden. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dotnet-license-scan` | always | Restore, run `nuget-license --include-transitive` into `licenses/licenses.json`, apply the forbidden list with `jq`, upload the inventory. |

## Example

```yaml
jobs:
  licenses:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/dotnet-license-scan.yml@v1
    with:
      system-name: orders-api
      fail-on-forbidden: true
```

## Notes

- The job fails, whatever `fail-on-forbidden` says, when no solution is found,
  when the tool writes no readable JSON, or when the inventory is empty. An
  empty inventory usually means `exclude-projects` matched the shipping
  project.
- Patterns in `exclude-projects` are matched against the project path, so
  each should end in `.csproj`.
- The tool's exit code is not used as the verdict; the policy step decides
  from the inventory.
- The generated pipeline keeps the default forbidden list and sets
  `fail-on-forbidden` from `branch-policy`: `true` on `uat` and `main`,
  `false` elsewhere.
- Artifact: `licenses-<system-name>` (30 days), uploaded on every run.
