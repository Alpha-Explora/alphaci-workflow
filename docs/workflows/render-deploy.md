# render-deploy.yml

## Role
Deployment.

## Purpose
Deploys a service to Render and verifies it, either by triggering a deploy hook or by health-checking
an already-deployed revision.

## Public Contract
- Source workflow: `.github/workflows/render-deploy.yml`
- Inputs: `system-name`, `environment`, `branch`, `environment-id`, `environment-name`, `target-id`, `commit-sha`, `artifact`, `deploy-mode`, `deploy-hook-url`, `healthcheck-url`,
  `healthcheck-path`, `healthcheck-timeout-seconds`, `healthcheck-interval-seconds`,
  `healthcheck-expected-statuses`, `require-api-center-check`
- Secrets: `RENDER_DEPLOY_HOOK_URL_DEV`, `RENDER_DEPLOY_HOOK_URL_UAT`, `RENDER_DEPLOY_HOOK_URL_MAIN`,
  `RENDER_DEPLOY_HOOK_URL`, `RENDER_HEALTHCHECK_URL_DEV`, `RENDER_HEALTHCHECK_URL_UAT`,
  `RENDER_HEALTHCHECK_URL_MAIN`, `RENDER_HEALTHCHECK_URL` (all optional; resolved per environment)
- Outputs: `deployment_url`, `mode_used`, `health_status`, `healthcheck_url`, `health_http_code`,
  `webhook_http_code`

## Usage
Emitted by the Render workflow fragment for projects whose backend slot targets Render. `deploy-mode`
accepts `auto`, `webhook`, or `verify-only`. `require-api-center-check` asserts `checks.apiCenter` is
true in the health payload; the backend health endpoint emits this field.

Targeted callers supply all three identity inputs, a full 40-character `commit-sha`, and the
immutable `image@sha256:<digest>` `artifact` reference. The workflow binds the job to the supplied
GitHub Environment name and sends the same digest to Render using its `imgURL` deploy-hook parameter.
Targeted deployments require webhook mode. Health and hook settings come from explicit inputs or
generic secrets scoped to that GitHub Environment; branch-specific DEV/UAT/MAIN secret selection and
branch-based health defaults are skipped. The caller validates that the named environment is
protected and that `target-id` identifies the intended Render target. With all three identity inputs
omitted, the legacy branch and secret resolution path is retained.

Render serves the `backend` slot. It coexists with Vercel (`frontend`) and GCP Cloud Run
(`backend`, `frontend`, `standalone`) — the provider is chosen per deployment target, not globally.
