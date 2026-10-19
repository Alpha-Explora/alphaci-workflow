# templates

Nothing in AlphaCI reads this folder. The AlphaCI backend generates pipelines itself and takes
customer templates from `workflow-templates/customer/`.

| File | What it is | State |
| --- | --- | --- |
| `be-pipeline-caller.yml`, `fe-pipeline-caller.yml`, `mobile-pipeline-caller.yml`, `mobile-kotlin-caller.yml` | Hand-copied caller workflows. | Broken: they call `master-pipeline-*.yml` workflows that do not exist in this repository. Do not use them. |
| `playwright-e2e-template.ts` | Example Playwright script. | Not used by any workflow. |
| `k6-smoke-template.ts` | Example k6 smoke script. | Not used by any workflow. |
| `replit.nix` | Replit runtime definition. | Not used by any workflow. |

For a current caller, use the generator output described in
[generated-project-contract.md](../docs/generated-project-contract.md) or a template from
`workflow-templates/customer/`.
