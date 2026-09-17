# Lego Architecture

## Purpose

This folder is the architecture source of truth for AlphaCI as a CI/CD platform. The model is intentionally split into three views so each audience sees the right amount of detail.

## Contents

| Order | Folder | Audience | Purpose |
| --- | --- | --- | --- |
| **01** | [01-top-view](01-top-view) | CPO, product and governance | What the platform does and why the five phases matter |
| **02** | [02-execution-view](02-execution-view) | Platform and DevOps teams | How catalog choices become callers, lanes, tools and one release decision |
| **03** | [03-implementation-view](03-implementation-view) | Workflow maintainers and engineers | Which YAML contracts, jobs, outputs and provider checks make it run |
| **04** | [04-reference](04-reference) | All audiences | Canonical v1 reference and supporting strategy material |

Each folder uses numbered filenames so the recommended reading order is visible in the Explorer.

## Contents by folder

### 01 — Top View

- [01-top-view.md](01-top-view/01-top-view.md) — executive lifecycle and five phases.
- [01-top-view.svg](01-top-view/01-top-view.svg) — presentation diagram.
- [02-cpo-strategy.md](01-top-view/02-cpo-strategy.md) — CPO decisions, value, ownership and rollout.

### 02 — Execution View

- [01-execution-view.md](02-execution-view/01-execution-view.md) — catalog-to-release composition.
- [01-execution-view.svg](02-execution-view/01-execution-view.svg) — execution diagram.
- [02-technical-architecture.md](02-execution-view/02-technical-architecture.md) — technical orchestration model.
- [02-technical-architecture.svg](02-execution-view/02-technical-architecture.svg) — technical composition diagram.
- [03-plug-and-play-strategy.md](02-execution-view/03-plug-and-play-strategy.md) — detailed switching and multi-stack strategy.

### 03 — Implementation View

- [01-implementation-view.md](03-implementation-view/01-implementation-view.md) — workflow contracts and controls.
- [01-implementation-view.svg](03-implementation-view/01-implementation-view.svg) — implementation diagram.

### 04 — Reference

- [01-cicd-architecture-v1.svg](04-reference/01-cicd-architecture-v1.svg) — original canonical v1 diagram.
- [02-cicd-architecture-reference.md](04-reference/02-cicd-architecture-reference.md) — expanded terminology and repository mapping.

## Reading order

1. Start with [01-top-view](01-top-view) for the platform promise and operating model.
2. Use [02-execution-view](02-execution-view) to understand plug-and-play composition.
3. Use [03-implementation-view](03-implementation-view) when changing workflows, catalog contracts or provider adapters.
4. Open [04-reference](04-reference) only when historical terminology or the original v1 reference is needed.

## Canonical platform boundary

```text
Consumer repository
  -> generated thin caller
  -> versioned reusable workflow
  -> profile and capability resolution
  -> five phases
  -> evidence and immutable artifact
  -> promotion gate
  -> provider deployment adapter
```

Catalog metadata selects compatible parts. Reusable workflows own execution and gates. Consumer repositories provide application commands, variables, secrets and environment approvals. A new tool or provider is not production-ready until it satisfies the same contract and validation path.

## Repository anchors

- Selection: `catalog/customer/`, `catalog/actions.json`, `catalog/plans.json`
- Generated callers: `workflow-templates/customer/`
- Workflow implementation: `.github/workflows/`
- Contract checks: `scripts/`, `docs/workflows/`
- Consumer contract: `docs/generated-project-contract.md`
- Active deployment path: `.github/workflows/gcp-cloud-run-deploy.yml`

## Documentation rule

Do not add another full architecture diagram for a single tool, framework or provider. Add detail to the appropriate layer and link to the lower layer. The top view stays stable; the execution view changes only when orchestration changes; the implementation view changes with workflow contracts.
