# Playwright E2E

Runs the reusable browser-test workflow for web services. Callers provide the
service directory, install command, test command, and browser settings.

## Protected previews

A Vercel preview sits behind Deployment Protection: a browser that is not
signed in to the Vercel team is redirected to Vercel's sign-in, so a suite
pointed at a uat preview never reaches the app.

Callers may pass the optional secret `VERCEL_AUTOMATION_BYPASS_SECRET` (a
project's Protection Bypass for Automation secret). The workflow exposes it to
the test command as the environment variable of the same name, and the
project's Playwright config sends it on every request:

```ts
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  use: {
    baseURL,
    ...(bypass
      ? {
          extraHTTPHeaders: {
            'x-vercel-protection-bypass': bypass,
            'x-vercel-set-bypass-cookie': 'true',
          },
        }
      : {}),
  },
});
```

When the secret is not passed the variable is empty and nothing is sent, so an
unprotected host (production, Render) behaves exactly as before.

## Missing lockfile

A project with no `package-lock.json` no longer fails at setup. The npm
dependency cache is switched on only when a lockfile exists, and the install
falls back to `npm install` with a warning. Commit a lockfile for reproducible
runs.

## Reported results

Besides `e2e-result`, the workflow reports `tests-total`, `tests-passed`,
`tests-failed`, `tests-failures` (JSON array of `{name,message}`, capped at 20)
and `tests-passes`: a JSON array of the full names of the passed tests (suite
path and title joined with ` > `, flaky specs included, skipped specs and
repeats from other browsers excluded), capped at 300. All five are empty when
the suite wrote no Playwright JSON report.

## Live test progress

While Playwright runs, each browser leg streams one event per test to ALPHACI so
QA Studio can show tests as they finish. There is no input to set: it is on when
`alphaci-api-url` is a `http(s)://` origin **and** the secret `ALPHACI_TOKEN` is
present (the same two the visual steps need, without `visual-baselines`). With
either missing, nothing is added and the run is exactly what it was before.

The workflow writes a small dependency-free reporter to
`$RUNNER_TEMP/alphaci-live-reporter.cjs` (plain Node 18+, `fetch`) and the
settings, including the token, to a private file in `$RUNNER_TEMP`, so the token
is not in the environment of the processes the tests start. The reporter is
added with the `--reporter` flag as `list,html,json,<reporter>`: that flag
replaces the reporters a project's config lists, so the ones the workflow relies
on (`list` console output, `html` for `playwright-report/`, and `json`, which
feeds `tests-passes` and the other results through `json-report`) are named
again. It is only added when the test command is a `playwright test` run (direct,
or through an `npm run` / `npm test` script) that sets no `--reporter` of its own;
anything else runs untouched with a notice. A project that relied on another
config reporter (for example `junit`) should pass its own `--reporter` list,
which turns live progress off for that run.

`POST {alphaci-api-url}/api/v1/ci/playwright-progress`, `Authorization: Bearer
<ALPHACI_TOKEN>`, JSON body (nothing else is sent):

```json
{ "repoFullName": "owner/repo", "branch": "<visual-branch, else PR base, else ref name>",
  "runId": 123, "runAttempt": 1, "commitSha": "<checked-out HEAD>",
  "events": [
    { "type": "run_started", "at": "ISO", "total": 12 },
    { "type": "test_started", "at": "ISO",
      "test": { "id": "file > describe > title", "file": "tests/x.spec.ts", "title": "describe > title", "project": "chromium" } },
    { "type": "test_finished", "at": "ISO",
      "test": { "id": "...", "file": "...", "title": "...", "project": "...",
                "status": "passed|failed|skipped|timedOut|interrupted",
                "durationMs": 840, "retry": 0, "error": "first lines, ANSI stripped, 1000 chars max, or null" } },
    { "type": "run_finished", "at": "ISO", "status": "passed|failed|timedout|interrupted",
      "summary": { "passed": 0, "failed": 0, "skipped": 0, "flaky": 0, "durationMs": 0 } }
  ] }
```

(The `>` in `id` and `title` is the `U+203A` separator Playwright prints.) Events
are buffered and sent every ~2 seconds, at most 200 per request, in order, and
once more when the run ends. A test that retries sends a `test_started` and a
`test_finished` per attempt, with `retry` counting up. With a browser matrix each
leg sends its own `run_started`/`run_finished` under the same `runId`; `project`
tells the legs apart. Resending is safe: the server is idempotent.

It is strictly best effort. Each request times out after 5 seconds and is
retried twice on a network error, timeout, 5xx or 429 (other 4xx are not
retried); a batch that still fails is dropped with a single `::warning::` per
run. The reporter never throws, never changes the exit code, and the only wait it
adds is one final flush bounded at 10 seconds.

## Visual baselines (opt-in)

With `visual-baselines: true`, `alphaci-api-url` and the secret `ALPHACI_TOKEN`,
each browser leg:

1. Downloads the stored baselines for `repoFullName` and `visual-branch` into
   `visual-snapshot-dir` (default `tests/e2e/__visual__`), and passes
   `--update-snapshots=missing` to the test command (Playwright 1.50 or newer)
   so a screenshot without a baseline is captured rather than failing.
2. After the tests, even when they failed, classifies every `*.png` in that
   directory: `changed` when Playwright wrote a `<name>-diff.png` under
   `test-results/`, `new` when it was not among the downloaded baselines, else
   `passed`. It posts the summary and uploads the images for `changed` and `new`.

Every call is fail-soft: an unreachable API only produces a warning, and the
test verdict stays Playwright's. At most 60 snapshots are reported, and an image
over 3 MB is not uploaded.

| Input | Default | Meaning |
| --- | --- | --- |
| `visual-baselines` | `false` | Turns the feature on |
| `alphaci-api-url` | `""` | ALPHACI API origin |
| `visual-branch` | `""` | Pipeline branch (falls back to the PR base, then the ref name) |
| `visual-snapshot-dir` | `tests/e2e/__visual__` | Baseline and screenshot directory |
