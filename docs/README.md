# alphaci-workflow docs

`Alpha-Explora/alphaci-workflow` holds the reusable GitHub Actions workflows that AlphaCI-generated
pipelines call, plus the catalog and templates the AlphaCI backend reads when it generates them.

Customers run AlphaCI on their own server and keep github.com, GitHub-hosted runners, GHCR and
SonarCloud. Their repositories call these workflows at
`Alpha-Explora/alphaci-workflow/.github/workflows/<name>.yml@v1`.

## Repository layout

| Path | What it is | Used by |
| --- | --- | --- |
| `.github/workflows/` | Reusable workflows, one contract doc each in [workflows/](workflows/README.md). | Generated pipelines, customer templates |
| `.github/actions/` | Composite actions: [coverage-gate](actions/coverage-gate.md), [discover-service](actions/discover-service.md). | Workflows, customer templates |
| `catalog/` | Stack and workflow-ref catalog. See [catalog-schema.md](catalog-schema.md). | AlphaCI backend |
| `workflow-templates/customer/` | Caller templates and their `.properties.json`. See [workflow-templates/README.md](../workflow-templates/README.md). | AlphaCI backend |
| `scripts/` | Contract checks run by `workflow-validation.yml`. | CI of this repository |
| `starter-templates/` | Minimal starter apps checked by `workflow-validation.yml`. | Not read by the AlphaCI backend |
| `starters/` | Stack starter apps. | Not read by the AlphaCI backend (it builds scaffolds in code) |
| `templates/` | Old caller templates and test templates. See [templates/README.md](../templates/README.md). | Nothing |

## Documents

- [workflows/README.md](workflows/README.md): every workflow, who calls it, and its contract.
- [generated-project-contract.md](generated-project-contract.md): the files AlphaCI writes into a
  customer repository and which workflows each calls.
- [customer-secret-setup.md](customer-secret-setup.md): secrets and variables a customer repository
  needs, and which ones AlphaCI installs.
- [catalog-schema.md](catalog-schema.md): the catalog and template files the backend reads.
- [workflow-release-policy.md](workflow-release-policy.md): the `v1` tag and compatibility rules.

## Contributing

- Branch from `main` and open a pull request; do not push to `main` directly. Merging to `main`
  moves the `v1` tag, so every merge reaches customers on their next run.
- Use Conventional Commits for commit messages and PR titles (`feat(workflows): …`,
  `fix(docker-build): …`, `docs: …`).
- Never force-push `main`. Only the publish workflows move tags.
- Workflow Validation must pass. It runs on pull requests that touch workflows, catalog, templates,
  scripts or `docs/workflows/`.
- Change a workflow and its contract doc in the same pull request.
- Keep runtime and action versions current: Node defaults to the active LTS (24), and core actions
  stay on their latest major (`actions/checkout@v6` and so on). Validation rejects Node 20 defaults
  and old major pins.
- Never commit secrets. Workflows that touch secrets must keep them out of logs and artifacts.
