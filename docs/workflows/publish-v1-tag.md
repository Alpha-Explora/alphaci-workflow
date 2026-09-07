# Publish v1 Tag Contract

Moves the customer-facing `v1` ref to the latest `main` commit after a merge, so generated pipelines
pinned at `@v1` never run against stale workflows.

The move is gated on Workflow Validation. That suite triggers on `pull_request` only, so a direct push
to `main` previously moved `v1` with no check run against the commit every customer pipeline was about
to pin to. Calling the suite here covers that path without running it twice.

When validation fails the tag is not moved, leaving `v1` on the last commit that passed. Consumers keep
running known-good workflows rather than pinning to a broken one.
