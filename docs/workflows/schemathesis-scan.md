# schemathesis-scan.yml

## Role
Primitive check.

## Purpose
Generates test cases **from the API's own OpenAPI document** and checks the deployed service honours the contract it publishes — no 5xx, responses matching the declared schema, declared status codes, declared content types.

## Public Contract
- Source workflow: `.github/workflows/schemathesis-scan.yml`
- Inputs: `working-directory`, `system-name`, `base-url`, `schema-path`, `schema-url-path`, `checks`, `max-examples`, `schemathesis-version`, `python-version`, `health-path`, `health-timeout-seconds`, `fail-on-failure`, `checkout-ref`
- Secrets: none
- Outputs: `contract-result`, `operations-tested`, `failures`

## What it finds that a written test does not
A Bruno collection tests the cases someone thought of. This generates the ones they did not: boundary integers, empty and enormous strings, unicode, nulls, missing required fields, wrong types — all derived from the schema, so every case is one a real client could send.

The bugs it catches are unhandled-exception bugs and contract drift. `age: 2147483648` overflowing an `int` and returning 500. A document promising `id` is a string while the service returns a number, which breaks every client generated from those docs. It will **not** tell you the business logic is wrong — it does not know a discount cannot exceed 100%. That is what the written suite is for, which is why both run.

## The schema is a file, not an endpoint
`schema-path` (or discovery) reads the document from the build output. The .NET scaffold writes it during `dotnet build` via `Microsoft.Extensions.ApiDescription.Server`, so the running service publishes nothing extra describing its own surface, and the document cannot drift from the code that produced it.

`schema-url-path` exists for services that genuinely serve their schema, but a file is preferred wherever the build can emit one.

## A run that exercised nothing is a failure
A schema describing zero operations produces a clean run and a zero exit. So does one whose paths were all filtered out. Either way the API shipped with nothing checked while the job went green — the same shape as an architecture test asserting over an empty type set.

So a pass clears three bars: the tool exited clean, no check failed, and **at least one operation was actually exercised**. A missing schema fails outright rather than skipping, for the same reason: a skipped contract check reads as "nothing to worry about" when it means the contract was never verified.

## Where it runs
The QA tier, beside the API suite. Not production: this deliberately sends malformed payloads, and that is not something to aim at a live service.

## Why defusedxml
The verdict step parses the JUnit report, and that report embeds response bodies from the API under test — which is exactly the service a contract fuzzer is most likely to find misbehaving. Stdlib `ElementTree` expands entity declarations; `defusedxml` does not.
