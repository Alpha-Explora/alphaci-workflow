# Microservice Stack Workflows

This workflow set is designed as a reusable library for service-by-service CI/CD instead of a monolithic pipeline.

## AlphaCI production contract

AlphaCI's backend is the reference seven-service consumer of this model. Its
active deployment workflows live in `Alpha-Explora/alphaci-be`:

- `deploy-edge-gateway.yml`
- `deploy-identity-workspace.yml`
- `deploy-project-management.yml`
- `deploy-pipeline-gateway.yml`
- `deploy-customer-runtime.yml`
- `deploy-billing-subscriptions.yml`
- `deploy-platform-ops.yml`

Each workflow builds `Dockerfile.service`, pushes an immutable image to the
`alphaci-20260629` Artifact Registry repository, deploys a Cloud Run candidate
on port `8080` without traffic, and verifies readiness without changing stable
traffic. `edge-gateway` is the public load-balancer entry; the other
six services are private and are invoked by its service account. The retired
root `alphaci-be` Cloud Run image/workflow is rollback-only and is not a normal
deployment target.

For this product, `main` is the pre-merge validation line. Production callers
run from `prod`; the live GitHub OIDC provider rejects `main` for production
authentication. The current GitHub plan cannot enforce branch protection, so
automatic production push triggers are disabled. Use manual review, merge only
after the main checks and smoke gates pass, then manually dispatch each
production workflow with its confirmation value.

## User-facing onboarding layer

- `workflow-templates/`
  - Stack-specific GitHub workflow templates that generate caller workflows in consuming repositories.
- `.github/actions/discover-service`
  - Discovery action used by the templates to identify the service folder and infer safe command defaults.

See [stack-onboarding-templates.md](stack-onboarding-templates.md) for the intended product flow.

## Included stack workflows

- `service-node.yml`
  - Generic Node.js service workflow with lint, typecheck, unit, integration, contract, optional e2e, build, UAT command, and production gate support.
- `service-nestjs.yml`
  - NestJS-focused API workflow with Jest/Supertest-friendly defaults and optional UAT deployment and validation commands.
- `service-react.yml`
  - React web workflow with component tests, build, Playwright UAT, local k6 checks, and production gate support.
- `service-nextjs.yml`
  - Next.js web workflow with `.next/cache` build caching, Playwright UAT, local k6 checks, and production gate support.
- `service-react-native.yml`
  - React Native workflow that reuses the mobile build and Maestro test flows already present in the repo.
- `service-expo.yml`
  - Expo workflow that reuses the existing mobile build and Maestro flows and adds an optional EAS build stage.

## Shared reusable building blocks

- `reusable-javascript-quality.yml`
  - Common JavaScript/TypeScript quality gates for linting, typechecking, unit tests, integration tests, component tests, contract tests, e2e tests, dependency audit, license checks, build artifacts, and optional provenance attestations.
- `reusable-service-uat.yml`
  - Generic UAT gate for services that validate with a command, a healthcheck URL, or both.
- `reusable-web-uat.yml`
  - Web UAT flow with optional approval, optional deploy command, endpoint readiness check, Playwright UAT, and local k6 execution.

## Why this structure

- Reusable workflows are the right abstraction for this repo. GitHub documents that reusable workflows avoid duplication, are easier to maintain, and can be centrally maintained across consumers.
- Path-aware caller workflows remain the responsibility of the consuming repo. GitHub's workflow syntax documents `paths` and `paths-ignore` as the correct way to scope workflows to changed areas in service repos.
- UAT and production approvals are modeled with GitHub environments because environments support deployment protection rules and required reviewers.
- Web UAT is centered on Playwright because Playwright documents first-class GitHub Actions CI support and recommends predictable CI execution.
- Next.js uses a dedicated build cache because Next.js documents `.next/cache` as the CI cache to persist between builds.
- NestJS defaults include unit and end-to-end tests because Nest documents both as first-class testing modes.
- React Native mobile validation emphasizes E2E coverage for critical flows because the React Native testing guide recommends E2E tests for user-critical journeys and explicitly mentions Maestro as a valid option.
- Expo supports optional EAS builds because Expo documents CI-triggered EAS builds as the standard path for hosted mobile builds.

## Official references

- GitHub reusable workflows: https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations
- GitHub workflow syntax and path filters: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- GitHub environments and approvals: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- GitHub reviewing deployments: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments
- GitHub artifact attestations: https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations
- `actions/setup-node`: https://github.com/actions/setup-node
- Next.js deployment options: https://nextjs.org/docs/app/getting-started/deploying
- Next.js CI cache guidance: https://nextjs.org/docs/pages/guides/ci-build-caching
- NestJS testing: https://docs.nestjs.com/fundamentals/testing
- React Native testing overview: https://reactnative.dev/docs/testing-overview
- Playwright CI guide: https://playwright.dev/docs/ci
- Expo CI-triggered builds: https://docs.expo.dev/build/building-on-ci/
