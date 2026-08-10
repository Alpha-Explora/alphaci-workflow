# Granular Workflow Templates

These templates are the customer-facing entrypoints for new repositories.

The central repository is organized into three logical areas:

- `workflow-templates/customer/` contains caller templates and their catalog metadata for generated customer repositories.
- `workflow-templates/product/` is reserved for AlphaCI product-specific caller templates.
- `workflow-templates/legacy/` contains retired provider-specific examples kept only for historical migration reference.

GitHub Actions runtime workflows remain flat under `.github/workflows/`; GitHub does not load reusable workflows from subdirectories.

- Copy the closest `*.yml` file into `.github/workflows/` in the consumer repo.
- Keep ordering in the copied workflow with `needs`.
- Call central reusable workflows directly from `Alpha-Explora/alphaci-workflow/.github/workflows/*.yml@v1`.
- Every template starts with `validate-access`, then deploys successful pushes from `test`, `uat`, and `main` through `gcp-cloud-run-deploy.yml` using repository variables and Workload Identity Federation.
- Every `validate-access` job passes `validation-api-url` from `env.CI_VALIDATE_URL` so generated workflows can target the deployed backend or MVP tunnel.
- Do not use old long-pipeline caller files for new granular workflows.
- Keep runtime and action versions current. Default Node.js to the current Active LTS release, and update reusable workflow action pins when new stable major versions are released.

Each workflow template has a paired `*.properties.json` file for catalog metadata.

The platform catalog should choose templates through a composed model:

```text
repoShape -> projectTypeId -> workflowRecipeId -> options
```

Workflow templates are renderable recipe targets, not one-off files for every
possible option combination. Project types and workflow recipes should declare
which options they support, and the backend should remove or configure optional
jobs while keeping `validate-access` first.

## GCP Deployment Variables

Generated repositories must receive these repository variables before deploy-gcp can run:

- `ALPHACI_GCP_PROJECT_ID`
- `ALPHACI_GCP_REGION`
- `ALPHACI_GCP_WORKLOAD_IDENTITY_PROVIDER`
- `ALPHACI_GCP_DEPLOYER_SERVICE_ACCOUNT`
- `ALPHACI_ARTIFACT_REGISTRY_REPOSITORY`
- `ALPHACI_CLOUD_RUN_SERVICE`
- `ALPHACI_RUNTIME_SERVICE_ACCOUNT`
- `ALPHACI_IMAGE_NAME`

Do not add GOOGLE_APPLICATION_CREDENTIALS, service account JSON, VERCEL_TOKEN, or RENDER_API_KEY to generated deployment workflows.
