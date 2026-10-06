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
