# docker-build.yml

Builds a Docker image with Buildx, pushes it to GitHub Container Registry
(`ghcr.io/<owner>/<image-name>`), and scans it with Trivy for fixable HIGH and
CRITICAL vulnerabilities.

- Source: `.github/workflows/docker-build.yml`
- Trigger: `workflow_call`
- Used by: generated `20-alphaci-package.yml` (image job per slot in
  environment pipelines, and the Render branch pipeline); customer templates
  `be-nestjs`, `be-nodejs` and `dotnet-service-pipeline`; `mobile-gradle.yml`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | yes | | Build context directory. |
| `image-name` | string | yes | | Image name under `ghcr.io/<owner>/`. Lower-cased. |
| `dockerfile-path` | string | no | `Dockerfile` | Dockerfile path, relative to `working-directory`. |
| `push-image` | boolean | no | `true` | Push to GHCR. When false the image is loaded locally. |
| `scan-vulnerabilities` | boolean | no | `true` | Run the Trivy scan. |
| `fail-on-vulnerabilities` | boolean | no | `true` | Fail when Trivy finds fixable HIGH or CRITICAL vulnerabilities. |
| `build-args` | string | no | `""` | Build arguments, `key=value`, one per line. |
| `generate-sbom` | boolean | no | `true` | Attach an SBOM attestation (only when pushing). |
| `generate-provenance` | boolean | no | `true` | Attach a provenance attestation (only when pushing). |
| `release-tag` | string | no | `""` | Extra tag to add. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |
| `pipeline-branch` | string | no | `""` | Branch the image belongs to (`dev`, `uat`, `main`). Changes the tag policy; see Notes. |

## Secrets

None. The workflow logs in to GHCR with the caller's `GITHUB_TOKEN`.

## Outputs

| Output | Description |
| --- | --- |
| `image-tag` | All tags applied, newline-separated. |
| `image-digest` | Image digest. |
| `image-ref` | `ghcr.io/<owner>/<image>@sha256:<digest>`. Empty when the image was not pushed. |
| `image-repo` | `ghcr.io/<owner>/<image>`, without tag or digest. |
| `scan-result` | Outcome of the Trivy step that ran (`success` or `failure`), empty when no scan ran. |

## Permissions

Workflow: `contents: read`. Job `docker-build`: `contents: read`,
`packages: write`. Job `vulnerability-scan`: `contents: read`,
`packages: read`, `security-events: write`. The calling job must grant
`contents: read`, `packages: write` and `security-events: write`, or the call
fails at startup.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `docker-build` | always | Builds and tags the image, pushes it when `push-image` is true, resolves `image-ref`. When not pushing and `scan-vulnerabilities` is true, scans the local image with Trivy. |
| `vulnerability-scan` | `scan-vulnerabilities` and `push-image` are true | Scans the pushed image by digest with Trivy, writes SARIF, uploads it to code scanning (best effort) and as an artifact. |

## Example

```yaml
jobs:
  image:
    permissions:
      contents: read
      packages: write
      security-events: write
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/docker-build.yml@v1
    with:
      working-directory: .
      image-name: ${{ github.event.repository.name }}-backend
      push-image: true
      checkout-ref: ${{ github.event.workflow_run.head_sha }}
      pipeline-branch: uat
```

## Notes

- Tag policy with `pipeline-branch` set: `<pipeline-branch>` and
  `sha-<built commit>` (the commit is `checkout-ref` when it is a full SHA,
  otherwise `github.sha`). No `latest` is written. Use this in `workflow_run`
  chains, where the git context is the default branch.
- Tag policy without `pipeline-branch`: `sha-<github.sha>`, the branch or PR
  ref, a semver tag on version tags, and `latest` on the default branch.
- `release-tag`, when set, is added in both cases.
- Pass `image-ref` on to release and deploy jobs so every environment runs the
  same image bytes.
- A build cache that cannot be saved does not fail the job.
- Trivy scans with `ignore-unfixed: true`. Uploading SARIF to code scanning is
  allowed to fail (a private repository without Advanced Security refuses it);
  the file is always kept as the `<image-name>-security-scan` artifact
  (30 days).
