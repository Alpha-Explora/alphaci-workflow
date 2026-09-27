# vercel-deploy.yml

## Role
Deployment.

## Purpose
Deploys a frontend to Vercel, as a preview for UAT branches or as a production promotion for `main`.

## Public Contract
- Source workflow: `.github/workflows/vercel-deploy.yml`
- Inputs: `system-name`, `working-directory`, `environment`, `branch-alias`, `checkout-ref`, `git-branch`
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `GH_PR_TOKEN`
- Outputs: `deployment_url`, `deployment_id`

## Usage
Emitted by the Vercel workflow fragment for projects whose frontend slot targets Vercel. `environment`
is `production` on `main` and `preview` elsewhere. `GH_PR_TOKEN` falls back to `github.token` when not
supplied.

`git-branch` names the branch a preview deploy is for, so `vercel pull` includes the preview
Environment Variables scoped to that branch — the platform writes each branch's API URL there. It is
optional: a caller that omits it pulls only the branch-independent preview variables, as before.

`branch-alias` and the cleanup of older previews use `vercel alias` and `vercel remove`, which are
account-level commands. When `VERCEL_ORG_ID` is a team id (`team_…`) they run with `--scope` set to
it; without that they ran against the token owner's personal account, and a team project's alias
was refused, leaving the stable UAT hostname (`uat-<alias>.vercel.app`) unset.

Vercel serves the `frontend` slot. It coexists with Render (`backend`) and GCP Cloud Run
(`backend`, `frontend`, `standalone`) — the provider is chosen per deployment target, not globally.
