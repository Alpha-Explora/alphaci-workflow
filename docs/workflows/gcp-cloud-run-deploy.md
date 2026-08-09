# GCP Cloud Run Deploy Reusable Workflow

Builds a Docker image from the caller repository, pushes it to Google Artifact Registry, deploys the pushed digest to Cloud Run without traffic, probes the tagged candidate revision, and promotes it only after the health check passes.

This workflow is the GCP deployment path for AlphaCI-managed services. It uses
GitHub OIDC Workload Identity Federation only. Static GCP service account JSON
keys are not accepted.

AlphaCI's live product callers use `prod` for production. Validate the merged
architecture on `main`, manually review the promotion, then merge to `prod`.
Production callers must use explicit manual dispatch with a confirmation value;
the current GitHub plan cannot enforce branch protection, and `main` must not
deploy directly to the production project.

## Source Workflow

`.github/workflows/gcp-cloud-run-deploy.yml`

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `system-name` | yes | | Display name for logs and labels. |
| `working-directory` | no | `.` | Project directory. |
| `checkout-ref` | no | | Commit SHA or ref to checkout. |
| `source-branch` | no | | Source branch used for branch gating and image tags. Production accepts `prod` only. |
| `environment` | no | `dev` | AlphaCI environment: `dev`, `uat`, `prod`, or `preview`. |
| `gcp-project-id` | yes | | Target GCP project ID. |
| `gcp-region` | yes | | Target Cloud Run region. |
| `workload-identity-provider` | yes | | Full Workload Identity Provider resource name. |
| `deployer-service-account` | yes | | Service account impersonated by GitHub Actions through WIF. |
| `artifact-registry-repository` | yes | | Artifact Registry repository name. |
| `image-name` | yes | | Container image name. |
| `cloud-run-service-name` | yes | | Cloud Run service name. |
| `runtime-service-account` | yes | | Runtime identity attached to Cloud Run. |
| `docker-context` | no | `.` | Docker build context relative to `working-directory`. |
| `dockerfile-path` | no | `Dockerfile` | Dockerfile path relative to `working-directory`. |
| `health-path` | no | `/` | HTTP path probed after deployment. Must start with `/`; prefer app-owned paths such as `/health`. |
| `correlation-id` | no | generated | Caller-provided ID used for deployment history and labels. |
| `allow-preview` | no | `false` | Allows explicit `environment=preview` deployments. |

## Outputs

| Output | Description |
| --- | --- |
| `service-url` | Cloud Run service URL. |
| `image-uri` | Artifact Registry image URI with branch/SHA tag. |
| `image-digest` | Resolved Artifact Registry image digest. |
| `revision-name` | Candidate revision promoted after the health probe. |
| `deployment-status` | `healthy` only after deploy and health probe both pass. |
| `correlation-id` | Correlation ID used by this run. |

## Required Permissions

The caller and reusable workflow must allow:

```yaml
permissions:
  contents: read
  id-token: write
```

The workflow fails before GCP authentication if the OIDC token environment is unavailable.

## WIF Assumptions

- `workload-identity-provider` is a GitHub OIDC provider allowed to trust the caller repository/ref policy.
- `deployer-service-account` can be impersonated through WIF.
- The deployer can read the target project, check required APIs, push to the Artifact Registry repository, deploy Cloud Run, and act as only the approved runtime service account.
- The deployer or approved probe identity can mint an OIDC identity token and has Cloud Run Invoker access for the deployed service health probe.
- The runtime service account is the identity attached to the deployed Cloud Run revision.

No `GOOGLE_APPLICATION_CREDENTIALS`, service account key JSON, or credential-file secret is used.

## Branch Mapping

The workflow validates branch and environment together before building:

| Source branch | Environment | Result |
| --- | --- | --- |
| `test` | `dev` | Deploy allowed. |
| `uat` | `uat` | Deploy allowed. |
| `main` | `prod` | Generic reusable-workflow mapping; AlphaCI production callers use manually reviewed `prod`. |
| any branch | `preview` with `allow-preview=true` | Preview deploy allowed. |
| anything else | anything else | Fails before build. |

Feature branches do not create long-lived Cloud Run services by default.

## Backend Caller Example

```yaml
jobs:
  deploy-gcp-backend:
    needs: [build, production-gate]
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/gcp-cloud-run-deploy.yml@main
    permissions:
      contents: read
      id-token: write
    with:
      system-name: backend
      working-directory: backend
      checkout-ref: ${{ github.event.workflow_run.head_sha || github.sha }}
      source-branch: ${{ github.event.workflow_run.head_branch || github.ref_name }}
      environment: ${{ (github.event.workflow_run.head_branch || github.ref_name) == 'main' && 'prod' || (github.event.workflow_run.head_branch || github.ref_name) == 'uat' && 'uat' || 'dev' }}
      gcp-project-id: alphaci-20260629
      gcp-region: asia-southeast1
      workload-identity-provider: projects/123/locations/global/workloadIdentityPools/github/providers/github
      deployer-service-account: alphaci-deployer@alphaci-runtime.iam.gserviceaccount.com
      runtime-service-account: orders-api-runtime@alphaci-runtime.iam.gserviceaccount.com
      artifact-registry-repository: alphaci
      image-name: edge-gateway
      cloud-run-service-name: edge-gateway
      docker-context: .
      dockerfile-path: Dockerfile
      health-path: /health
```

## Frontend Caller Example

```yaml
jobs:
  deploy-gcp-frontend:
    needs: [build, production-gate]
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/gcp-cloud-run-deploy.yml@main
    permissions:
      contents: read
      id-token: write
    with:
      system-name: frontend
      working-directory: web
      checkout-ref: ${{ github.event.workflow_run.head_sha || github.sha }}
      source-branch: ${{ github.event.workflow_run.head_branch || github.ref_name }}
      environment: ${{ (github.event.workflow_run.head_branch || github.ref_name) == 'main' && 'prod' || (github.event.workflow_run.head_branch || github.ref_name) == 'uat' && 'uat' || 'dev' }}
      gcp-project-id: alphaci-20260629
      gcp-region: asia-southeast1
      workload-identity-provider: projects/123/locations/global/workloadIdentityPools/github/providers/github
      deployer-service-account: alphaci-deployer@alphaci-runtime.iam.gserviceaccount.com
      runtime-service-account: orders-web-runtime@alphaci-runtime.iam.gserviceaccount.com
      artifact-registry-repository: alphaci
      image-name: alphaci-fe
      cloud-run-service-name: alphaci-fe
      docker-context: .
      dockerfile-path: Dockerfile
      health-path: /
```

## Runtime Secrets

This workflow does not accept raw secret values. AlphaCI resolves the shared
`INTERNAL_JWT_SECRET` environment variable to the Secret Manager secret
`alphaci-internal-jwt` before deployment and grants accessor access to the
service runtime identities. Callers must never pass secret values through
inputs, environment dumps, or logs.

## Health Probe

The deploy command uses `--no-allow-unauthenticated` and `--no-traffic`, assigning a run-specific candidate tag. The health probe obtains an identity token with:

```bash
gcloud auth print-identity-token --audiences="<service-url>"
```

Then it calls the tagged candidate URL plus `health-path` with an `Authorization: Bearer` header. A failed probe leaves the previous traffic assignment unchanged and fails the workflow. A successful probe runs `gcloud run services update-traffic --to-revisions REVISION=100`.

## Known Failures

| Message | Meaning | Fix |
| --- | --- | --- |
| Missing GitHub OIDC token permission | Caller or reusable workflow does not grant `id-token: write`. | Add `permissions.id-token: write`. |
| Unsupported branch/environment mapping | Caller tried to deploy an unmapped long-lived branch/environment. | Use `test/dev`, `uat/uat`, `main/prod`, or explicit preview. |
| health-path must start with `/` | Caller passed a relative path without a leading slash. | Use `/` or a path such as `/health`. |
| Required API is not enabled | Target GCP project is missing a required API. | Enable Cloud Run, Artifact Registry, or IAM Credentials in bootstrap. |
| Unable to resolve pushed image digest | Artifact Registry did not return a digest for the pushed tag. | Check repository permissions and push result. |
| Cloud Run service URL or latest ready revision is missing | Deploy did not produce a ready service revision. | Inspect Cloud Run revision logs. |

## Contract Test

Run this from the repository root:

```bash
node scripts/validate-gcp-cloud-run-workflow.cjs
```

The contract test checks required inputs, WIF permissions, preflight checks, digest deployment, branch/preview gates, private health probing, safe outputs, generated caller-template deploy jobs, repository-variable wiring, and forbidden static-key or legacy-provider patterns.
