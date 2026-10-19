# branch-policy.yml

Resolves per-branch quality rules from a branch name: the coverage threshold,
whether lint warnings are fatal, whether SonarCloud is configured, and whether
the SonarCloud gate blocks.

- Source: `.github/workflows/branch-policy.yml`
- Trigger: `workflow_call`
- Used by: not called by the generator or any template. Generated pipelines
  compute the same outputs in an inline `branch-policy` job, with different
  coverage rules (see Notes).

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `branch` | string | yes | | Branch to evaluate. |
| `base-coverage-threshold` | number | no | `80` | Coverage threshold on branches other than `uat` and `main`. |

## Secrets

None declared. The job reads `SONAR_TOKEN`, `SONAR_ORGANIZATION` and
`SONAR_PROJECT_KEY` to decide `sonar-enabled`; because they are not declared,
they are only visible when the caller uses `secrets: inherit`.

## Outputs

| Output | Description |
| --- | --- |
| `branch` | The `branch` input. |
| `coverage-threshold` | `base-coverage-threshold` on other branches; base + 10, capped at 95, on `uat` and `main`. |
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

- The generator's inline policy uses the project's coverage threshold on every
  branch and does not add 10 on `uat` and `main`. The two are not
  interchangeable.
