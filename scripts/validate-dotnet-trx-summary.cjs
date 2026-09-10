/**
 * Runs the TRX summariser embedded in dotnet-test.yml against fixtures.
 *
 * The parser is inline Python inside a YAML block, so nothing else can reach
 * it — and a mistake there is invisible until a real pipeline reports the wrong
 * numbers. This extracts the script exactly as the workflow defines it and
 * exercises the two cases that are easy to get wrong: the VSTest XML namespace,
 * and the byte-identical TRX copy the trx logger stages, which naive globbing
 * counts twice.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const workflow = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'dotnet-test.yml'),
  'utf8',
);

const START = 'python3 - >> "$GITHUB_OUTPUT" <<\'PYEOF\'\n';
const startIndex = workflow.indexOf(START);
assert.notEqual(startIndex, -1, 'dotnet-test.yml must embed the TRX summariser');
const rest = workflow.slice(startIndex + START.length);
const body = rest.slice(0, rest.indexOf('PYEOF'));

// Strip the YAML block indentation the heredoc carries.
const parser = body
  .split('\n')
  .map((line) => (line.startsWith(' '.repeat(10)) ? line.slice(10) : line))
  .join('\n');

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'trx-'));
const trx = `<?xml version="1.0" encoding="utf-8"?>
<TestRun id="x" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Results>
    <UnitTestResult testName="Orders.Tests.HealthTests.ReturnsOk" outcome="Passed" />
    <UnitTestResult testName="Orders.Tests.HealthTests.ReturnsName" outcome="Failed">
      <Output><ErrorInfo><Message>Assert.Equal() Failure
Expected: orders
Actual:   null</Message></ErrorInfo></Output>
    </UnitTestResult>
  </Results>
  <ResultSummary outcome="Failed">
    <Counters total="2" executed="2" passed="1" failed="1" />
  </ResultSummary>
</TestRun>
`;

fs.mkdirSync(path.join(workspace, 'TestResults', 'proj1'), { recursive: true });
// The staged duplicate the trx logger writes. Counting it doubles every number.
fs.mkdirSync(path.join(workspace, 'TestResults', 'guid', 'In', 'runner'), {
  recursive: true,
});
fs.writeFileSync(path.join(workspace, 'TestResults', 'proj1', 'r.trx'), trx);
fs.writeFileSync(
  path.join(workspace, 'TestResults', 'guid', 'In', 'runner', 'r.trx'),
  trx,
);

const parserPath = path.join(workspace, 'parser.py');
fs.writeFileSync(parserPath, parser);

const python = process.platform === 'win32' ? 'python' : 'python3';
const run = spawnSync(python, [parserPath], { cwd: workspace, encoding: 'utf8' });
assert.equal(run.status, 0, `summariser failed: ${run.stderr}`);

const output = Object.fromEntries(
  run.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf('=');
      // Trimmed because a Windows shell captures a trailing CR that the
      // Linux runner does not; the contract is about the values, not the EOL.
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
);

assert.equal(output['tests-total'], '2', 'the duplicate TRX must not be counted twice');
assert.equal(output['tests-passed'], '1');
assert.equal(output['tests-failed'], '1');

const failures = JSON.parse(output['tests-failures']);
assert.equal(failures.length, 1);
assert.equal(failures[0].name, 'Orders.Tests.HealthTests.ReturnsName');
assert.match(failures[0].message, /Assert\.Equal\(\) Failure/);
// A newline here would break the GITHUB_OUTPUT key=value contract.
assert.equal(failures[0].message.includes('\n'), false, 'messages must be one line');

// No report at all — a build failure — must summarise to zeroes, not crash.
const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'trx-empty-'));
fs.writeFileSync(path.join(empty, 'parser.py'), parser);
const bare = spawnSync(python, [path.join(empty, 'parser.py')], {
  cwd: empty,
  encoding: 'utf8',
});
assert.equal(bare.status, 0, `summariser must tolerate no reports: ${bare.stderr}`);
assert.match(bare.stdout, /tests-total=0/);
assert.match(bare.stdout, /tests-failures=\[\]/);

fs.rmSync(workspace, { recursive: true, force: true });
fs.rmSync(empty, { recursive: true, force: true });
console.log('dotnet TRX summariser contract OK');
