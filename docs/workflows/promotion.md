# promotion.yml

## Role
Promotion.

## Purpose
Opens or updates the promotion pull request that moves a verified commit to the next branch in the
pipeline, and renders the pipeline result summary into the PR body.

## Public Contract
- Source workflow: `.github/workflows/promotion.yml`
- Inputs: `pipeline-kind`, `direction`, `system1-name`, `system1-url`, `system2-name`, `system2-url`,
  `system3-name`, `system3-url`, `version-tag`, `versions-json`, `systems-json`,
  `deployment-urls-json`, `artifact-kind`, `artifact-links-json`, `quality-gates-json`,
  `results-json`, `dry-run`, `system1-result`, `system2-result`, `system3-result`, `tests-status`,
  `lint-status`, `security-status`, `sonar-status`, `playwright-status`, `grafana-status`,
  `pipeline-result`
- Secrets: `PR_TOKEN`
- Outputs: none

## Usage
Emitted by the generated package stage. The generator supplies `pipeline-kind`, `direction`,
`system1-name` and `pipeline-result`; every other input is optional and defaults inside the workflow.
`PR_TOKEN` falls back to `github.token` when `GH_PR_TOKEN` is not configured.

Note this is distinct from `workflow-templates/customer/promotion.yml`, which is a copyable customer
template. The backend references the reusable workflow at this path, not the template.
