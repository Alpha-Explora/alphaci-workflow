# dotnet-sbom.yml

Exports a CycloneDX software bill of materials (JSON) for the resolved NuGet
graph and keeps it as an artifact. It records; it does not judge the
dependencies.

- Source: `.github/workflows/dotnet-sbom.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `sbom`)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the solution or projects. |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `dotnet-version` | string | no | `10.0.x` | .NET SDK version. |
| `solution-path` | string | no | `""` | Solution or project, relative to `working-directory`. Empty uses the first `*.sln` or `*.slnx`, then the first `*.csproj` outside `bin/` and `obj/`. |
| `require-sbom` | boolean | no | `true` | Fail when no SBOM, or an SBOM with zero components, is produced. `false` warns only. |
| `tool-version` | string | no | `5.4.0` | CycloneDX dotnet tool version. |
| `retention-days` | number | no | `90` | How long to keep the SBOM artifact. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `sbom-result` | Outcome of the export step (`success` or `failure`). |
| `component-count` | Components in the SBOM. `0` when none was produced. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dotnet-sbom` | always | Restore, run `dotnet CycloneDX <target> --output sbom --json`, count components, upload `sbom/bom.json`. |

## Example

```yaml
jobs:
  sbom:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/dotnet-sbom.yml@v1
    with:
      system-name: orders-api
      require-sbom: true
```

## Notes

- Restore runs first, so the SBOM lists resolved versions, not declared ones.
- CycloneDX is always given a solution or project file. Given a directory it
  reports zero packages.
- With `require-sbom: true` the job fails when no target is found, the tool
  fails, `bom.json` is missing, or it lists zero components.
- The generated pipeline sets `require-sbom` from `branch-policy`: `true` on
  `uat` and `main`, `false` elsewhere.
- Artifact: `sbom-<system-name>`, kept for `retention-days`.
