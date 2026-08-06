# Customer Secret Setup

The MVP records required external secrets as setup checklist items. It should not store customer provider secrets directly.

## GitHub Actions Secrets

Customers add secrets in:

```text
Repository Settings -> Secrets and variables -> Actions -> New repository secret
```

## Current Secrets (GCP Cloud Run)

GCP Cloud Run deploys authenticate through Workload Identity Federation, not stored secrets.
Repository coordinates are written as variables by AlphaCI itself (see Variables below); no
provider secret is required for deploy.

### Auto-promotion

- `GH_PR_TOKEN`: token used by promotion workflows to open or update pull requests.

### Grafana k6

- `K6_CLOUD_TOKEN`
- `K6_CLOUD_PROJECT_ID`

## Legacy Provider Secrets

These remain documented while the GCP migration is in progress, but new managed deployment
targets should move to the GCP workflow path. See `docs/workflows/README.md` for the same
legacy framing on the reusable workflow side.

### Vercel (legacy)

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Render (legacy)

- `RENDER_DEPLOY_HOOK_URL_TEST`
- `RENDER_DEPLOY_HOOK_URL_UAT`
- `RENDER_DEPLOY_HOOK_URL_MAIN`
- `RENDER_HEALTHCHECK_URL_TEST`
- `RENDER_HEALTHCHECK_URL_UAT`
- `RENDER_HEALTHCHECK_URL_MAIN`

## Variables

Repository variables are safe for non-secret setup values such as:

- `E2E_BASE_URL`
- `K6_BASE_URL`
- `REQUIRE_PRODUCTION_APPROVAL`

AlphaCI also writes GCP runtime coordinates as repository variables once a runtime target is
provisioned: `ALPHACI_GCP_PROJECT_ID`, `ALPHACI_GCP_REGION`,
`ALPHACI_GCP_WORKLOAD_IDENTITY_PROVIDER`, `ALPHACI_GCP_DEPLOYER_SERVICE_ACCOUNT`,
`ALPHACI_RUNTIME_SERVICE_ACCOUNT`, `ALPHACI_ARTIFACT_REGISTRY_REPOSITORY`,
`ALPHACI_IMAGE_NAME`, and `ALPHACI_CLOUD_RUN_SERVICE`. Customers do not set these manually.

The dashboard should link users directly to the generated repository's Actions secrets and variables pages.