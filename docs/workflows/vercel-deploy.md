# vercel-deploy.yml

## Role
Deployment.

## Purpose
Deploys a frontend to Vercel, as a preview for UAT branches or as a production promotion for `main`.

## Public Contract
- Source workflow: `.github/workflows/vercel-deploy.yml`
- Inputs: `system-name`, `working-directory`, `environment`, `branch-alias`, `checkout-ref`, `git-branch`, `environment-id`, `environment-name`, `target-id`
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `GH_PR_TOKEN`
- Outputs: `deployment_url`, `deployment_id`

## Usage
Emitted by the Vercel workflow fragment for projects whose frontend slot targets Vercel. `environment`
is `production` on `main` and `preview` elsewhere. `GH_PR_TOKEN` falls back to `github.token` when not
supplied.

`git-branch` names the branch a preview deploy is for, so `vercel pull` includes the preview
Environment Variables scoped to that branch — the platform writes each branch's API URL there. It is
optional: a caller that omits it pulls only the branch-independent preview variables, as before.

Targeted callers supply `environment-id`, `environment-name`, and `target-id` together and pass
`checkout-ref` as the full pinned commit SHA. The reusable job uses the supplied GitHub Environment
name and records the environment and target IDs as Vercel deployment metadata. It does not clean up
deployments by branch in targeted mode. If `git-branch` is supplied for a preview deploy, its
branch-scoped variables are still pulled in targeted mode. A targeted deploy fails if Vercel's
deployment ID cannot be resolved; the ID is required for the target record and remains distinct from
a container image digest. Untargeted deploys retain the legacy behavior of warning and returning an
empty ID when lookup fails. The caller validates and protects the named environment and confirms the
target before invoking this workflow. With the three identity inputs omitted, existing environment
and branch behavior remains.

Vercel serves the `frontend` slot. It coexists with Render (`backend`) and GCP Cloud Run
(`backend`, `frontend`, `standalone`) — the provider is chosen per deployment target, not globally.
