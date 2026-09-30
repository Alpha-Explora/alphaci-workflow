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
  `results-json`, `dry-run`, `sibling-repo`, `system1-result`, `system2-result`, `system3-result`, `tests-status`,
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

## Paired promotion (`sibling-repo`)
Optional, default empty. Set by the generator only for the two repositories of a multi-repo
frontend/backend project, to the other repository's `owner/repo`. When set, the promotion PR body
gains a marked "Paired Promotion" section linking the sibling's open PR for the same source and target
branches; if the sibling has none yet it links the sibling's compare view. After creating or updating
its own PR the workflow also appends the reverse link to the sibling PR body, replacing any previous
marked block so re-runs never duplicate it.

Token scope: `github.token` (the fallback for `PR_TOKEN`) can only reach the calling repository, so
the sibling lookup fails there and the section degrades to a link to the sibling's pull requests page.
A `GH_PR_TOKEN` PAT with access to both repositories enables the direct link and the reverse edit. No
lookup or edit failure fails the job. When unset, behavior is identical to before this input existed.
