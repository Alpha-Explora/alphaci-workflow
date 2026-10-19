# vercel-deploy.yml

Builds a frontend with the Vercel CLI from a pinned commit and deploys it as a preview or to production. A preview can be given a stable alias so a later stage can find it. Older previews of the same branch are removed after an untargeted preview deploy.

- Source: `.github/workflows/vercel-deploy.yml`
- Trigger: `workflow_call`
- Used by: the Vercel provider fragment, for the `frontend` slot.
  - `20-alphaci-package.yml` (branch pipeline): one `deploy-vercel-frontend-<branch>` job per branch. `environment` is `production` on `main` and `preview` elsewhere; previews pass `branch-alias` and `git-branch`.
  - Environment pipelines (`20-alphaci-package.yml` for the first environment, `30-alphaci-promote.yml` for later ones): targeted mode with `environment-id`, `environment-name`, `target-id` and the release commit as `checkout-ref`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | no | `""` | System name. Used in the concurrency group and as Vercel deployment metadata. |
| `working-directory` | string | yes | | Project directory that holds `package.json`. |
| `environment` | string | no | `preview` | `preview` or `production`. |
| `branch-alias` | string | no | `""` | Stable hostname for a preview deploy. Ignored for production. |
| `require-branch-alias` | boolean | no | `true` | Fail when the alias cannot be set or does not route. `false` only warns. |
| `checkout-ref` | string | no | `""` | Git ref to check out. Must be a 40-character SHA in targeted mode. |
| `git-branch` | string | no | `""` | Branch whose branch-scoped preview Environment Variables `vercel pull` includes. Ignored for production. |
| `environment-id` | string | no | `""` | AlphaCI environment ID. If set, `environment-name` and `target-id` are required too. |
| `environment-name` | string | no | `""` | Protected GitHub Environment the job binds to in targeted mode. Validated by the caller. |
| `target-id` | string | no | `""` | AlphaCI Vercel target ID. Never inferred from the branch. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `VERCEL_TOKEN` | yes | Vercel API token. |
| `VERCEL_ORG_ID` | yes | Vercel team or user ID. |
| `VERCEL_PROJECT_ID` | yes | Vercel project ID. |
| `GH_PR_TOKEN` | no | Token for the PR comment with the deployment URL. Without it the comment is skipped. |

## Outputs

| Output | Description |
| --- | --- |
| `deployment_alias` | `https://<branch-alias>` when an alias was requested and routes. |
| `deployment_url` | Vercel deployment URL. |
| `deployment_id` | Vercel deployment ID. |

## Permissions

Workflow: `contents: read`. No extra permissions are needed from the caller.

The job binds to GitHub Environment `environment-name` in targeted mode, else to `environment` (`preview` or `production`).

Concurrency group `vercel-deploy-<target-id or environment>-<system-name or working-directory>`, never cancelled in progress.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `vercel-deploy` | Always | Checks out `checkout-ref`, validates the identity inputs and `package.json`, installs `vercel@50.22.1`, runs `vercel pull` and `vercel build`, deploys with `--prebuilt`, resolves the deployment ID and owner, sets the alias, removes older branch previews, and comments on the PR. Timeout 40 minutes. |

## Example

What AlphaCI generates for a `uat` preview in the branch pipeline:

```yaml
jobs:
  deploy-vercel-frontend-uat:
    needs: [pipeline-context, build]
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/vercel-deploy.yml@v1
    with:
      system-name: my-web
      working-directory: .
      environment: preview
      branch-alias: uat-${{ vars.VERCEL_ALIAS }}
      git-branch: uat
      checkout-ref: ${{ needs.pipeline-context.outputs.sha }}
    secrets:
      VERCEL_TOKEN: ${{ secrets.VERCEL_FRONTEND_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_FRONTEND_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_FRONTEND_PROJECT_ID }}
      GH_PR_TOKEN: ${{ secrets.GH_PR_TOKEN != '' && secrets.GH_PR_TOKEN || github.token }}
```

## Notes

- `vercel pull` and `vercel build` run in `working-directory` first, then at the repository root if that fails.
- The deployment URL is read from `vercel deploy` stdout. If stdout is not exactly one URL, the last `*.vercel.app` host in the output is used with a warning. `vercel.link` and `vercel.com` links are never used.
- Deployments carry metadata `githubCommitRef`, `githubCommitSha` (the `checkout-ref` in targeted mode, else `github.sha`), `systemName`, and in targeted mode `alphaCiEnvironmentId` and `alphaCiTargetId`.
- `vercel alias` and `vercel remove` run with `--scope` set to the deployment's owner (from the Vercel API, then the project's `accountId`), falling back to `VERCEL_ORG_ID` when it is a `team_` ID.
- The alias is set with up to 2 attempts, then checked up to 5 times. A `404` with `X-Vercel-Error: DEPLOYMENT_NOT_FOUND` means it does not route. Any other status passes.
- A targeted deploy fails if the deployment ID cannot be resolved. An untargeted one warns and returns an empty ID.
- Preview cleanup runs only for untargeted previews. It removes `READY` previews of the same branch and removes nothing unless this run's deployment is in the list.
- AlphaCI installs `VERCEL_FRONTEND_TOKEN`, `VERCEL_FRONTEND_ORG_ID`, `VERCEL_FRONTEND_PROJECT_ID` as repository secrets and `VERCEL_ALIAS` as a repository variable. The branch pipeline maps them to this workflow's secret names. The environment-pipeline job passes `secrets: inherit`, which does not rename them, and which GitHub only honours within one organization or enterprise.
