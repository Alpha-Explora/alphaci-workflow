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
