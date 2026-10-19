# validate-subscription.yml

Access gate for template-based callers. Posts the repository name to the
AlphaCI validation endpoint with the caller's token and fails unless AlphaCI
answers HTTP 200.

- Source: `.github/workflows/validate-subscription.yml`
- Trigger: `workflow_call`
- Used by: the `validate-access` job of every customer template in
  `workflow-templates/customer/` except `promotion`, `quality-gate` and
  `trivy-scan`. Generated `00-alphaci-access.yml` and later stages do not call
  it; they run their own inline `validate-access` job with `ALPHACI_TOKEN`.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `validation-api-url` | string | no | `https://api.alphaci.com.ph/api/v1/ci/validate` | Full URL of the AlphaCI validation endpoint. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `CI_TOKEN` | yes | Repository token issued by AlphaCI, sent as `Authorization: Bearer`. |

## Outputs

None.

## Permissions

None declared. The job uses no `GITHUB_TOKEN` scopes.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `validate` | always | `POST <validation-api-url>` with body `{"repo": "<owner/repo>"}`. Fails on any status other than 200. |

## Example

```yaml
jobs:
  validate-access:
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/validate-subscription.yml@v1
    with:
      validation-api-url: ${{ vars.ALPHACI_VALIDATE_URL || 'https://api.alphaci.com.ph/api/v1/ci/validate' }}
    secrets:
      CI_TOKEN: ${{ secrets.CI_TOKEN }}

  unit-tests:
    needs: validate-access
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/frontend-tests.yml@v1
    with:
      system-name: web
```

## Notes

- Make every other job depend on it with `needs: validate-access`, so a refused
  token stops the run before any work starts.
- A self-hosted AlphaCI must be reachable from GitHub-hosted runners. Set the
  repository variable `ALPHACI_VALIDATE_URL` to
  `https://<your-alphaci-host>/api/v1/ci/validate`; the templates fall back to
  the default URL when it is unset.
- The `env` context is not available in a reusable workflow call's `with:`
  block, so pass the URL from `vars`, not `env`.
