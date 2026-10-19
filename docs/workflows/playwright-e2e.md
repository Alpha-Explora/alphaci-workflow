# playwright-e2e.yml

Runs a repository's Playwright suite against a deployed site, one job per browser. It can stream per-test progress to AlphaCI, compare screenshots against baselines stored in AlphaCI, and reports test counts and per-test details as outputs.

- Source: `.github/workflows/playwright-e2e.yml`
- Trigger: `workflow_call`
- Used by:
  - `30-alphaci-verify.yml`: the UI test job for `uat` and `main`, when the stack has browser tests and the UI target is deployed. It passes `run-only-on-branch: '*'`, `visual-baselines: true`, `alphaci-api-url`, `visual-branch`, `ensure-test-deps`, `VERCEL_AUTOMATION_BYPASS_SECRET` (from `VERCEL_FRONTEND_AUTOMATION_BYPASS_SECRET`) and `ALPHACI_TOKEN`.
  - [reusable-web-uat.yml](reusable-web-uat.md), which the `service-react.yml` and `service-nextjs.yml` workflows call.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `working-directory` | string | no | `.` | Project directory. All steps run here. |
| `system-name` | string | yes | | Name used in job titles and artifact names. |
| `node-version` | string | no | `24` | Node.js version. |
| `package-manager` | string | no | `auto` | Declared. Not read by any step. |
| `install-command` | string | no | `npm ci` | Install command. With the default and no lockfile, the workflow runs `npm install` instead (see Notes). |
| `test-command` | string | no | `npm run test:e2e` | Test command. `{browser}` is replaced with the matrix browser. |
| `e2e-tests-directory` | string | no | `tests/e2e` | Folder that must exist. The job fails if it does not. |
| `e2e-base-url` | string | no | `""` | Exported to the test command as `E2E_BASE_URL`. |
| `upload-artifacts` | boolean | no | `true` | Upload the tests folder, `test-results/` and `playwright-report/`. |
| `run-only-on-branch` | string | no | `test` | Comma-separated branches allowed to run, compared with `github.ref_name` (or the PR base). Empty or `*` always runs. |
| `browser-list` | string | no | `["chromium"]` | JSON array or CSV of `chromium`, `firefox`, `webkit`. Other names are dropped. |
| `parallel-mode` | string | no | `matrix` | Exported as `PLAYWRIGHT_PARALLEL_MODE`. The browser matrix runs either way. |
| `max-parallel` | number | no | `3` | Matrix `max-parallel`. |
| `fail-fast` | boolean | no | `false` | Matrix `fail-fast`. |
| `checkout-ref` | string | no | `""` | Ref or SHA to check out. Empty uses `github.sha`. |
| `json-report` | string | no | `test-results/alphaci-e2e.json` | Where the Playwright JSON reporter writes, relative to `working-directory`. Set through `PLAYWRIGHT_JSON_OUTPUT_NAME`. |
| `ensure-test-deps` | string | no | `""` | Space-separated `name@version` specs installed with `npm install --no-save` when not already resolvable. Other shapes are ignored. |
| `visual-baselines` | boolean | no | `false` | Turn on visual baselines. Needs `alphaci-api-url` and `ALPHACI_TOKEN`. |
| `alphaci-api-url` | string | no | `""` | AlphaCI origin (`http://` or `https://`, no path). Used by visual baselines and live progress. |
| `visual-branch` | string | no | `""` | Branch the baselines and progress events belong to. Falls back to the PR base, then `github.ref_name`. |
| `visual-snapshot-dir` | string | no | `tests/e2e/__visual__` | Relative directory where baselines are written and screenshots read. No `..`. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | no | Vercel Protection Bypass for Automation key. Exposed to the test command under the same name. |
| `ALPHACI_TOKEN` | no | Bearer token for visual baselines and live progress. Without it both are off. |

## Outputs

| Output | Description |
| --- | --- |
| `e2e-result` | `success`, `failure`, `cancelled`, or `skipped` when the branch rule did not match. |
| `tests-total` | Tests run, across every browser. |
| `tests-passed` | Tests that passed. Flaky tests count as passed. |
| `tests-failed` | Tests that failed. |
| `tests-failures` | JSON array of `{name, message}` for failed tests, at most 20. |
| `tests-cases` | JSON array of tests with description annotation, notes, top-level steps, duration, retries and error. Failures first, at most 50. |
| `tests-passes` | JSON array of full names of passed tests (suite path and title joined with ` > `), at most 300. |

The count and detail outputs are empty when no Playwright JSON report was written.

## Permissions

Workflow: `contents: read`. No extra permissions are needed from the caller.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `prepare` | Always | Decides whether the branch rule matches and builds the browser list. |
| `playwright-e2e` | `prepare` says run | Matrix over browsers. Checks out, sets up Node, installs dependencies, checks the tests folder, installs Playwright browsers, fetches visual baselines, runs the tests with live progress, reports visual results, scrubs the bypass secret, uploads the JSON report (always) and the human report (when `upload-artifacts`). Timeout 25 minutes. |
| `finalize` | Always | Downloads the JSON reports of every browser, computes the counts and details, and sets `e2e-result`. |

## Example

```yaml
jobs:
  ui-tests-uat:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/playwright-e2e.yml@v1
    with:
      working-directory: .
      system-name: my-web
      e2e-base-url: https://uat-my-web.vercel.app
      e2e-tests-directory: tests/e2e
      browser-list: '["chromium"]'
      run-only-on-branch: '*'
      checkout-ref: ${{ needs.pipeline-context.outputs.sha }}
      visual-baselines: true
      alphaci-api-url: https://alphaci.example.com
      visual-branch: uat
    secrets:
      VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_FRONTEND_AUTOMATION_BYPASS_SECRET }}
      ALPHACI_TOKEN: ${{ secrets.ALPHACI_TOKEN }}
```

## Branch rule

The rule compares against `github.ref_name`, or `github.base_ref` on a pull request. In a `workflow_run` chain `github.ref_name` is the default branch, so callers in such chains should gate with their own `if:` and pass `run-only-on-branch: '*'`. When the rule does not match, the matrix is skipped and `e2e-result` is `skipped`.

## Missing lockfile

The npm cache is on only when a `package-lock.json` exists. With the default `install-command` and no lockfile or shrinkwrap, the workflow warns and runs `npm install --no-audit --no-fund --before=<24 hours ago>`. Commit a lockfile for reproducible runs.

## Protected previews

A Vercel preview behind Deployment Protection redirects a browser that is not signed in to Vercel. Pass `VERCEL_AUTOMATION_BYPASS_SECRET` and have the project's Playwright config send it on every request:

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

When the secret is not passed the variable is empty and nothing is sent.

Playwright records request headers in traces and copies the config into the JSON report, and GitHub does not mask secrets inside artifacts. Before anything is uploaded, the step "Remove the Vercel bypass secret from reports" replaces the secret with `***` in every file under `test-results/`, `playwright-report/`, the JSON report and the tests folder, including inside trace zips and the HTML report's embedded data. A file that still holds the secret afterwards is deleted. If the scrub itself fails, `test-results/`, `playwright-report/` and the JSON report are deleted and not uploaded.

## Live test progress

Each browser leg streams one event per test to AlphaCI. There is no input for it: it is on when `alphaci-api-url` is an `http(s)://` origin and `ALPHACI_TOKEN` is set.

The workflow writes a dependency-free reporter to `$RUNNER_TEMP/alphaci-live-reporter.cjs` and its settings, including the token, to a private file in `$RUNNER_TEMP`, so the token is not in the environment of the test processes. The reporter is added with `--reporter=list,html,json,<reporter>`, which replaces the reporters in the project's config. It is added only when the test command runs `playwright test` directly or through an `npm run` / `npm test` script, and neither sets `--reporter`. Otherwise the command runs unchanged with a notice. A project that needs another reporter (for example `junit`) should pass its own `--reporter` list, which turns live progress off.

`POST {alphaci-api-url}/api/v1/ci/playwright-progress` with `Authorization: Bearer <ALPHACI_TOKEN>`:

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

The `>` in `id` and `title` is the `U+203A` separator Playwright prints. Events are sent every 2 seconds, at most 200 per request, in order, and once more when the run ends. A retried test sends a `test_started` and `test_finished` per attempt. Each browser leg sends its own `run_started` and `run_finished` under the same `runId`; `project` tells them apart.

Delivery is best effort. Each request times out after 5 seconds and is retried twice on a network error, timeout, 5xx or 429. A batch that still fails is dropped with one warning per run. The reporter never throws or changes the exit code. The final flush is bounded at 10 seconds.

## Visual baselines

With `visual-baselines: true`, `alphaci-api-url` and `ALPHACI_TOKEN`, each browser leg:

1. Downloads the stored baselines for the repository and branch (`GET /api/v1/ci/visual-baselines`, at most 200) into `visual-snapshot-dir`. With Playwright 1.50 or newer it adds `--update-snapshots=missing` to the test command, so a screenshot with no baseline is captured instead of failing.
2. After the tests, even when they failed, classifies every `*.png` in that directory: `changed` when Playwright wrote a `<name>-diff.png` under `test-results/`, `new` when it was not among the downloaded baselines, else `passed`. It posts the summary to `/api/v1/ci/visual-summary` and uploads `changed` and `new` images to `/api/v1/ci/visual-results/file`.

Every call is fail-soft: an unreachable API only produces a warning and the verdict stays Playwright's. At most 60 snapshots are reported (changed and new first), and an image over 3 MB is not uploaded.
