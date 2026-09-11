# Workflow Catalog

`Alpha-Explora/alphaci-workflow` is the central workflow source of truth.

The repository has three logical layers:

- Product reusable workflows and actions remain flat under `.github/workflows/`
  and `.github/actions/` because that is what GitHub loads.
- Customer caller templates and catalog metadata live under
  `workflow-templates/customer/`.
- Product-specific callers are reserved for `workflow-templates/product/`.
- Retired provider examples live under `workflow-templates/legacy/` and are
  not selectable for new projects.

The platform catalog is composed as:

```text
repoShape -> projectTypeId -> workflowRecipeId -> options
```

Customer catalog files live under `catalog/customer/`:

- `project-types.json` describes supported project types and starter paths.
- `starter-kits.json` describes external starter repositories.
- `workflow-recipes.json` maps project types and recipes to customer templates.

## Reusable workflows

| Workflow | Role | Purpose |
| --- | --- | --- |
| [validate-subscription.yml](validate-subscription.md) | access gate | Validate CI subscription access before paid workflow execution. |
| [lint-check.yml](lint-check.md) | quality | Run lint and optional format checks. |
| [frontend-tests.yml](frontend-tests.md) | quality | Run frontend unit tests with coverage. |
| [backend-tests.yml](backend-tests.md) | quality | Run backend unit and optional integration tests with coverage. |
| [dotnet-test.yml](dotnet-test.md) | quality | Build and test a .NET solution, merging per-project coverage before the gate. |
| [dotnet-analyze.yml](dotnet-analyze.md) | quality | Build a .NET solution with analyzers enabled and warnings escalated. |
| [dotnet-format.yml](dotnet-format.md) | quality | Verify C# formatting and style with dotnet format. |
| [dotnet-audit.yml](dotnet-audit.md) | security | Audit NuGet dependencies against known advisories. |
| [sonarcloud-dotnet-scan.yml](sonarcloud-dotnet-scan.md) | quality | Analyse C# with SonarScanner for .NET. |
| [gitleaks-scan.yml](gitleaks-scan.md) | security | Scan for committed secrets with Gitleaks, redacted. |
| [dotnet-license-scan.yml](dotnet-license-scan.md) | governance | Inventory NuGet licences and fail on forbidden terms. |
| [dotnet-sbom.yml](dotnet-sbom.md) | governance | Export a CycloneDX SBOM as the release record. |
| [bruno-api-test.yml](bruno-api-test.md) | verify | Exercise a deployed API with a Bruno collection and fail a run that asserted nothing. |
| [schemathesis-scan.yml](schemathesis-scan.md) | verify | Generate contract tests from the OpenAPI document and fail a run that exercised nothing. |
| [mobile-tests.yml](mobile-tests.md) | quality | Run mobile unit tests with coverage. |
| [security-scan.yml](security-scan.md) | security | Run dependency and source security scans. |
| [docker-build.yml](docker-build.md) | build | Build, optionally push, and scan Docker images. |
| [gcp-cloud-run-deploy.yml](gcp-cloud-run-deploy.md) | deploy | Build, push, deploy, and probe a GCP Cloud Run service through WIF. |
| [workflow-validation.yml](workflow-validation.md) | maintenance | Validate workflow shape, contracts, catalogs, and templates. |

## Customer templates

Use the paired YAML and `.properties.json` files under
`workflow-templates/customer/`. Generated callers must pin central references
to `Alpha-Explora/alphaci-workflow/...@v1`; they must not use the retired
`v0.1.7-smoke` tag or any legacy organization path.

The backend packages this customer catalog and template directory into its
production image. Local development mounts the sibling central workflow
checkout. Neither mode fetches workflow definitions during project creation.

## Rules

- Keep GitHub Actions runtime workflows flat under `.github/workflows/`.
- Keep `validate-access` first in customer caller workflows.
- Keep job ordering explicit with `needs`.
- Keep quality, typecheck, tests, coverage, security, and CodeQL gates required;
  only credential-dependent deployment hooks may be optional.
- Do not add one template per option combination. Add catalog options and let
  the backend render the selected recipe.
