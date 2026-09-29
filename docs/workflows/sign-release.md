# sign-release.yml

## Role
Deployment.

## Purpose
Signs a release that AlphaCI has registered, so an on-prem host can verify it before pulling any
image. The workflow reads the release from AlphaCI, builds its manifest, signs the canonical
manifest bytes with the AlphaCI Cloud KMS key through keyless workload identity, and attaches the
signed manifest back to the release. No host credential is involved; a host holds only the public key.

## Public Contract
- Source workflow: `.github/workflows/sign-release.yml`
- Inputs: `release-id` (required UUID), `api-url`, `kms-key-version`,
  `workload-identity-provider`, `service-account`
- Secrets: `ALPHACI_TOKEN` (required), `ALPHACI_API_URL` (optional; required when `api-url` is unset)
- Lab-only secret: `ALPHACI_RELEASE_SIGNING_KEY`, a PEM EC P-256 private key. It is used only when
  no KMS key version is set, and the job warns when it is. Client releases use Cloud KMS, whose
  private key never leaves Google Cloud.
- Variables used when the matching input is empty: `ALPHACI_RELEASE_KMS_KEY_VERSION`,
  `ALPHACI_GCP_WORKLOAD_IDENTITY_PROVIDER`, `ALPHACI_RELEASE_SIGNER_SERVICE_ACCOUNT`
- Outputs: `manifest-sha256`
- The calling job must grant `id-token: write` for Cloud KMS signing.

## Usage
Generated package stages call it right after registering a release for the project's first
environment:

```yaml
sign-release:
  needs: [register-release]
  permissions: { contents: read, id-token: write }
  uses: Alpha-Explora/alphaci-workflow/.github/workflows/sign-release.yml@v1
  with:
    release-id: ${{ needs.register-release.outputs.release-id }}
    api-url: https://api.alphaci.example
  secrets: inherit
```

## Manifest and signature
The manifest is schema version 1 as published by the backend in
`docs/architecture/onprem-release-manifest-schema.json`. The signed bytes are the RFC 8785 canonical
JSON of that manifest, produced here with `jq -cSj`. That is exact for this shape (ASCII keys,
integers, UTF-8 strings) and is checked against the backend's canonicalization by
`scripts/validate-release-manifest-canonical.cjs` using a shared test vector. The KMS key must be an
`EC_SIGN_P256_SHA256` key; the signature is the DER ECDSA value, base64 encoded, sent as algorithm
`ecdsa-p256-sha256` with the key version resource name as `keyId`.
With the lab key, the signature has the same format and `keyId` is `sha256:` followed by the
hex SHA-256 of the DER public key.

A host verifies with the pinned public key before pulling:

```bash
jq -cSj '.manifest' envelope.json > canonical.json
jq -r '.signature.value' envelope.json | base64 -d > signature.der
openssl dgst -sha256 -verify release-signing.pub.pem -signature signature.der canonical.json
```

## Platform contract
- `GET /api/v1/ci/releases/{releaseId}?repo=<owner/repo>` reads the registered release.
- `PUT /api/v1/ci/releases/{releaseId}/manifest` attaches `{repoFullName, manifest, manifestSha256,
  signature}`. AlphaCI recomputes the hash, refuses a manifest that does not restate the release,
  and refuses a second, different signed manifest.

## Failure behavior
A release that is not pinned to a full commit and image digests, a malformed key version, a failed
KMS call, or a refused attachment fails the job. An unsigned release cannot be promoted.
