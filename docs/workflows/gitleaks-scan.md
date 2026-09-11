# gitleaks-scan.yml

## Role
Primitive check.

## Purpose
Scans for committed secrets with Gitleaks and reports the rule and location of each finding.

## Public Contract
- Source workflow: `.github/workflows/gitleaks-scan.yml`
- Inputs: `working-directory`, `system-name`, `gitleaks-version`, `fail-on-findings`, `scan-history`, `checkout-ref`
- Secrets: none
- Outputs: `secrets-result`, `findings-count`

## Usage
Language-agnostic, so it is the same job for every stack — a secret in a `.cs` file and a secret in a `.ts` file are the same problem. Call it in parallel with the other quality checks. Use `checkout-ref` in `workflow_run` chains.

`fail-on-findings` is what a branch policy moves: report-only on the working branch, fatal on the promoted ones. It loosens the gate rather than removing it — a finding is still reported, and the artifact is still uploaded.

`scan-history` scans every commit instead of the working tree. Off by default because it is slow on a large repository and because it surfaces secrets that were removed long ago. That is not noise — a deleted secret is still a leaked secret until it is rotated — but it is a backlog to work through rather than a gate to put in front of today's push.

## Why the release binary rather than gitleaks-action
`gitleaks-action` requires a paid `GITLEAKS_LICENSE` for organisation-owned repositories. The scanner itself is free; only that wrapper is not. The pinned release binary keeps a scan reproducible and costs nothing.

## Two failure modes that must stay distinct
Gitleaks exits non-zero when it finds a secret, which is the same signal as the scanner failing to run. Conflated, a broken scan reads as a clean repository — the most dangerous possible misreport for a security gate.

So the workflow passes `--exit-code 0` and decides for itself: the scanner's own exit status and a missing report are both treated as a **failed scan**, never as a clean one, regardless of `fail-on-findings`.

## The secret values are never printed
`--redact` is always on, and the log prints only the rule id and `file:line`. A scan that echoes what it found has leaked the secret a second time, into a place more people can read. The uploaded artifact is redacted for the same reason.
