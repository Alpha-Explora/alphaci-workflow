# bruno-api-test.yml

## Role
Primitive check.

## Purpose
Runs a Bruno collection against a **deployed** API and reports the requests, assertions and failures, so a release is verified by exercising the running service rather than by re-reading its source.

## Public Contract
- Source workflow: `.github/workflows/bruno-api-test.yml`
- Inputs: `working-directory`, `system-name`, `base-url`, `collection-path`, `folder`, `min-assertions`, `bruno-version`, `node-version`, `health-path`, `health-timeout-seconds`, `fail-on-failure`, `checkout-ref`
- Secrets: `API_USERNAME`, `API_PASSWORD`, `API_TOKEN` — all optional
- Outputs: `api-test-result`, `total-requests`, `failed-requests`, `total-assertions`

## Usage
This is the only check in the set that needs something running. It belongs after a deploy job, never beside the source-reading gates: with no service at `base-url` there is nothing to test, and the result would describe the deployment rather than the code.

`folder` runs part of a collection instead of all of it. That is what separates the two tiers: the QA environment runs the whole suite, including the requests that create, update and delete; production runs the read-only subset. A CRUD suite pointed at production is not a test, it is a write.

`fail-on-failure` is what a branch policy moves, the same way `fail-on-warning` moves for the static gates.

## Why a passing exit code is not enough
`bru` reports `PASS` and exits `0` for a collection that executed requests and asserted nothing. Observed directly, one request with no `assert` block:

```
Status ✓ PASS | Requests 1 (1 Passed) | Tests 0/0 | Assertions 0/0
exit 0
```

So a suite whose assertions were deleted, a folder filter that matched only unasserted requests, or a collection someone stubbed out mid-refactor all report green while proving nothing. This is the same shape as an architecture test asserting over an empty type set: the check ran, found nothing to object to, and said so.

A pass therefore has to clear three bars, not one:

1. `bru` exited clean,
2. no request failed, and
3. the run actually executed at least `min-assertions` assertions or tests.

`min-assertions` defaults to `1`, which only catches a suite that asserts nothing at all. Raise it per project once the collection has a known size — it is a floor, and a floor set to the real number turns "someone deleted half the suite" into a failure too.

## A missing collection is a failure, not a skip
If `bruno.json` is absent, or the collection holds no `.bru` files, the job fails and says the API was not tested. Skipping would be worse than useless: a skipped check reads as "nothing to worry about" on a dashboard, and here it would mean the service shipped unverified.

## Waiting before testing
A deploy job returns when the platform accepts the release, not when the container serves traffic. Requests fired into that window fail with connection errors that look exactly like API defects. So `health-path` is polled until it answers `200`, and a deployment that never answers fails with that as the stated reason rather than as a wall of failed requests.

## Credentials never enter the repository
`base-url` and the three optional secrets are passed with `--env-var` at run time. Bruno environment files are committed, so anything written into one is committed with it; nothing here writes a credential to disk. The collection reads them as `{{BASE_URL}}`, `{{API_USERNAME}}`, `{{API_PASSWORD}}` and `{{API_TOKEN}}`.
