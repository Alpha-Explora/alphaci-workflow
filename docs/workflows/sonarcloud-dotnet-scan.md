# sonarcloud-dotnet-scan.yml

Runs SonarCloud analysis for C# with SonarScanner for .NET (`begin`, `dotnet
build`, `end`), then reads back the quality gate, measures and top issues of
that analysis. The generic `sonar-scanner` CLI in `sonarcloud-scan.yml` cannot
analyse C#.

- Source: `.github/workflows/sonarcloud-dotnet-scan.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `sonar`, only when the `SONAR_*` secrets are set)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the solution. |
| `system-name` | string | yes | | Name used in logs. |
| `dotnet-version` | string | no | `10.0.x` | .NET SDK version. |
| `solution-path` | string | no | `""` | Solution or project, relative to `working-directory`. Empty lets the SDK discover it. |
| `configuration` | string | no | `Release` | Build configuration. |
| `sources-path` | string | no | `src` | Value for `sonar.sources`. |
| `tests-path` | string | no | `tests` | Value for `sonar.tests`. Must differ from `sources-path`. |
| `coverage-report-path` | string | no | `coverage/coverage.cobertura.xml` | Cobertura report. Only used to warn that coverage is present in a format the scanner cannot import. |
| `generic-coverage-report-path` | string | no | `coverage/SonarQube.xml` | Coverage in SonarQube generic format. This is the file imported (`sonar.coverageReportPaths`). |
| `coverage-artifact-name` | string | no | `""` | Artifact to download into `<working-directory>/coverage`. Empty skips the download. |
| `coverage-exclusions` | string | no | `tests/**` | Value for `sonar.coverage.exclusions`. |
| `quality-gate-wait` | boolean | no | `false` | Pass `sonar.qualitygate.wait=true` so a failed gate fails the job. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `SONAR_TOKEN` | no | SonarCloud token. |
| `SONAR_ORGANIZATION` | no | SonarCloud organization key. |
| `SONAR_PROJECT_KEY` | no | SonarCloud project key. |

All three are declared optional, but the job fails when any of them is empty.
Callers that may not have them should skip the job instead.

## Outputs

| Output | Description |
| --- | --- |
| `status` | Outcome of the analysis step (`success` or `failure`). |
| `blocked-by` | `automatic-analysis` when SonarCloud rejected the run because Automatic Analysis is on. Empty otherwise. |
| `gate-status` | Quality gate of this analysis: `OK`, `ERROR`, or `UNKNOWN`. |
| `failed-conditions` | JSON array of `{metric,status,actual,threshold}` for conditions in `ERROR` or `WARN`. |
| `measures` | JSON object with `bugs`, `vulnerabilities`, `code_smells`, `security_hotspots`, `coverage`, `duplicated_lines_density`. |
| `issues` | JSON array of the most severe open issues on new code (rule, severity, type, message, file, line), at most 20. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `sonarcloud-dotnet` | always | Full-depth checkout, set up .NET and Java 21, download coverage, check the secrets, run the scanner around `dotnet build`, then collect findings from the SonarCloud Web API. |

## Example

```yaml
jobs:
  sonar:
    needs: [branch-policy, dotnet-tests]
    if: ${{ needs.branch-policy.outputs.sonar-enabled == 'true' }}
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/sonarcloud-dotnet-scan.yml@v1
    with:
      system-name: orders-api
      sources-path: src
      tests-path: tests
      coverage-artifact-name: orders-api-coverage
      quality-gate-wait: true
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      SONAR_ORGANIZATION: ${{ secrets.SONAR_ORGANIZATION }}
      SONAR_PROJECT_KEY: ${{ secrets.SONAR_PROJECT_KEY }}
```

## Notes

- Coverage comes from `SonarQube.xml`, which `dotnet-test.yml` writes next to
  the Cobertura report. SonarScanner for .NET has no Cobertura importer. With
  no generic report the analysis runs without coverage and warns.
- A `sonar-project.properties` in the checkout is deleted before the scan,
  with a warning. SonarScanner for .NET refuses to run with one; every value
  is passed on the command line.
- Identical `sources-path` and `tests-path` fail the job before the scan.
- SonarCloud rejects a CI analysis on a project that has Automatic Analysis
  enabled. The job then sets `blocked-by=automatic-analysis` and names the
  fix: in SonarCloud, the project, Administration, Analysis Method, unselect
  "Enabled for this project". New projects have it on by default.
- `Collect Findings` never fails the job. It reads the compute-engine task
  from `.sonarqube/out/.sonar/report-task.txt`, waits up to about three
  minutes for it, and reads the gate by analysis id. If the task does not
  finish it falls back to the branch or pull request from the report's
  dashboard URL. With no task file the gate is `UNKNOWN` and the other
  outputs are empty.
- The generated pipeline sets `quality-gate-wait` from `branch-policy`:
  `true` on `uat` and `main`, `false` elsewhere.
