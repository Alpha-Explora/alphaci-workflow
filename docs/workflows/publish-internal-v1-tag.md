# Publish internal-v1 Tag Contract

Moves the internal `internal-v1` ref to the latest commit on the internal integration branch.

The internal AlphaCI deployment sets `CENTRAL_WORKFLOW_REF=internal-v1` so its generated pipelines
track a tag that moves independently of the customer-facing `v1` line. Two branches, two lines:

- `main` → `v1` (sold product; see `publish-v1-tag.md`)
- internal integration branch → `internal-v1` (this workflow)

The internal branch name is carried over from the previous central repository and must exist here
before this workflow can fire. See the consolidation plan's open items.
