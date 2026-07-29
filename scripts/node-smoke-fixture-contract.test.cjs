const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const starterDirectory = path.join(__dirname, '..', 'starters', 'nodejs');

test('Node starter is a Cloud Run smoke fixture with a health endpoint', () => {
  const source = fs.readFileSync(path.join(starterDirectory, 'src', 'index.ts'), 'utf8');
  const dockerfile = path.join(starterDirectory, 'Dockerfile');

  assert.match(source, /app\.get\('\/healthz'/);
  assert.match(source, /res\.json\(\{ status: 'ok' \}\)/);
  assert.equal(fs.existsSync(dockerfile), true, 'Node starter must provide a Dockerfile');
  assert.match(fs.readFileSync(dockerfile, 'utf8'), /npm run build/);
  assert.match(fs.readFileSync(dockerfile, 'utf8'), /CMD \["npm", "run", "start"\]/);
  assert.equal(fs.existsSync(path.join(starterDirectory, 'package-lock.json')), true, 'Node starter must lock npm dependencies');
  assert.match(fs.readFileSync(dockerfile, 'utf8'), /npm ci/);
  assert.match(fs.readFileSync(dockerfile, 'utf8'), /npm test/);
  assert.equal(fs.existsSync(path.join(starterDirectory, 'eslint.config.mjs')), true, 'Node starter must provide an ESLint flat config');
  assert.match(fs.readFileSync(dockerfile, 'utf8'), /npm run lint/);
  assert.match(fs.readFileSync(dockerfile, 'utf8'), /COPY eslint\.config\.mjs \.\//);
});
