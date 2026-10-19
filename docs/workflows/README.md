# Workflow Catalog

Every reusable workflow in `.github/workflows/` has a contract doc in this folder with the same name.
Each `.yml` starts with a `# Contract: docs/workflows/<name>.md` comment pointing here.
`workflow-validation.yml` fails a pull request when either is missing.

Callers reference workflows as
`Alpha-Explora/alphaci-workflow/.github/workflows/<name>.yml@v1`.

## Who calls what

AlphaCI calls these workflows in two ways:

- **Staged generator** (new projects and regenerated pipelines). The backend
  (`staged-workflow.builder.ts` and the provider fragments) writes `00-alphaci-access.yml`,
  `10-alphaci-quality.yml`, `20-alphaci-package.yml`, `30-alphaci-verify.yml`, and for projects with
  environments `05-alphaci-env-guard.yml` and `30-alphaci-promote.yml`. These files call the
  workflows marked **generator** below.
- **Customer templates** (`workflow-templates/customer/*.yml`). The backend renders one of these
  for the existing-repository setup pull request and for the catalog "generate" API. They call the
  workflows marked **template**.

Workflows marked **internal** are only called by other workflows in this repository.
**Maintenance** workflows run on this repository itself.

## Reusable workflows

| Workflow | Called by | Purpose |
| --- | --- | --- |
| [lint-check.yml](lint-check.md) | generator, template, internal | Lint and optional format check for Node projects. |
| [security-scan.yml](security-scan.md) | generator, template, internal | npm audit and licence check. |
| [backend-tests.yml](backend-tests.md) | generator, template | Backend unit and optional integration tests with a coverage gate. |
| [frontend-tests.yml](frontend-tests.md) | generator, template | Frontend unit tests with a coverage gate. |
| [sonarcloud-scan.yml](sonarcloud-scan.md) | generator | SonarCloud analysis for Node projects. |
| [dotnet-test.yml](dotnet-test.md) | generator, template | Build and test a .NET solution with merged coverage. |
| [dotnet-format.yml](dotnet-format.md) | generator, template | `dotnet format --verify-no-changes`. |
| [dotnet-analyze.yml](dotnet-analyze.md) | generator, template | Build with analyzers; warnings as errors on uat and main. |
| [dotnet-audit.yml](dotnet-audit.md) | generator, template | NuGet vulnerability audit. |
| [dotnet-license-scan.yml](dotnet-license-scan.md) | generator | NuGet licence inventory; fails on forbidden licences. |
| [dotnet-sbom.yml](dotnet-sbom.md) | generator | CycloneDX SBOM export. |
| [gitleaks-scan.yml](gitleaks-scan.md) | generator | Redacted secret scan. |
| [sonarcloud-dotnet-scan.yml](sonarcloud-dotnet-scan.md) | generator | SonarCloud analysis with SonarScanner for .NET. |
| [docker-build.yml](docker-build.md) | generator, template, internal | Build, optionally push to GHCR, and scan an image with Trivy. |
| [release.yml](release.md) | generator | Ask AlphaCI to release a built image (Render branch pipelines), then wait for it. |
| [render-deploy.yml](render-deploy.md) | generator | Deploy a pinned image to a Render environment and check health. |
| [vercel-deploy.yml](vercel-deploy.md) | generator | Build and deploy a pinned commit to Vercel. |
| [sign-release.yml](sign-release.md) | generator | Sign a registered release manifest in the runner. Not emitted when AlphaCI signs releases itself (`ALPHACI_RELEASE_SIGNER=file`). |
| [production-gate.yml](production-gate.md) | generator, internal | Production approval gate on `main`. |
| [promotion.yml](promotion.md) | generator | Open or update the promotion pull request (dev to uat, uat to main). |
| [bruno-api-test.yml](bruno-api-test.md) | generator | Run a Bruno collection against a deployed API. |
| [schemathesis-scan.yml](schemathesis-scan.md) | generator | OpenAPI contract tests with Schemathesis. |
| [playwright-e2e.yml](playwright-e2e.md) | generator, internal | Playwright browser tests, live progress and visual baselines. |
| [validate-subscription.yml](validate-subscription.md) | template | Check the CI token with AlphaCI before the pipeline runs. |
| [gcp-cloud-run-deploy.yml](gcp-cloud-run-deploy.md) | template | Build, push and deploy to Cloud Run through Workload Identity Federation. |
| [service-nextjs.yml](service-nextjs.md) | template | Next.js service pipeline. |
| [service-react.yml](service-react.md) | template | React service pipeline. |
| [service-nestjs.yml](service-nestjs.md) | template | NestJS service pipeline. |
| [service-node.yml](service-node.md) | template | Node.js service pipeline. |
| [service-react-native.yml](service-react-native.md) | template | React Native service pipeline. |
| [service-expo.yml](service-expo.md) | template | Expo service pipeline. |
| [reusable-javascript-quality.yml](reusable-javascript-quality.md) | internal | Shared quality stage of the JavaScript service pipelines. |
| [reusable-service-uat.yml](reusable-service-uat.md) | internal | UAT deploy and checks for API services. |
| [reusable-web-uat.yml](reusable-web-uat.md) | internal | UAT deploy, Playwright and k6 for web services. |
| [mobile-workflow.yml](mobile-workflow.md) | internal | Expo mobile pipeline. |
| [mobile-react-native.yml](mobile-react-native.md) | internal | React Native mobile pipeline. |
| [mobile-tests.yml](mobile-tests.md) | internal | Mobile unit tests with coverage. |
| [mobile-gradle.yml](mobile-gradle.md) | internal | Android Gradle build. |
| [mobile-ios-build.yml](mobile-ios-build.md) | internal | iOS simulator build. |
| [mobile-maestro.yml](mobile-maestro.md) | internal | Maestro Android end-to-end tests. |
| [mobile-maestro-ios.yml](mobile-maestro-ios.md) | internal | Maestro iOS end-to-end tests. |
| [branch-policy.yml](branch-policy.md) | none | Branch policy outputs. The generator inlines its own branch-policy job instead. |
| [workflow-validation.yml](workflow-validation.md) | maintenance | Validates workflows, contract docs, catalog and templates. |
| [publish-v1-tag.yml](publish-v1-tag.md) | maintenance | Moves the `v1` tag to `main` after validation. |
| [publish-internal-v1-tag.yml](publish-internal-v1-tag.md) | maintenance | Moves the `internal-v1` tag to `refactor-internal` after validation. |

## Composite actions

| Action | Purpose |
| --- | --- |
| [coverage-gate](../actions/coverage-gate.md) | Read a coverage report in one of four formats and enforce a threshold. |
| [discover-service](../actions/discover-service.md) | Find the service folder and its commands for the customer templates. |

## Rules for changing workflows

- Keep workflows flat under `.github/workflows/`. GitHub does not load reusable workflows from
  subfolders.
- Update the contract doc in the same pull request as the `.yml`.
- `v1` callers do not change their pins, so keep inputs, outputs and secrets backward compatible.
  New inputs need safe defaults. See [workflow-release-policy.md](../workflow-release-policy.md).
- Do not rename or delete a workflow the generator references. `workflow-validation.yml` checks the
  list in its `validate-backend-contract` job.
- Keep `validate-access` the first job in every customer template.
- Order jobs in callers with `needs`; a reusable workflow does not call lint, deploy or promotion
  on its own unless its doc says so.
