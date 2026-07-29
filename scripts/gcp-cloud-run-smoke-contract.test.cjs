const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const workflowPath = path.join(
  __dirname,
  '..',
  '.github',
  'workflows',
  'gcp-cloud-run-smoke-deploy.yml',
);

test('production smoke deployment stages traffic until the health probe passes', () => {
  assert.equal(fs.existsSync(workflowPath), true, 'smoke workflow must exist');
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /--no-traffic/);
  assert.match(workflow, /gcloud run services update-traffic/);
  assert.match(workflow, /--to-revisions[\s\\]+"?\$\{\{ steps\.service\.outputs\.revision-name \}\}=100/);
  assert.match(workflow, /SOURCE_BRANCH.*main/);
  assert.doesNotMatch(workflow, /preview/i);
  assert.match(workflow, /concurrency:\s*\n\s*group:.*inputs\.cloud-run-service-name/s);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(workflow, /health-result/);
  assert.match(workflow, /steps\.probe\.outputs\.result/);
});

test('production smoke deployment probes its tagged candidate revision', () => {
  assert.equal(fs.existsSync(workflowPath), true, 'smoke workflow must exist');
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /--tag/);
  assert.match(workflow, /--impersonate-service-account="\$\{DEPLOYER_SERVICE_ACCOUNT\}"/);
  assert.match(workflow, /status\.traffic/);
  assert.match(workflow, /candidate-url=/);
  assert.match(workflow, /steps\.service\.outputs\.candidate-url/);
  assert.match(workflow, /--audiences="\$\{\{ steps\.service\.outputs\.url \}\}"/);
  assert.match(workflow, /"\$\{\{ steps\.service\.outputs\.candidate-url \}\}\$\{HEALTH_PATH\}"/);
});
