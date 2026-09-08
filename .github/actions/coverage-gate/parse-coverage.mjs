#!/usr/bin/env node
/**
 * Read a line-coverage percentage out of a report, whichever format produced it.
 *
 * Every coverage gate in this repository used to inline a parse of Istanbul's
 * coverage-summary.json. That is not a neutral choice: it is the output of one
 * JavaScript tool. Coverlet emits Cobertura, JaCoCo emits its own XML, and most
 * runners can emit lcov. A gate that only understands one of them is a gate only
 * one language can pass, which is why adding a non-JavaScript stack meant either
 * shipping without coverage enforcement or rewriting the gate.
 *
 * Formats are read with targeted string matching rather than a full XML parse so
 * this action needs no dependencies and no install step.
 */
import { readFileSync } from 'node:fs';

const SUPPORTED = ['istanbul-summary', 'cobertura', 'lcov', 'jacoco'];

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

/** Istanbul: { total: { lines: { pct: 87.5 } } } */
function fromIstanbulSummary(text) {
  const data = JSON.parse(text);
  const pct = data?.total?.lines?.pct;
  if (typeof pct !== 'number' || !Number.isFinite(pct)) {
    fail('Istanbul summary has no numeric total.lines.pct.');
  }
  return pct;
}

/** Cobertura (Coverlet, coverage.py): <coverage line-rate="0.875" ...> */
function fromCobertura(text) {
  const match = text.match(/<coverage[^>]*\sline-rate="([0-9.]+)"/);
  if (!match) {
    fail('Cobertura report has no line-rate attribute on <coverage>.');
  }
  return Number(match[1]) * 100;
}

/**
 * lcov: LF (lines found) and LH (lines hit) per record. Summed across records,
 * because a per-record percentage would weight small files equally with large
 * ones and disagree with every other format.
 */
function fromLcov(text) {
  let found = 0;
  let hit = 0;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('LF:')) found += Number(line.slice(3)) || 0;
    else if (line.startsWith('LH:')) hit += Number(line.slice(3)) || 0;
  }
  if (found === 0) {
    fail('lcov report contains no LF records, so there are no lines to cover.');
  }
  return (hit / found) * 100;
}

/**
 * JaCoCo: <counter type="LINE" missed="10" covered="90"/> appears per class, per
 * package, and once for the whole report. The report-level counter is the sum of
 * the others, so the entry with the largest total is the aggregate regardless of
 * where it sits in the document.
 */
function fromJacoco(text) {
  const counters = [...text.matchAll(/<counter[^>]*type="LINE"[^>]*\/?>/g)].map(
    (m) => {
      const missed = Number(m[0].match(/missed="(\d+)"/)?.[1] ?? 0);
      const covered = Number(m[0].match(/covered="(\d+)"/)?.[1] ?? 0);
      return { missed, covered, total: missed + covered };
    },
  );

  const aggregate = counters.sort((a, b) => b.total - a.total)[0];
  if (!aggregate || aggregate.total === 0) {
    fail('JaCoCo report contains no LINE counters.');
  }
  return (aggregate.covered / aggregate.total) * 100;
}

const PARSERS = {
  'istanbul-summary': fromIstanbulSummary,
  cobertura: fromCobertura,
  lcov: fromLcov,
  jacoco: fromJacoco,
};

const format = (process.env.COVERAGE_FORMAT || '').trim();
const reportPath = (process.env.COVERAGE_REPORT_PATH || '').trim();

if (!SUPPORTED.includes(format)) {
  fail(`Unsupported coverage format '${format}'. Use one of: ${SUPPORTED.join(', ')}.`);
}

let text;
try {
  text = readFileSync(reportPath, 'utf8');
} catch {
  fail(
    `Coverage report not found at '${reportPath}'. The test command must be configured to emit ${format}; a runner's default reporters usually do not include it.`,
  );
}

const coverage = PARSERS[format](text);
process.stdout.write(String(Math.round(coverage * 100) / 100));
