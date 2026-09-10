/**
 * Runs the ESLint problem matcher embedded in lint-check.yml against sample
 * output.
 *
 * The matcher is JSON inside a heredoc inside a YAML block, so nothing else
 * can reach it — and a regex that silently matches nothing produces a lint
 * failure with no annotations, which is indistinguishable from having no
 * matcher at all. This parses it exactly as the runner would and applies the
 * patterns the way the runner applies them.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'lint-check.yml'),
  'utf8',
);

const START = "<<'MATCHER'\n";
const startIndex = workflow.indexOf(START);
assert.notEqual(startIndex, -1, 'lint-check.yml must embed the ESLint matcher');
const body = workflow
  .slice(startIndex + START.length)
  .split('          MATCHER')[0];

const raw = body
  .split('\n')
  .map((line) => (line.startsWith(' '.repeat(10)) ? line.slice(10) : line))
  .join('\n');

const matcher = JSON.parse(raw);
const [definition] = matcher.problemMatcher;
assert.equal(definition.owner, 'alphaci-eslint-stylish');

const [filePattern, findingPattern] = definition.pattern;
const fileRe = new RegExp(filePattern.regexp);
const findingRe = new RegExp(findingPattern.regexp);
assert.equal(findingPattern.loop, true, 'one heading must cover many findings');

// ESLint's default "stylish" output, with a Windows path and a POSIX one.
const sample = [
  '',
  'C:\project\eslint.config.mjs',
  '  51:1  warning  Assign object to a variable before exporting  import/no-anonymous-default-export',
  '',
  '/home/runner/work/app/app/src/index.ts',
  "  12:7   error    'unused' is assigned a value but never used  @typescript-eslint/no-unused-vars",
  '  40:1   warning  Missing return type on function              @typescript-eslint/explicit-function-return-type',
  '',
  '2 problems (1 error, 1 warning)',
];

let currentFile = null;
const annotations = [];
for (const line of sample) {
  const finding = findingRe.exec(line);
  if (finding && currentFile) {
    annotations.push({
      file: currentFile,
      line: finding[findingPattern.line],
      severity: finding[findingPattern.severity],
      message: finding[findingPattern.message].trim(),
      code: finding[findingPattern.code],
    });
    continue;
  }
  const heading = fileRe.exec(line);
  if (heading) currentFile = heading[filePattern.file];
}

assert.equal(annotations.length, 3, 'every finding must be annotated');

assert.match(annotations[0].file, /eslint\.config\.mjs$/);
assert.equal(annotations[0].line, '51');
assert.equal(annotations[0].severity, 'warning');
assert.equal(annotations[0].code, 'import/no-anonymous-default-export');

// The rule name is separated from the message by two or more spaces, and the
// message itself contains single spaces. Splitting on one space would fold the
// rule into the message and lose it.
assert.equal(annotations[1].severity, 'error');
assert.equal(annotations[1].message, "'unused' is assigned a value but never used");
assert.equal(annotations[1].code, '@typescript-eslint/no-unused-vars');

// Padding varies with the longest message in the file; it must not leak in.
assert.equal(annotations[2].message, 'Missing return type on function');
assert.equal(annotations[2].code, '@typescript-eslint/explicit-function-return-type');

// A finding line on its own, with no file heading yet, must not be attributed
// to whatever file was last seen in a previous run of the loop.
assert.equal(fileRe.test('  12:7   error    x  some/rule'), false,
  'an indented finding must not be mistaken for a file heading');

console.log('ESLint problem matcher contract OK');
