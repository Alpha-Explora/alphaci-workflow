# schemathesis-scan.yml

Generates test cases from the API's OpenAPI document with Schemathesis and
runs them against a deployed service. It checks that the service honours the
contract it publishes. A run that exercised no operation is a failure.

- Source: `.github/workflows/schemathesis-scan.yml`
- Trigger: `workflow_call`
- Used by: generated `30-alphaci-verify.yml` (.NET stack, `uat` only, when a deployment exists)

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Directory holding the schema, relative to the repository root. |
| `system-name` | string | yes | | Name used in artifact names and logs. |
| `base-url` | string | yes | | Root URL of the deployed API. |
| `schema-path` | string | no | `""` | OpenAPI document in the repository, under `working-directory`. Empty discovers one. |
| `schema-url-path` | string | no | `""` | Fetch the schema from the running service at this path instead of from a file. |
| `checks` | string | no | `not_a_server_error` | Schemathesis checks to run. `all` adds schema conformance, status codes and content types. |
| `max-examples` | number | no | `50` | Cases generated per operation. |
| `schemathesis-version` | string | no | `4.26.1` | Schemathesis version. |
| `python-version` | string | no | `3.13` | Python used to run Schemathesis. |
| `health-path` | string | no | `/health` | Path polled until it answers `200` before any test runs. |
| `health-timeout-seconds` | number | no | `120` | How long to wait for the health path. |
| `fail-on-failure` | boolean | no | `true` | Fail the job on a contract violation. `false` reports only. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |

## Secrets

None.

## Outputs

| Output | Description |
| --- | --- |
| `contract-result` | Outcome of the verdict step (`success` or `failure`). |
| `operations-tested` | Operations exercised. `0` means the schema described nothing. |
| `failures` | Contract violations (JUnit failures plus errors). `0` when clean. |

## Permissions

Workflow: `contents: read`. The caller job needs nothing more.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `schemathesis-scan` | always | Locate the schema, install Schemathesis and `defusedxml`, poll the health path, run `st run --url <base> --checks <checks> --max-examples <n>` with a JUnit report, judge the report, upload it. |

## Example

```yaml
jobs:
  contract-tests:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/schemathesis-scan.yml@v1
    with:
      system-name: orders-api
      base-url: ${{ vars.RENDER_HEALTHCHECK_URL_UAT }}
      schema-path: src/Orders.Api/Orders.Api.json
```

## Notes

- Schema lookup order: `schema-url-path` if set; else `schema-path`, which
  must exist; else the first `*.json` under `working-directory` containing
  `"openapi"`, skipping `bin/` and `obj/`. No schema fails the job.
- The workflow does not build the project. A schema that is only produced by
  the build (as in the .NET scaffold, which writes it to the project root and
  ignores it in git) is not present in a fresh checkout. Set `schema-path` to
  a committed file or use `schema-url-path`.
- A pass needs at least one operation tested, no violations, and
  Schemathesis exiting `0`. With `fail-on-failure: false` the verdict step
  reports and exits `0`.
- A health path that never answers `200` fails the job whatever
  `fail-on-failure` says. If `base-url` ends with `health-path`, that suffix
  is removed.
- It sends malformed payloads by design, so the generated pipeline runs it on
  `uat` only, never `main`.
- The JUnit report is parsed with `defusedxml`, because it embeds response
  bodies from the service under test.
- Artifact: `schemathesis-<system-name>` (`schemathesis.xml` and
  `schemathesis.log`, 14 days).
