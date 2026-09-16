# docker-build.yml

## Role
Build.

## Purpose
Builds Docker images, optionally pushes them, and optionally scans them.

## Public Contract
- Source workflow: `.github/workflows/docker-build.yml`
- Inputs: `working-directory`, `image-name`, `dockerfile-path`, `push-image`, `scan-vulnerabilities`, `fail-on-vulnerabilities`, `build-args`, `generate-sbom`, `generate-provenance`, `release-tag`, `checkout-ref`, `pipeline-branch`
- Secrets: none
- Outputs: `image-tag`, `image-digest`, `scan-result`

## Usage
Call after tests, lint, and security with `needs`. Only set `push-image: true` on trusted branches. Use
`checkout-ref` in `workflow_run` chains.

Pass `pipeline-branch` in a `workflow_run` chain as well. Without it the image is tagged from the git
context, which in such a chain is the default branch: a uat build is then tagged `main` and `latest`,
and the `sha-` tag names the default branch's head rather than the commit that was built. With it, the
image is tagged with that branch and `sha-<built commit>`, and no `latest` is written. Callers that omit
it keep the previous tags.

A failure to write the build cache no longer fails the job: the image has already been pushed by then,
and a cache that cannot be saved only costs time on the next run.
