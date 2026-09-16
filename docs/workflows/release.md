# release.yml

## Role
Deployment.

## Purpose
Releases an artifact that the pipeline has already built, by asking AlphaCI to perform the release
and then verifying that the service answers. The pipeline never holds hosting credentials and never
names a host.

## Public Contract
- Source workflow: `.github/workflows/release.yml`
- Inputs: `system-name`, `slot`, `branch`, `commit-sha`, `artifact`, `api-url`, `healthcheck-path`,
  `healthcheck-expected-statuses`, `healthcheck-timeout-seconds`, `healthcheck-interval-seconds`,
  `release-timeout-seconds`, `release-poll-interval-seconds`
- Secrets: `ALPHACI_TOKEN` (required), `ALPHACI_API_URL` (optional; required when `api-url` is unset)
- Outputs: `release_id`, `release_status`, `service_url`, `health_url`, `health_status`,
  `health_http_code`

## Usage
Emitted by a provider workflow fragment after the artifact job. `branch` and `commit-sha` come from
`pipeline-context`, never from the git context: a `workflow_run` chain reports the default branch,
so a job that reads `github.ref` releases the wrong branch.

`api-url` accepts a base URL or one that already ends in `/api/v1`; both resolve to the same
endpoint.

## Platform contract
This workflow depends on two AlphaCI endpoints, both authenticated with the project's
`ALPHACI_TOKEN`:

- `POST /api/v1/ci/releases` with `{repoFullName, slot, branch, commitSha, runUrl, artifact?}`.
  Returns `{releaseId, status}`. A `404` means the deployment predates release support.
- `GET /api/v1/ci/releases/{releaseId}`. Returns `{status, serviceUrl?, healthcheckUrl?, message?}`.

Status values: `pending` and `in_progress` continue polling; `live`, `succeeded` and `success` are
success; `failed`, `error`, `canceled` and `cancelled` fail the job. An unreadable poll is retried
until `release-timeout-seconds`, because a platform restart is not a failed release.

The host is resolved by AlphaCI from the project, slot and branch, so the same call releases a Render
service, a Cloud Run revision, or anything added later, with no change to generated pipelines.

## Health verification
`healthcheckUrl` is used exactly as returned. When only `serviceUrl` is returned and it is a bare
origin, `healthcheck-path` is appended. When neither is returned, the job warns and reports
`health_status: skipped` rather than claiming a deployment was verified.
