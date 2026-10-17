# branch-policy.yml

Resolves per-branch quality rules from a branch name: the coverage threshold,
whether lint warnings are fatal, whether SonarCloud is configured, and whether
the SonarCloud gate blocks.

- Source: `.github/workflows/branch-policy.yml`
- Trigger: `workflow_call`
- Used by: not called by the generator or any template. Generated pipelines
  compute the same outputs in an inline `branch-policy` job.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `branch` | string | yes | | Branch to evaluate. |
| `base-coverage-threshold` | number | no | `80` | Coverage threshold on every branch (`dev`, `uat` and `main` alike). |

## Secrets

None declared. The job reads `SONAR_TOKEN`, `SONAR_ORGANIZATION` and
`SONAR_PROJECT_KEY` to decide `sonar-enabled`; because they are not declared,
they are only visible when the caller uses `secrets: inherit`.

## Outputs

| Output | Description |
| --- | --- |
| `branch` | The `branch` input. |
| `coverage-threshold` | `base-coverage-threshold`, on every branch. |
| `fail-on-warning` | `true` on `uat` and `main`, else `false`. |
| `sonar-enabled` | `true` when all three Sonar secrets are non-empty. |
| `sonar-gate-wait` | `true` on `uat` and `main`, else `false`. |

## Permissions

Workflow: `contents: read`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `resolve` | always | Computes the outputs in one shell step. |

## Example

```yaml
jobs:
  branch-policy:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/branch-policy.yml@v1
    with:
      branch: ${{ github.ref_name }}
      base-coverage-threshold: 80
    secrets: inherit
```

## Notes

- One coverage threshold on every branch, as the generator's inline policy
  uses: a commit that passed `dev` cannot fail the same bar on `uat` or
  `main`. Those two stay strict otherwise: lint warnings are fatal and the
  SonarCloud gate blocks.
