# Generated Project Contract

What AlphaCI writes into a customer repository, and how those files depend on this repository.
The generator is `staged-workflow.builder.ts` in the AlphaCI backend; this page describes its
output.

## Branches

Every provisioned repository uses `dev` → `uat` → `main`. All three are protected and reached only
by pull request: feature branch to `dev`, then promotion to `uat` and `main`.

## Workflow files

Each stage is a separate workflow. A later stage starts on `workflow_run` when the earlier one
succeeded and actually ran work. Each stage runs a `validate-access` job and ends with a
`report-results` job that posts the outcome to AlphaCI.

### Branch pipeline (projects without environments)

| File | Stage | Calls |
| --- | --- | --- |
| `00-alphaci-access.yml` | Access check on push and pull request. | none (inline call to `/api/v1/ci/validate`) |
| `10-alphaci-quality.yml` | Branch policy, lint, tests, coverage, security, SonarCloud. | Node: `lint-check`, `security-scan`, `backend-tests` or `frontend-tests`, `sonarcloud-scan`. .NET: `dotnet-test`, `dotnet-format`, `dotnet-analyze`, `dotnet-audit`, `gitleaks-scan`, `dotnet-license-scan`, `dotnet-sbom`, `sonarcloud-dotnet-scan`. |
| `20-alphaci-package.yml` | Build, deploy per branch, production gate, promotion PR. | `docker-build`, `release` (Render), `vercel-deploy` (Vercel), `production-gate` (main), `promotion` |
| `30-alphaci-verify.yml` | Tests against the deployed app. Only written when the stack has API or UI checks and something is deployed. | `bruno-api-test`, `schemathesis-scan`, `playwright-e2e` |
| `05-alphaci-env-guard.yml` | Warns about and removes committed `.env` files. Not written for the frontend repository of a multi-repository project. | none |

### Environment pipeline (projects with environments)

| File | Stage | Calls |
| --- | --- | --- |
| `00-alphaci-access.yml` | As above. | none |
| `10-alphaci-quality.yml` | As above. | As above. |
| `20-alphaci-package.yml` | Build, register the release with AlphaCI, sign it, deploy to the first environment. | `docker-build`, `sign-release` (only when the runner signs; see below), `render-deploy`, `vercel-deploy` |
| `30-alphaci-promote.yml` | `workflow_dispatch` only. AlphaCI starts it to deploy a registered release to a later environment. | `render-deploy`, `vercel-deploy` |
| `05-alphaci-env-guard.yml` | As above. | none |

On-premises targets get no deploy job: the host pulls the signed release from AlphaCI.

### Release signing

- `ALPHACI_RELEASE_SIGNER=file` on the AlphaCI server (the self-hosted setting): AlphaCI signs the
  release itself. The package stage has no `sign-release` job and no signing secret reaches GitHub.
- Otherwise the package stage calls `sign-release.yml`, which signs with Cloud KMS (when the server
  has the KMS signer settings) or with the lab key in the `ALPHACI_RELEASE_SIGNING_KEY` secret.

## Rules for generated files

- Every `uses:` points at `Alpha-Explora/alphaci-workflow/.github/workflows/<name>.yml@<ref>`. The
  repository and ref come from the backend's `CENTRAL_WORKFLOW_REPO` and `CENTRAL_WORKFLOW_REF`
  (defaults `Alpha-Explora/alphaci-workflow` and `v1`). Never `@main`.
- Secrets are passed to reusable workflows by name. The exceptions are the environment pipeline's
  image and deploy jobs, which use `secrets: inherit`. Secrets cannot appear in a `with:` block, so values a later stage needs
  (such as health-check URLs) are repository variables.
- The secrets and variables the files read are listed in
  [customer-secret-setup.md](customer-secret-setup.md).

## Existing repositories

For a repository that already exists, AlphaCI opens a pull request from `alphaci/<service>-ci`
that adds one file rendered from a customer template in `workflow-templates/customer/` (for
example `nest-service-pipeline.yml`). It never pushes to `main` directly. See
[catalog-schema.md](catalog-schema.md#customer-templates).
