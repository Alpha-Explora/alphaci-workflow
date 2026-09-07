# sonarcloud-scan.yml

## Role
Primitive check.

## Purpose
Runs SonarCloud static analysis and the quality gate for frontend, backend, and mobile repositories.

## Public Contract
- Source workflow: `.github/workflows/sonarcloud-scan.yml`
- Inputs: `working-directory`, `system-name`, `sources-path`, `tests-path`, `sources-exclusions`, `coverage-report-path`, `coverage-artifact-name`, `quality-gate-wait`, `checkout-ref`
- Secrets: `SONAR_TOKEN`, `SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION` (all required)
- Outputs: `quality-gate-status`

## Usage
Called by generated quality-stage pipelines after the unit-test job, so the coverage artifact named by
`coverage-artifact-name` is available to download. The generator gates this job on
`branch-policy.sonar-enabled`, which is true only when all three secrets are present, so repositories
without SonarCloud keep passing. `quality-gate-wait` is advisory on pull-request refs and blocking on
direct `uat` and `main` runs.

Coverage is consumed as lcov (`coverage/lcov.info` by default), not as Istanbul's JSON summary.
