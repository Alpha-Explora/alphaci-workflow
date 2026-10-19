# promotion.yml

Opens or updates the pull request that promotes `dev` to `uat` or `uat` to
`main`, and writes a review summary into its body: quality gates, links, version
tags, per-system results, a pre-merge checklist and the compare link.

- Source: `.github/workflows/promotion.yml`
- Trigger: `workflow_call`
- Used by: generated `20-alphaci-package.yml` (jobs `promote-to-uat` on `dev`
  and `promote-to-main` on `uat`). Distinct from the customer template
  `workflow-templates/customer/promotion.yml`, which the generator does not
  call.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `pipeline-kind` | string | yes | | `single` or `multi`. `single` looks up the latest `dev-v*` / `uat-v*` git tag when `version-tag` is empty. |
| `direction` | string | yes | | `dev-to-uat` or `uat-to-main`. Anything else fails the job. |
| `system1-name` | string | no | `Frontend-Root` | First system name. |
| `system1-url` | string | no | `""` | First system link. |
| `system2-name` | string | no | `""` | Second system name. |
| `system2-url` | string | no | `""` | Second system link. |
| `system3-name` | string | no | `""` | Third system name. |
| `system3-url` | string | no | `""` | Third system link. |
| `version-tag` | string | no | `""` | Version shown for every system. |
| `versions-json` | string | no | `{}` | Per-system versions, `{name: version}`. |
| `systems-json` | string | no | `""` | JSON array of `{name}`. Overrides `system1..3-name`. |
| `deployment-urls-json` | string | no | `{}` | Per-system links, `{name: url}`. Overrides `system1..3-url`. |
| `artifact-kind` | string | no | `deployment` | `deployment` or `release`. Changes the link section wording. |
| `artifact-links-json` | string | no | `""` | Per-system links, `{name: url}`. Overrides deployment links. |
| `quality-gates-json` | string | no | `{}` | Extra quality gates, `{label: result}`. |
| `results-json` | string | no | `{}` | Per-system results, `{name: result}`. |
| `dry-run` | boolean | no | `false` | Print the PR body and stop without touching any PR. |
| `sibling-repo` | string | no | `""` | `owner/repo` of the paired frontend or backend repository. See Notes. |
| `system1-result` | string | no | `""` | First system result. |
| `system2-result` | string | no | `""` | Second system result. |
| `system3-result` | string | no | `""` | Third system result. |
| `tests-status` | string | no | `""` | Tests gate result for the summary. |
| `lint-status` | string | no | `""` | Lint gate result. |
| `security-status` | string | no | `""` | Security gate result. |
| `sonar-status` | string | no | `""` | SonarCloud gate result. |
| `playwright-status` | string | no | `""` | Browser test gate result. |
| `grafana-status` | string | no | `""` | Performance gate result. |
| `pipeline-result` | string | no | `""` | Overall result. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `PR_TOKEN` | yes | Token used to read and write pull requests and to check out with full history. |

## Outputs

None.

## Permissions

Workflow: `contents: read`. The generated caller job grants
`contents: read` and `pull-requests: write` and passes
`PR_TOKEN: ${{ secrets.GH_PR_TOKEN != '' && secrets.GH_PR_TOKEN || github.token }}`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `promote` | always | Fails if `PR_TOKEN` is empty, checks out with full history, builds the PR body, then updates the open source-to-target PR or creates one. |

## Example

```yaml
jobs:
  promote-to-uat:
    needs: [build]
    if: ${{ github.ref_name == 'dev' && needs.build.result == 'success' }}
    permissions:
      contents: read
      pull-requests: write
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/promotion.yml@v1
    with:
      pipeline-kind: single
      direction: dev-to-uat
      system1-name: api
      pipeline-result: success
    secrets:
      PR_TOKEN: ${{ secrets.GH_PR_TOKEN != '' && secrets.GH_PR_TOKEN || github.token }}
```

## Notes

- An open PR for the same source and target is updated, never duplicated. When
  there is none and the source has no commits ahead of the target, no PR is
  created and the job succeeds.
- All PR reads and writes go through the REST API, so a classic PAT needs only
  the `repo` scope.
- A PR created with `github.token` does not trigger other workflows. Set the
  repository secret `GH_PR_TOKEN` to a PAT so the PR runs the access and
  quality checks.
- `sibling-repo` is set by the generator for the two repositories of a
  multi-repo frontend/backend project. The PR body gets a "Paired Promotion"
  section linking the sibling's open PR for the same branches, or its compare
  view when it has none. The workflow then adds the reverse link to the
  sibling PR, replacing any earlier block. `github.token` cannot read another
  repository, so without a PAT that covers both, the section links the
  sibling's pull requests page instead. No sibling lookup or edit fails the
  job. A value that is not `owner/repo` is ignored with a warning.
- The PR title is `Release: Promote DEV → UAT (<sha>)` or
  `Release: Promote UAT → Production (<sha>)`, prefixed with an emoji.
