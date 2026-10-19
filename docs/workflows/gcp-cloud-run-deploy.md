# gcp-cloud-run-deploy.yml

Builds a Docker image, pushes it to Google Artifact Registry, deploys the digest to Cloud Run with no traffic, probes the tagged candidate revision and then moves all traffic to it. It authenticates with GitHub OIDC Workload Identity Federation only. Before building it asks AlphaCI to approve the deployment, and AlphaCI's answer overrides the GCP coordinates passed as inputs.

- Source: `.github/workflows/gcp-cloud-run-deploy.yml`
- Trigger: `workflow_call`
- Used by: the `deploy-gcp` job in customer templates `be-nestjs.yml`, `be-nodejs.yml`, `fe-nextjs.yml`, `fe-react.yml` and `dotnet-service-pipeline.yml`. The AlphaCI staged pipeline generator does not emit it.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | yes | | Name for logs and labels. |
| `working-directory` | string | no | `.` | Project directory. All steps run here. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |
| `source-branch` | string | no | `""` | Source branch. Empty uses `github.ref_name`. |
| `environment` | string | no | `preview` | `preview`, `uat` or `prod`. |
| `gcp-project-id` | string | yes | | GCP project ID. Replaced by AlphaCI's approval response. |
| `gcp-region` | string | yes | | Cloud Run region. Replaced by AlphaCI's approval response. |
| `workload-identity-provider` | string | yes | | Workload Identity provider resource name. AlphaCI's approval response takes precedence. |
| `deployer-service-account` | string | yes | | Service account impersonated through WIF. AlphaCI's approval response takes precedence. |
| `artifact-registry-repository` | string | yes | | Artifact Registry repository. Replaced by AlphaCI's approval response. |
| `image-name` | string | yes | | Image name. Replaced by AlphaCI's approval response. |
| `cloud-run-service-name` | string | yes | | Cloud Run service. Replaced by AlphaCI's approval response. |
| `runtime-service-account` | string | yes | | Runtime identity of the service. Replaced by AlphaCI's approval response. |
| `deployment-target-id` | string | no | `""` | AlphaCI deployment target ID. Falls back to the `ALPHACI_DEPLOYMENT_TARGET_ID` secret. |
| `docker-context` | string | no | `.` | Build context, relative to `working-directory`. |
| `dockerfile-path` | string | no | `Dockerfile` | Dockerfile, relative to `working-directory`. |
| `health-path` | string | no | `/` | Path probed on the candidate. Must start with `/`. |
| `correlation-id` | string | no | `""` | ID used in labels. Empty uses `gha-<run_id>-<run_attempt>`. |
| `workflow-release` | string | no | `v1` | Central workflow release sent to AlphaCI for approval. |
| `estimated-runtime-credits` | number | no | `1` | Runtime credit units reserved for this deployment. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `CI_TOKEN` | no (declared) | Bearer token for the AlphaCI approval and report calls. The job fails without it. |
| `CI_REPORT_URL` | no (declared) | AlphaCI report URL ending in `/api/v1/ci/report`. The control-plane base is derived from it. The job fails without it. |
| `ALPHACI_DEPLOYMENT_TARGET_ID` | no | Fallback for `deployment-target-id`. |

## Outputs

| Output | Description |
| --- | --- |
| `service-url` | Cloud Run service URL. |
| `image-uri` | Pushed image URI with tag `<branch>-<github.sha>`. |
| `image-digest` | Digest of the pushed image. |
| `revision-name` | Revision that received traffic. |
| `deployment-status` | `healthy` once the probe passed. |
| `correlation-id` | Sanitized correlation ID. |

## Permissions

Workflow: `contents: read`, `id-token: write`. The calling job must grant `id-token: write`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `gcp-cloud-run-deploy` | Always | Validates inputs, requests approval from AlphaCI, authenticates to GCP, checks APIs and resources, builds, pushes, resolves the digest, binds runtime secrets, deploys without traffic, waits for readiness, probes the candidate, moves traffic and reports the result to AlphaCI. Timeout 30 minutes. |

## Example

The `deploy-gcp` job from `workflow-templates/customer/be-nestjs.yml`:

```yaml
jobs:
  deploy-gcp:
    needs: [validate-access, unit-tests, lint, security]
    if: ${{ github.event_name == 'push' && (github.ref_name == 'dev' || github.ref_name == 'uat' || github.ref_name == 'main') }}
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/gcp-cloud-run-deploy.yml@v1
    with:
      system-name: ${{ inputs.service_name || 'backend' }}
      working-directory: ${{ inputs.service_path || '.' }}
      checkout-ref: ${{ github.sha }}
      source-branch: ${{ github.ref_name }}
      environment: ${{ github.ref_name == 'main' && 'prod' || github.ref_name == 'uat' && 'uat' || 'preview' }}
      gcp-project-id: ${{ vars.ALPHACI_GCP_PROJECT_ID }}
      gcp-region: ${{ vars.ALPHACI_GCP_REGION || 'asia-southeast1' }}
      workload-identity-provider: ${{ vars.ALPHACI_GCP_WORKLOAD_IDENTITY_PROVIDER }}
      deployer-service-account: ${{ vars.ALPHACI_GCP_DEPLOYER_SERVICE_ACCOUNT }}
      artifact-registry-repository: ${{ vars.ALPHACI_ARTIFACT_REGISTRY_REPOSITORY }}
      image-name: ${{ vars.ALPHACI_IMAGE_NAME || inputs.service_name || 'backend' }}
      cloud-run-service-name: ${{ vars.ALPHACI_CLOUD_RUN_SERVICE }}
      runtime-service-account: ${{ vars.ALPHACI_RUNTIME_SERVICE_ACCOUNT }}
      deployment-target-id: ${{ github.ref_name == 'main' && vars.ALPHACI_DEPLOYMENT_TARGET_ID_PROD || github.ref_name == 'uat' && vars.ALPHACI_DEPLOYMENT_TARGET_ID_UAT || vars.ALPHACI_DEPLOYMENT_TARGET_ID_PREVIEW }}
      docker-context: ${{ inputs.service_path || '.' }}
      dockerfile-path: ${{ vars.ALPHACI_DOCKERFILE_PATH || 'Dockerfile' }}
      health-path: ${{ vars.ALPHACI_HEALTH_PATH || '/health' }}
      correlation-id: ${{ github.run_id }}-${{ github.run_attempt }}
    secrets: inherit
```

## Notes

- Branch and environment must be one of `dev`→`preview`, `uat`→`uat`, `main`→`prod`. Anything else fails before the build.
- Approval: `POST <base>/api/v1/runtime-deployments/workflow/approve` with `{deploymentTargetId, repositoryFullName, ref, commitSha, workflowRelease, estimatedRuntimeCredits, idempotencyKey}`. The response supplies `deploymentId`, `gcpProjectId`, the WIF provider and deployer, region, repository, image name, service name and runtime service account. These replace the inputs for the rest of the job.
- Required APIs: `run`, `artifactregistry`, `iamcredentials` and `secretmanager`. The Artifact Registry repository and runtime service account must exist.
- Runtime secrets: Secret Manager metadata is listed for secrets named `alphaci-<service>-` (plus `<environment>-` outside `prod`) and labelled `environment=<environment>`. They are bound as `KEY=<secret>:latest`. Bindings with that prefix that no longer exist are removed. Secret values never enter the workflow.
- Deploy uses `--no-allow-unauthenticated`, `--no-traffic` and tag `alphaci-<run_id>-<run_attempt>`, with labels `alphaci_managed`, `alphaci_system`, `alphaci_environment`, `alphaci_correlation`, `alphaci_commit`.
- The probe calls the candidate URL plus `health-path` with an identity token minted by impersonating the deployer. A failed probe leaves traffic unchanged.
- The result is reported to `<base>/api/v1/runtime-deployments/workflow/report` whenever approval returned a deployment ID. A failed report is a warning.
- `scripts/validate-gcp-cloud-run-workflow.cjs` checks this workflow and the template callers.
- The templates pass `secrets: inherit`, but AlphaCI installs `ALPHACI_TOKEN` and `ALPHACI_REPORT_URL`, not `CI_TOKEN` and `CI_REPORT_URL`. The templates also pass `service_path` as both `working-directory` and `docker-context`, so the build context resolves to `<service_path>/<service_path>` for any value other than `.`.
