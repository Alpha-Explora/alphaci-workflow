# sonarcloud-scan.yml

## Role
Primitive check.

## Purpose
Runs SonarCloud static analysis and the quality gate for frontend, backend, and mobile repositories.

## Public Contract
- Source workflow: `.github/workflows/sonarcloud-scan.yml`
- Inputs: `working-directory`, `system-name`, `sources-path`, `tests-path`, `sources-exclusions`, `coverage-report-path`, `coverage-artifact-name`, `quality-gate-wait`, `checkout-ref`
- Secrets: `SONAR_TOKEN`, `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION` (all required)
- Outputs: `quality-gate-status`, `blocked-by`, `gate-status`, `failed-conditions`, `measures`, `issues`

## Usage
Called by generated quality-stage pipelines after the unit-test job, so the coverage artifact named by
`coverage-artifact-name` is available to download. The generator gates this job on
`branch-policy.sonar-enabled`, which is true only when all three secrets are present, so repositories
without SonarCloud keep passing. `quality-gate-wait` is advisory on pull-request refs and blocking on
direct `uat` and `main` runs.

Coverage is consumed as lcov (`coverage/lcov.info` by default), not as Istanbul's JSON summary.

## Automatic Analysis has to be off, per project
SonarCloud refuses to run a CI analysis on a project that also has Automatic Analysis enabled. It is on by default for new projects, so this bites every new project rather than once per organisation. The scanner reports it only as `ERROR You are running CI analysis while Automatic Analysis is enabled` and exits non-zero, and `sonarqube-scan-action` does not expose its log to later steps.

When the scan fails before it reaches SonarCloud (no `.scannerwork/report-task.txt`), the `Diagnose Scan Failure` step runs the same scanner once more with its output captured (about fifteen seconds, capped at 120, quality-gate-wait forced off) and looks for that message. If found it sets `blocked-by=automatic-analysis` and prints an `::error::` naming the fix: SonarCloud -> the project -> Administration -> Analysis Method -> turn off Automatic Analysis. The job still fails. The re-run only classifies the failure; it never changes the verdict.

`blocked-by` is empty in every other case. It mirrors the output of `sonarcloud-dotnet-scan.yml` so a caller can wire both stacks the same way.

## Findings never come from another analysis
`gate-status`, `failed-conditions`, `measures` and `issues` are read for the analysis this run produced (the compute-engine task in `report-task.txt`). A scan that failed before SonarCloud accepted it has no task, so `gate-status` is `UNKNOWN` and the other three are empty. The project's current gate is not read in that case: it belongs to an earlier analysis or to Automatic Analysis of unrelated files, and reporting it blames the code for a run that never analysed it.
