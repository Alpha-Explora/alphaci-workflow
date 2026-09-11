# sonarcloud-dotnet-scan.yml

## Role
Quality gate.

## Purpose
Runs SonarQube Cloud analysis for C# using SonarScanner for .NET.

## Public Contract
- Source workflow: `.github/workflows/sonarcloud-dotnet-scan.yml`
- Inputs: `working-directory`, `system-name`, `dotnet-version`, `solution-path`, `configuration`, `sources-path`, `tests-path`, `coverage-report-path`, `coverage-artifact-name`, `quality-gate-wait`, `checkout-ref`
- Secrets: `SONAR_TOKEN`, `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`
- Outputs: `status`

## Why this exists separately from sonarcloud-scan.yml
SonarQube Cloud analyses C#, but only through SonarScanner for .NET. The generic
`sonar-scanner` CLI that `sonarcloud-scan.yml` runs does not support C# or VB.NET
at all.

The difference is when analysis happens. The CLI reads files that already exist.
SonarScanner for .NET wraps the build — `begin`, then `dotnet build`, then `end` —
so Roslyn analyzers emit their findings as the compiler runs and the scanner
collects them. That is why this workflow builds the solution again rather than
reusing an earlier build.

## sources and tests must be disjoint
Sonar refuses to index a file as both a source and a test, and fails the whole
scan rather than choosing. The workflow rejects identical values up front so the
failure names the cause instead of surfacing as "can't be indexed twice" from
the scanner.

A .NET repository keeps tests in their own directory, so `sources-path: src` and
`tests-path: tests`. The Node value of `src,tests` overlaps and must not be
copied across.

## Coverage
Reads the merged Cobertura report `dotnet-test.yml` produces. Coverage is
optional: a repository whose tests produced no report still gets code analysis,
with a warning, rather than no analysis at all.

## Java
The scanner is a .NET global tool but the analysis engine runs on Java, which
some SDK images do not ship. The workflow installs a JRE for that reason.

## Automatic Analysis has to be off, per project
SonarCloud refuses to run a CI analysis on a project that also has Automatic Analysis enabled, and says so only as `Post-processing failed. Exit code: 1` with the reason forty lines up the log. This workflow pulls that reason out and names the fix.

It is documented behaviour rather than a defect: *"Automatic analysis is not intended to be used in conjunction with CI-based analysis. If you enable automatic analysis, you must ensure that you do not have any CI-based analyses configured. If you do then these CI-based analyses will fail and cause a failure in your build process."*

It bites **every new project**, not once per organisation. Automatic analysis is on by default for new projects, and the organisation-level switch that would turn it off for all of them is an Enterprise-plan feature — on any lower plan it must be turned off per project, at *the project → Administration → Analysis Method → unselect "Enabled for this project"*. There is no supported Web API for it.

CI-based analysis is the one to keep. Automatic analysis states plainly that *"code coverage information is not supported"*, and a pipeline whose quality gate is coverage has given up the thing it exists to measure the moment coverage stops arriving.

