# Product and Customer Workflow Boundaries

`Alpha-Explora/alphaci-workflow` is the only workflow-definition source.

- Product delivery workflows live as flat reusable workflows under
  `.github/workflows/` and product-specific callers, when needed, live under
  `workflow-templates/product/`.
- Customer-generated callers and their metadata live under
  `workflow-templates/customer/`.
- Retired examples live under `workflow-templates/legacy/` and are excluded
  from the customer catalog.

The backend packages a pinned `v1` snapshot for production and mounts the
checked-out sibling workflow repository for local development. Neither mode
downloads workflow definitions at request time.
