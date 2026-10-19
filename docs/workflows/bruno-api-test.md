# bruno-api-test.yml

Runs a Bruno collection against a deployed API and reports requests,
assertions and failures. It waits for the deployment's health path first. A
run that executed no assertions is a failure.

- Source: `.github/workflows/bruno-api-test.yml`
- Trigger: `workflow_call`
- Used by: generated `30-alphaci-verify.yml` (.NET stack, when a deployment exists): the whole collection on `uat`, `folder: smoke` on `main`

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the collection, relative to the repository root. |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `base-url` | string | yes | | Root URL of the deployed API. The collection reads it as `{{BASE_URL}}`. |
| `collection-path` | string | no | `tests/api` | Collection root (the directory holding `bruno.json`), under `working-directory`. |
| `folder` | string | no | `""` | Subfolder to run instead of the whole collection. |
| `min-assertions` | number | no | `1` | Fewest assertions plus tests that must execute. |
| `bruno-version` | string | no | `4.1.0` | `@usebruno/cli` version. |
| `node-version` | string | no | `22.x` | Node version used to run the Bruno CLI. |
| `health-path` | string | no | `/health` | Path polled until it answers `200` before any request runs. |
| `health-timeout-seconds` | number | no | `120` | How long to wait for the health path. |
| `fail-on-failure` | boolean | no | `true` | Fail the job when the suite fails. `false` reports only. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `API_USERNAME` | no | Passed as `{{API_USERNAME}}`. |
| `API_PASSWORD` | no | Passed as `{{API_PASSWORD}}`. |
| `API_TOKEN` | no | Passed as `{{API_TOKEN}}`. |

## Outputs

| Output | Description |
| --- | --- |
| `api-test-result` | Outcome of the verdict step (`success` or `failure`). |
| `total-requests` | Requests executed. |
| `failed-requests` | Failed plus errored requests. `0` when clean. |
| `total-assertions` | Assertions plus tests executed. `0` means the suite proved nothing. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `bruno-api-test` | always | Locate the collection, install the Bruno CLI, poll the health path, run `bru run` with `--env-var` values and a JSON reporter, judge `results.json`, upload it. |

## Example

```yaml
jobs:
  api-tests:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/bruno-api-test.yml@v1
    with:
      system-name: orders-api
      base-url: ${{ vars.RENDER_HEALTHCHECK_URL_UAT }}
      collection-path: tests/api
    secrets:
      API_TOKEN: ${{ secrets.API_TOKEN }}
```

## Notes

- A pass needs all of: at least one request ran, at least `min-assertions`
  assertions or tests executed, no request or assertion failed, and `bru`
  exited `0`. `bru` itself reports a request with no assertions as passed.
- These fail the job whatever `fail-on-failure` says: no `bruno.json` at the
  collection root, no `.bru` files, a `folder` that does not exist, or a
  health path that never answers `200`.
- With `fail-on-failure: false` the verdict step reports the error and exits
  `0`, so `api-test-result` is `success`.
- If `base-url` ends with `health-path`, that suffix is removed. The generated
  pipeline passes the `RENDER_HEALTHCHECK_URL_UAT` or
  `RENDER_HEALTHCHECK_URL_MAIN` repository variable, which is a health URL.
- `main` runs only the read-only `smoke` folder, so production gets no
  create, update or delete requests.
- Credentials are passed with `--env-var` at run time and are never written
  to a file. Empty secrets are not passed.
- Artifact: `bruno-results-<system-name>` (`results.json`, 14 days).
