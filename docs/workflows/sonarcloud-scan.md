# sonarcloud-scan.yml

Runs a SonarCloud analysis of a JavaScript or TypeScript project with
`SonarSource/sonarqube-scan-action`, optionally waits for the quality gate, and
publishes the gate result, measures and top issues as outputs.

- Source: `.github/workflows/sonarcloud-scan.yml`
- Trigger: `workflow_call`
- Used by: generated `10-alphaci-quality.yml` for Node stacks (job `sonar`).
  .NET stacks use `sonarcloud-dotnet-scan.yml` instead.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | yes | | Name used in logs. |
| `working-directory` | string | no | `.` | Project directory, used as the scanner base directory. |
| `sources-path` | string | no | `src` | `sonar.sources`, relative to `working-directory`. |
| `tests-path` | string | no | `tests` | `sonar.tests`, relative to `working-directory`. |
| `sources-exclusions` | string | no | `""` | `sonar.exclusions`, comma-separated. |
| `coverage-report-path` | string | no | `coverage/lcov.info` | `sonar.javascript.lcov.reportPaths`, relative to `working-directory`. |
| `coverage-artifact-name` | string | no | `""` | Artifact to download into `<working-directory>/coverage` before the scan. Empty skips the download. |
| `quality-gate-wait` | boolean | no | `true` | `sonar.qualitygate.wait`. When true, a failed gate fails the scan step. |
| `checkout-ref` | string | no | `""` | Ref to check out. Empty uses the event's ref. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `SONAR_TOKEN` | yes | SonarCloud token with access to the project. |
| `SONAR_ORGANIZATION` | yes | SonarCloud organization key. |
| `SONAR_PROJECT_KEY` | yes | SonarCloud project key. |

## Outputs

| Output | Description |
| --- | --- |
| `quality-gate-status` | `success` or `failure` for the job. |
| `blocked-by` | `automatic-analysis` when the scan was refused because the project has Automatic Analysis on; otherwise empty. |
| `gate-status` | Quality gate of this run's analysis: `OK`, `ERROR`, or `UNKNOWN` when it could not be read. |
| `failed-conditions` | JSON array of failed or warning gate conditions with actual value and threshold. |
| `measures` | JSON object of bugs, vulnerabilities, code smells, hotspots, coverage and duplication. |
| `issues` | JSON array of the most severe open issues on new code (rule, severity, message, file, line), at most 20. |

## Permissions

Workflow: `contents: read`. The caller needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `sonarcloud-scan` | always | Downloads coverage, checks the token can see the project, runs the scan, diagnoses a failed scan, collects findings, and sets the final status. |

## Example

```yaml
jobs:
  sonar:
    needs: [frontend-tests]
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/sonarcloud-scan.yml@v1
    with:
      system-name: web
      sources-path: src
      tests-path: src,tests
      coverage-report-path: coverage/lcov.info
      coverage-artifact-name: web-coverage
      quality-gate-wait: true
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      SONAR_ORGANIZATION: ${{ secrets.SONAR_ORGANIZATION }}
      SONAR_PROJECT_KEY: ${{ secrets.SONAR_PROJECT_KEY }}
```

## Notes

- The generated pipeline runs this job only when all three Sonar secrets are
  set, and passes `quality-gate-wait: true` on `uat` and `main` and `false` on
  other branches.
- Coverage is read as lcov, not as an Istanbul JSON summary. The generated
  pipeline downloads the `<service>-coverage` artifact written by
  `backend-tests.yml` or `frontend-tests.yml`.
- The preflight step fails the job when a secret is empty or the token cannot
  see `SONAR_ORGANIZATION` / `SONAR_PROJECT_KEY`.
- SonarCloud refuses a CI analysis while Automatic Analysis is on for the
  project, which is the default for new projects. When the scan fails before
  reaching SonarCloud, `Diagnose Scan Failure` re-runs the scanner once (at most
  120 seconds, gate wait off) to look for that message, sets
  `blocked-by=automatic-analysis` and prints the fix: SonarCloud > project >
  Administration > Analysis Method > turn off Automatic Analysis. The job still
  fails.
- Findings are read for the analysis this run produced. If the scan never
  reached SonarCloud, `gate-status` is `UNKNOWN` and the other finding outputs
  are empty; the project's older gate is not reported.
