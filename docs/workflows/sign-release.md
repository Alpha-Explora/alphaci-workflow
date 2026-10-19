# sign-release.yml

Signs a release that AlphaCI has already registered, so an on-prem host can verify it before it pulls any image. The workflow reads the release from AlphaCI, builds the canonical manifest, signs it with a Cloud KMS key (or, for a lab, a PEM key held in a secret) and attaches the signed manifest to the release.

- Source: `.github/workflows/sign-release.yml`
- Trigger: `workflow_call`
- Used by: `20-alphaci-package.yml` for projects with environments, as the `sign-release` job after `register-release`. AlphaCI emits this job only when it does not sign releases itself. A self-hosted install sets `ALPHACI_RELEASE_SIGNER=file`, so the AlphaCI server signs and the generated pipeline has no `sign-release` job.

## Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `release-id` | string | yes | | AlphaCI release ID (UUID) registered by the caller. |
| `api-url` | string | no | `""` | AlphaCI base URL. Falls back to the `ALPHACI_API_URL` secret. |
| `kms-key-version` | string | no | `""` | Cloud KMS `cryptoKeyVersion` resource name. Falls back to `vars.ALPHACI_RELEASE_KMS_KEY_VERSION`. |
| `workload-identity-provider` | string | no | `""` | GCP Workload Identity provider. Falls back to `vars.ALPHACI_GCP_WORKLOAD_IDENTITY_PROVIDER`. |
| `service-account` | string | no | `""` | Signer service account. Falls back to `vars.ALPHACI_RELEASE_SIGNER_SERVICE_ACCOUNT`. |

## Secrets

| Secret | Required | Description |
| --- | --- | --- |
| `ALPHACI_TOKEN` | yes | Project CI token. |
| `ALPHACI_API_URL` | no | AlphaCI base URL when `api-url` is not set. |
| `ALPHACI_RELEASE_SIGNING_KEY` | no | Lab only. PEM EC P-256 private key, used when no KMS key version is set. The job warns when it is used. |

Repository variables read when the matching input is empty: `ALPHACI_RELEASE_KMS_KEY_VERSION`, `ALPHACI_GCP_WORKLOAD_IDENTITY_PROVIDER`, `ALPHACI_RELEASE_SIGNER_SERVICE_ACCOUNT`.

## Outputs

| Output | Description |
| --- | --- |
| `manifest-sha256` | Lowercase hex SHA-256 of the canonical manifest that was signed. |

## Permissions

Workflow: `contents: read`. Job `sign`: `contents: read`, `id-token: write`. The calling job must grant `id-token: write`.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `sign` | Always | Validates inputs and picks the mode (`kms` if a key version is set, else `key` if the lab secret is set, else fails). Reads the release, builds and canonicalizes the manifest, signs it and `PUT`s it back to AlphaCI. |

## Example

What AlphaCI generates when Cloud KMS signing is configured:

```yaml
jobs:
  sign-release:
    needs: [register-release]
    permissions:
      contents: read
      id-token: write
    uses: Alpha-Explora/alphaci-workflow/.github/workflows/sign-release.yml@v1
    with:
      release-id: ${{ needs.register-release.outputs.release-id }}
      api-url: https://alphaci.example.com
      workload-identity-provider: projects/123/locations/global/workloadIdentityPools/pool/providers/github
      service-account: release-signer@project.iam.gserviceaccount.com
    secrets:
      ALPHACI_TOKEN: ${{ secrets.ALPHACI_TOKEN }}
      ALPHACI_RELEASE_SIGNING_KEY: ${{ secrets.ALPHACI_RELEASE_SIGNING_KEY }}
```

Pass secrets by name. `secrets: inherit` only works between repositories in the same organization, and this repository is in a different one from customer repositories.

## Notes

- The release must be pinned to a 40-character commit and every artifact to a `sha256:` digest, or the job fails.
- Manifest: schema version 1, fields `releaseId`, `projectId`, `sourceEnvironmentId`, `sourceBranch`, `commitSha`, `createdAt`, `artifacts[] {slot, image, digest}` and `workflowRun {provider, repo, runId, url}`. The schema is published by the backend in `docs/architecture/onprem-release-manifest-schema.json`.
- The signed bytes are the RFC 8785 canonical JSON of the manifest, produced with `jq -cSj`. `scripts/validate-release-manifest-canonical.cjs` checks this against the backend's test vector.
- Signature: DER ECDSA P-256 over SHA-256, base64 encoded, sent as algorithm `ecdsa-p256-sha256`. With KMS, `keyId` is the key version resource name and the key must be `EC_SIGN_P256_SHA256`. With the lab key, `keyId` is `sha256:` plus the hex SHA-256 of the DER public key.
- AlphaCI endpoints, both with `Authorization: Bearer <ALPHACI_TOKEN>`:
  - `GET {base}/api/v1/ci/releases/{releaseId}?repo=<owner/repo>` reads the release.
  - `PUT {base}/api/v1/ci/releases/{releaseId}/manifest` with `{repoFullName, manifest, manifestSha256, signature}`.
- When the first environment is delivered by an on-prem host and signing fails, the generated `report-signing-failure` job marks the deployment failed in AlphaCI.
- A host verifies with its pinned public key:

  ```bash
  jq -cSj '.manifest' envelope.json > canonical.json
  jq -r '.signature.value' envelope.json | base64 -d > signature.der
  openssl dgst -sha256 -verify release-signing.pub.pem -signature signature.der canonical.json
  ```
