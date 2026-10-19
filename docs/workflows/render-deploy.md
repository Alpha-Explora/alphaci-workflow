# render-deploy.yml

Deploys a service on Render through a deploy hook, or only verifies an already-deployed service, then polls its health endpoint. In targeted mode it deploys one exact image digest to one named target.

- Source: `.github/workflows/render-deploy.yml`
- Trigger: `workflow_call`
- Used by: the environment pipelines AlphaCI generates for projects with environments. The Render provider fragment adds one job per Render target in `20-alphaci-package.yml` (first environment) and `30-alphaci-promote.yml` (later environments), always in targeted mode. Branch pipelines without environments use [release.yml](release.md) instead.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | yes | | System name, used in the concurrency group and summary. |
| `environment` | string | yes | | Environment label. The generator passes `uat` or `production`. |
| `branch` | string | yes | | Branch being deployed. Selects the per-branch secrets in untargeted mode. |
| `environment-id` | string | no | `""` | AlphaCI environment ID. If set, `environment-name` and `target-id` are required too. |
| `environment-name` | string | no | `""` | Protected GitHub Environment the job binds to. Validated by the caller. |
| `target-id` | string | no | `""` | AlphaCI Render target ID. Never inferred from the branch. |
| `commit-sha` | string | no | `""` | Full 40-character commit. Required in targeted mode. |
| `artifact` | string | no | `""` | `image@sha256:<digest>` reference. Required in targeted mode. |
| `deploy-mode` | string | no | `auto` | `auto`, `webhook` or `verify-only`. `auto` uses `webhook` when a hook URL resolves, else `verify-only`. |
| `deploy-hook-url` | string | no | `""` | Deploy hook URL. Overrides the secrets. |
| `healthcheck-url` | string | no | `""` | Health URL, either a base URL or a full endpoint. Overrides the secrets. |
| `healthcheck-path` | string | no | `/api/v1/health` | Path appended when the health URL is a bare origin. |
| `healthcheck-timeout-seconds` | number | no | `0` | Health polling timeout. `0` uses the default for the mode or branch (see Notes). |
| `healthcheck-interval-seconds` | number | no | `10` | Seconds between health attempts. |
| `healthcheck-expected-statuses` | string | no | `""` | Comma-separated accepted HTTP statuses. Empty uses the default for the mode or branch. |
| `require-api-center-check` | boolean | no | `true` | Also require `checks.apiCenter == true` in the JSON health response. |

## Secrets

All optional.

| Secret | Required | Description |
| --- | --- | --- |
| `RENDER_DEPLOY_HOOK_URL_DEV` | no | Deploy hook for `dev` (untargeted mode). |
| `RENDER_DEPLOY_HOOK_URL_UAT` | no | Deploy hook for `uat` (untargeted mode). |
| `RENDER_DEPLOY_HOOK_URL_MAIN` | no | Deploy hook for `main` (untargeted mode). |
| `RENDER_DEPLOY_HOOK_URL` | no | Fallback deploy hook. The only secret read for the hook in targeted mode, so it must be scoped to the GitHub Environment. |
| `RENDER_HEALTHCHECK_URL_DEV` | no | Health URL for `dev` (untargeted mode). |
| `RENDER_HEALTHCHECK_URL_UAT` | no | Health URL for `uat` (untargeted mode). |
| `RENDER_HEALTHCHECK_URL_MAIN` | no | Health URL for `main` (untargeted mode). |
| `RENDER_HEALTHCHECK_URL` | no | Fallback health URL. The only secret read for health in targeted mode. |

## Outputs

| Output | Description |
| --- | --- |
| `deployment_url` | Service URL from the hook response, else the health URL, else the run URL. |
| `mode_used` | `webhook` or `verify-only`. |
| `health_status` | `success`, `failure` or `unknown`. |
| `healthcheck_url` | Health URL that was polled. |
| `health_http_code` | Last health HTTP status, `000` if none. |
| `webhook_http_code` | Deploy hook HTTP status, `n/a` when no hook ran. |

## Permissions

Workflow: `contents: read`. No extra permissions are needed from the caller.

Concurrency group `render-deploy-<target-id or environment>-<system-name>`, never cancelled in progress.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `render-deploy` | Always | Checks out, resolves mode, hook, health URL and defaults, calls the deploy hook (3 attempts, 5 s apart), polls health and writes a summary. Binds to `environment-name` when `environment-id` is set. Timeout 40 minutes. |

## Example

What AlphaCI generates for a Render target in an environment pipeline:

```yaml
jobs:
  deploy-dev-backend:
    needs: [pipeline-context, register-release, image-backend]
    if: ${{ (needs.pipeline-context.outputs.branch) == 'dev' }}
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/render-deploy.yml@v1
    with:
      system-name: orders-api
      environment: uat
      branch: dev
      environment-id: <environment id>
      environment-name: dev
      target-id: <target id>
      commit-sha: ${{ needs.pipeline-context.outputs.sha }}
      artifact: ${{ needs.image-backend.outputs.image-ref }}
    secrets: inherit
```

## Notes

- Targeted mode (any identity input set) needs all three identity inputs, single-line, a 40-character `commit-sha`, an `image@sha256:<digest>` `artifact`, and webhook mode with a resolvable hook. The image is sent to Render as the `imgURL` query parameter on the hook. Health defaults: expected `200`, timeout 420 s.
- Untargeted mode picks `RENDER_*_<BRANCH>` secrets for `dev`, `uat` and `main`, falling back to the generic secrets. Health defaults: `main` expects `200` within 600 s; `test` expects `200,401,403` within 180 s; any other branch expects `200` within 420 s.
- A deploy hook response that contains a service URL replaces the configured health URL.
- The job fails when no health URL resolves.
- `require-api-center-check` defaults to `true` and the generator does not set it. A service whose health response has no `checks.apiCenter: true` never passes.
- The generator passes `secrets: inherit`. GitHub only passes inherited secrets to a reusable workflow in the same organization or enterprise, so a customer repository in another organization reaches this workflow with no secrets. Pass the hook and health secrets by name in that case.
- AlphaCI installs `RENDER_HEALTHCHECK_URL_<BRANCH>` as a repository secret and variable for each Render target. It does not install any deploy hook secret.
