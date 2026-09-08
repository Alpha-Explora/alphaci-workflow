# dotnet-test.yml

## Role
Primitive check.

## Purpose
Restores, builds, and tests a .NET solution, then merges the per-project coverage reports into one and enforces a line-coverage threshold.

## Public Contract
- Source workflow: `.github/workflows/dotnet-test.yml`
- Inputs: `working-directory`, `system-name`, `dotnet-version`, `solution-path`, `configuration`, `test-arguments`, `coverage-threshold`, `enforce-coverage`, `reportgenerator-version`, `upload-artifact`, `checkout-ref`
- Secrets: none
- Outputs: `unit-test-result`, `coverage-percent`

## Usage
Call directly from consumer workflows, in parallel with lint and security scans, the same way `backend-tests.yml` is called for Node services. Use `checkout-ref` in `workflow_run` chains.

`dotnet-version` defaults to `10.0.x`, the active LTS. .NET 8 and .NET 9 both leave support in November 2026, so pin to one of those only for a repository that cannot move yet.

Leave `solution-path` empty when the working directory contains exactly one solution or project; the SDK discovers it. Set it for a repository holding several.

## Coverage
Coverage is collected with `--collect:"XPlat Code Coverage"`, which requires a `PackageReference` to `coverlet.collector` in every test project. A test project without it runs green and produces no report; the workflow treats that as a failure when `enforce-coverage` is true rather than reporting zero, because the two have different fixes.

`dotnet test` writes one report per test project into its own GUID-named directory. The workflow merges all of them with ReportGenerator into:

- `coverage/coverage.cobertura.xml` — read by the `coverage-gate` action with `format: cobertura`
- `coverage/lcov.info` — the path `sonarcloud-scan.yml` expects

Merging rather than reading the first report is deliberate: a solution with separate unit and integration test projects would otherwise be graded on whichever one the filesystem happened to list first.

## Known limitation
`sonarcloud-scan.yml` runs the generic SonarScanner CLI. That scanner does not analyse C#, which requires the SonarScanner for .NET (`dotnet sonarscanner begin/end`) wrapped around the build. The lcov report this workflow produces is therefore usable for coverage reporting but does not by itself give a .NET project SonarCloud code analysis. A `sonarcloud-dotnet-scan.yml` is the separate piece of work that closes it.
