# dotnet-test.yml

Restores, builds and tests a .NET solution, merges the per-project coverage
reports into one, and enforces a line-coverage threshold. It also reports test
counts and the names of failed tests.

- Source: `.github/workflows/dotnet-test.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` (.NET stack, job `dotnet-tests`); customer template `dotnet-service-pipeline` (job `unit-tests`)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the solution or test projects. |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `dotnet-version` | string | no | `10.0.x` | .NET SDK version. |
| `solution-path` | string | no | `""` | Solution or project, relative to `working-directory`. Empty lets the SDK discover it. |
| `configuration` | string | no | `Release` | Build configuration. |
| `test-arguments` | string | no | `""` | Extra arguments for `dotnet test`, split on whitespace (for example `--filter Category!=Integration`). |
| `coverage-threshold` | number | no | `80` | Minimum line coverage percentage. |
| `promotion-coverage-threshold` | number | no | `0` | Higher bar that warns, never fails, when coverage is below it. `0` turns it off. |
| `enforce-coverage` | boolean | no | `true` | Fail when coverage is below the threshold or no report was produced. |
| `reportgenerator-version` | string | no | `5.*` | ReportGenerator global tool version used to merge coverage. |
| `upload-artifact` | boolean | no | `true` | Upload the merged coverage directory. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `unit-test-result` | Outcome of the `dotnet test` step (`success` or `failure`). |
| `coverage-percent` | Line coverage percentage from the coverage gate. |
| `tests-total` | Tests executed. `0` when no TRX report was produced. |
| `tests-passed` | Tests that passed. |
| `tests-failed` | Tests that failed. |
| `tests-failures` | JSON array of `{name,message}` for failed tests, at most 20. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `dotnet-unit-tests` | always | Restore, `dotnet build`, `dotnet test --no-build` with the TRX logger and `XPlat Code Coverage`, summarise the TRX files, merge coverage with ReportGenerator, run the `coverage-gate` action, upload artifacts. |

## Example

```yaml
jobs:
  dotnet-tests:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/dotnet-test.yml@v1
    with:
      working-directory: .
      system-name: orders-api
      dotnet-version: 10.0.x
      coverage-threshold: 80
      checkout-ref: ${{ github.event.workflow_run.head_sha }}
```

## Notes

- Coverage needs a `PackageReference` to `coverlet.collector` in every test
  project. When tests pass but no Cobertura report exists, the job fails if
  `enforce-coverage` is `true` and warns otherwise. When the tests themselves
  failed, the merge step does not add a coverage error.
- ReportGenerator merges every `TestResults/<guid>/coverage.cobertura.xml` and
  excludes `**/obj/**` (source-generated code). It writes three files under
  `coverage/` from the same merge:
  - `coverage.cobertura.xml`, read by the `coverage-gate` action;
  - `lcov.info`;
  - `SonarQube.xml`, the generic format `sonarcloud-dotnet-scan.yml` imports.
- Artifacts: `<system-name>-coverage` (the `coverage/` directory, 14 days) and
  `<system-name>-unit-test-results` (TRX files, 7 days). The generated quality
  stage passes `<service>-coverage` to `sonarcloud-dotnet-scan.yml` as
  `coverage-artifact-name`.
- The generated pipeline takes `coverage-threshold` and
  `promotion-coverage-threshold` from its inline `branch-policy` job and sets
  `enforce-coverage: true`.
- A missing report and a below-threshold percentage fail with different
  messages, because they need different fixes.
