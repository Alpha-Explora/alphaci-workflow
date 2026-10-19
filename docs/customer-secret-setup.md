# Customer Secret Setup

The GitHub Actions secrets and variables that AlphaCI pipelines read in a customer repository. Set
them under **Repository Settings → Secrets and variables → Actions**.

Most of them are installed by AlphaCI when it provisions the repository or connects a deployment
target. The customer only sets the ones marked **Customer**.

## Generated pipelines (new projects)

These are the files described in [generated-project-contract.md](generated-project-contract.md).

### Always

| Name | Kind | Set by | Read by | Purpose |
| --- | --- | --- | --- | --- |
| `ALPHACI_TOKEN` | secret | AlphaCI | every stage, `release.yml`, `sign-release.yml`, `playwright-e2e.yml` | Per-repository token for the AlphaCI API. |
| `ALPHACI_REPORT_URL` | secret | AlphaCI | every stage's `report-results` job | Where stage results are posted. |
| `ALPHACI_API_URL` | secret | AlphaCI | `release.yml` | Base URL of the AlphaCI server. |

The access check calls `<AlphaCI base URL>/api/v1/ci/validate`. That address is written into the
generated file from the server's own base URL, so it needs no variable.

### Optional

| Name | Kind | Set by | Read by | Without it |
| --- | --- | --- | --- | --- |
| `SONAR_TOKEN`, `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY` | secrets | AlphaCI when the server has `ALPHACI_SONAR_TOKEN` and `ALPHACI_SONAR_ORGANIZATION`; otherwise **Customer** | `sonarcloud-scan.yml`, `sonarcloud-dotnet-scan.yml` | The SonarCloud job is skipped. AlphaCI does not overwrite Sonar secrets the repository already has. |
| `GH_PR_TOKEN` | secret | **Customer** | `promotion.yml`, `vercel-deploy.yml` | The pipeline uses `GITHUB_TOKEN`. Promotion pull requests are still opened, but GitHub does not start workflows for them, so their checks do not run. Use a fine-grained token with Contents and Pull requests read/write. |
| `API_USERNAME`, `API_PASSWORD`, `API_TOKEN` | secrets | **Customer** | `bruno-api-test.yml` | The Bruno collection runs without credentials. |

### Vercel targets

Installed by AlphaCI when a Vercel target is connected. `<SLOT>` is the target slot in upper case,
usually `FRONTEND`.

| Name | Kind | Read by |
| --- | --- | --- |
| `VERCEL_<SLOT>_TOKEN`, `VERCEL_<SLOT>_ORG_ID`, `VERCEL_<SLOT>_PROJECT_ID` | secrets | `vercel-deploy.yml` (passed as `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) |
| `VERCEL_<SLOT>_AUTOMATION_BYPASS_SECRET` | secret | `playwright-e2e.yml`, so tests can reach protected previews |
| `VERCEL_ALIAS` | variable | `vercel-deploy.yml` and the verify stage: the stable hostname each preview branch is aliased to |

### Render targets

Installed by AlphaCI when a Render target is connected. The Render API key stays on the AlphaCI
server; deploys go through AlphaCI.

| Name | Kind | Read by |
| --- | --- | --- |
| `RENDER_HEALTHCHECK_URL_<DEV\|UAT\|MAIN>` | secret | `render-deploy.yml`, to poll health after a deploy |
| `RENDER_HEALTHCHECK_URL_<UAT\|MAIN>` | variable (same value) | the verify stage, which cannot read secrets in `with:` |

`render-deploy.yml` in an environment pipeline also reads `RENDER_DEPLOY_HOOK_URL` from the GitHub
Environment. AlphaCI does not install it.

### Release signing

| Name | Kind | When |
| --- | --- | --- |
| `ALPHACI_RELEASE_SIGNING_KEY` | secret | Only when the server signs neither by file nor by Cloud KMS (lab hosts). AlphaCI copies it from `ONPREM_LAB_SIGNING_KEY_PATH`. |

Self-hosted AlphaCI uses `ALPHACI_RELEASE_SIGNER=file`: the server signs releases and no signing
secret or variable is needed in the repository.

## Customer templates (existing-repository setup)

Files rendered from `workflow-templates/customer/` read different names.

| Name | Kind | Set by | Read by |
| --- | --- | --- | --- |
| `CI_TOKEN` | secret | **Customer** | `validate-subscription.yml` (required) |
| `ALPHACI_VALIDATE_URL` | variable | **Customer** (self-hosted) | `validate-subscription.yml`. Defaults to `https://api.alphaci.com.ph/api/v1/ci/validate`; a self-hosted install must set it to `<AlphaCI base URL>/api/v1/ci/validate`. |
| `UAT_BASE_URL`, `UAT_HEALTHCHECK_URL`, `UAT_COMMAND`, `UAT_DEPLOY_COMMAND`, `REQUIRE_UAT_APPROVAL` | variables | **Customer** | the UAT stage of the `*-service-pipeline` templates |
| `REQUIRE_PRODUCTION_APPROVAL`, `PRODUCTION_STAGING_URL` | variables | **Customer** | `production-gate.yml` through the service pipelines |
| `EAS_BUILD_COMMAND` | variable | **Customer** | `expo-service-pipeline` |

The `be-*`, `fe-*` and `dotnet-service-pipeline` templates also deploy with `gcp-cloud-run-deploy.yml`
and read the `ALPHACI_GCP_*`, `ALPHACI_ARTIFACT_REGISTRY_REPOSITORY`, `ALPHACI_CLOUD_RUN_SERVICE`,
`ALPHACI_IMAGE_NAME`, `ALPHACI_RUNTIME_SERVICE_ACCOUNT`, `ALPHACI_DOCKERFILE_PATH`,
`ALPHACI_HEALTH_PATH` and `ALPHACI_DEPLOYMENT_TARGET_ID_<PREVIEW|UAT|PROD>` variables, plus the
`CI_TOKEN` and `CI_REPORT_URL` secrets. See [gcp-cloud-run-deploy.md](workflows/gcp-cloud-run-deploy.md).
