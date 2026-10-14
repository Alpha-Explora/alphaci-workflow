#!/usr/bin/env node
/**
 * The manifest bytes a host verifies are produced in sign-release.yml with
 * `jq -cSj` and recomputed by the AlphaCI backend with its RFC 8785
 * implementation. If the two ever disagree, every signature is rejected. This
 * runs the workflow's exact command over a shared test vector and checks the
 * bytes and hash the backend produces for the same manifest.
 */
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const WORKFLOW = join(__dirname, '..', '.github', 'workflows', 'sign-release.yml');
const COMMAND = 'jq -cSj . manifest.json > canonical.json';

// Deliberately unsorted keys and a non-ASCII branch.
const vector = {
  workflowRun: { url: 'https://github.com/acme/api/actions/runs/42', runId: '42', repo: 'acme/api', provider: 'github_actions' },
  schemaVersion: 1,
  sourceBranch: 'release/\u00e9t\u00e9',
  releaseId: '11111111-1111-4111-8111-111111111111',
  projectId: '22222222-2222-4222-8222-222222222222',
  sourceEnvironmentId: '33333333-3333-4333-8333-333333333333',
  commitSha: 'b'.repeat(40),
  createdAt: '2026-09-28T00:00:00.000Z',
  artifacts: [
    { slot: 'frontend', image: 'ghcr.io/acme/web', digest: 'sha256:' + 'c'.repeat(64) },
    { slot: 'backend', image: 'ghcr.io/acme/api', digest: 'sha256:' + 'a'.repeat(64) },
  ],
};
// Produced by canonicalJson/manifestSha256 in the backend's release-manifest.ts.
const EXPECTED_SHA256 = '26a61a5d5fd343392ff52888ac142e124501fbd0e55e1694043ee2bd25c01d44';

let failed = false;
const fail = (message) => {
  console.error('::error file=.github/workflows/sign-release.yml::' + message);
  failed = true;
};

if (!readFileSync(WORKFLOW, 'utf8').includes(COMMAND)) {
  fail('sign-release.yml no longer canonicalizes with: ' + COMMAND);
}

const canonical = execFileSync('jq', ['-cSj', '.'], { input: JSON.stringify(vector) });
const sha = createHash('sha256').update(canonical).digest('hex');
if (sha !== EXPECTED_SHA256) {
  fail('jq canonical form hashes to ' + sha + ', the backend expects ' + EXPECTED_SHA256);
}

if (failed) process.exit(1);
console.log('Release manifest canonical form matches the backend vector.');
