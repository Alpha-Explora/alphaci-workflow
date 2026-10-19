# release.yml

Asks AlphaCI to release an artifact the pipeline has already built, waits for the host to finish, then checks that the service answers. The pipeline holds no hosting credentials and never names a host: AlphaCI resolves the host from the project, slot and branch, or from explicit environment and target IDs.

- Source: `.github/workflows/release.yml`
- Trigger: `workflow_call`
- Used by: `20-alphaci-package.yml` (branch pipeline) for Render targets that deploy a pushed image. The Render provider fragment adds one `deploy-render-<slot>-<branch>` job after its `docker-<slot>-<branch>` job.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `system-name` | string | no | `""` | System name. Used in the concurrency group and the summary. |
| `slot` | string | yes | | Deployment slot: `backend`, `frontend` or `standalone`. |
| `branch` | string | yes | | Pipeline branch being released (`dev`, `uat`, `main`). Pass it from the pipeline context, not `github.ref`. |
| `commit-sha` | string | yes | | Commit being released. Must be passed explicitly because a `workflow_run` chain reports the default branch in `github.sha`. |
| `environment-id` | string | no | `""` | AlphaCI environment ID. If set, `environment-name` and `target-id` are required too. |
| `environment-name` | string | no | `""` | Protected GitHub Environment the job binds to. Validated by the caller. |
| `target-id` | string | no | `""` | AlphaCI deployment target ID. Never inferred from the branch. |
| `artifact` | string | no | `""` | Built artifact, for example an image reference. Omit when the host builds from source. |
| `api-url` | string | no | `""` | AlphaCI base URL. Falls back to the `ALPHACI_API_URL` secret. One of the two is required. |
| `healthcheck-path` | string | no | `/health` | Path appended when AlphaCI returns a bare origin. |
| `healthcheck-expected-statuses` | string | no | `200` | Comma-separated HTTP statuses that count as healthy. |
| `healthcheck-timeout-seconds` | number | no | `420` | How long to wait for the service to answer. |
| `healthcheck-interval-seconds` | number | no | `10` | Seconds between health attempts. |
| `release-timeout-seconds` | number | no | `900` | How long to wait for the host to finish the release. |
| `release-poll-interval-seconds` | number | no | `10` | Seconds between release status checks. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `ALPHACI_TOKEN` | yes | The project's AlphaCI token, installed when AlphaCI provisions the repository. |
| `ALPHACI_API_URL` | no | AlphaCI base URL, when `api-url` is not passed. |

## Outputs

| Output | Description |
| --- | --- |
| `release_id` | AlphaCI release ID. |
| `release_status` | Last release status AlphaCI reported. |
| `service_url` | Public URL of the released service. |
| `health_url` | URL the health check used. |
| `health_status` | `success`, `failure`, or `skipped` when AlphaCI returned no URL. |
| `health_http_code` | Last HTTP status from the health check. |

## Permissions

Workflow: `contents: read`. No extra permissions are needed from the caller.

Concurrency group `alphaci-release-<system-name or repo>-<slot>-<target-id or branch>`, never cancelled in progress.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `release` | Always | Resolves the API URL, validates the deployment identity, posts the release, polls until it ends, health-checks the service and writes a step summary. Binds to `environment-name` when `environment-id` is set. Timeout 45 minutes. |

## Example

```yaml
jobs:
  deploy-render-backend-uat:
    needs: [pipeline-context, docker-backend-uat]
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/release.yml@v1
    with:
      system-name: my-api
      slot: backend
      branch: uat
      commit-sha: ${{ needs.pipeline-context.outputs.sha }}
      artifact: ${{ needs.docker-backend-uat.outputs.image-repo }}:sha-${{ needs.pipeline-context.outputs.sha }}
      healthcheck-path: /health
    secrets:
      ALPHACI_TOKEN: ${{ secrets.ALPHACI_TOKEN }}
      ALPHACI_API_URL: ${{ secrets.ALPHACI_API_URL }}
```

## Notes

- `api-url` may be a base URL or end in `/api/v1`; both resolve to the same endpoint. It must be `https://`. `http://localhost` and `http://127.0.0.1` are allowed with a warning.
- Targeted mode (any of `environment-id`, `environment-name`, `target-id` set) needs all three, single-line, plus a 40-character `commit-sha`. A container `artifact` must then be an `image@sha256:<digest>` reference.
- AlphaCI endpoints, both called with `Authorization: Bearer <ALPHACI_TOKEN>`:
  - `POST {base}/api/v1/ci/releases` with `{repoFullName, slot, branch, commitSha, runUrl, artifact?}`, plus `{environmentId, environmentName, targetId}` in targeted mode. Returns `{releaseId, status}`. A `404` fails with a message that the deployment has no release endpoint. Other non-2xx responses fail with AlphaCI's message in the annotation.
  - `GET {base}/api/v1/ci/releases/{releaseId}?repo=<owner/repo>`. Returns `{status, serviceUrl?, healthcheckUrl?, message?}`.
- Polling ends on `live`, `succeeded` or `success` (pass) and on `failed`, `error`, `canceled` or `cancelled` (fail). Any other status keeps polling. A failed poll is retried until `release-timeout-seconds`.
- Health check: `healthcheckUrl` is used as returned. Otherwise `serviceUrl` is used, with `healthcheck-path` appended only when it is a bare origin. With no URL at all, the job warns and reports `health_status: skipped`.
