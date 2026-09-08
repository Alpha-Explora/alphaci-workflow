# coverage-gate

Composite action. Reads a line-coverage percentage from a report and enforces a threshold.

## Why it exists

Every coverage gate in this repository used to inline a parse of Istanbul's
`coverage/coverage-summary.json`. That is the output of one JavaScript tool, so the gate was one only
JavaScript could pass. Adding a stack whose runner emits anything else meant either shipping it without
coverage enforcement or rewriting the gate — and the first of those is what tends to happen.

## Contract

- Source: `.github/actions/coverage-gate/action.yml`
- Required inputs: `report-path`
- Optional inputs: `format` (`istanbul-summary` | `cobertura` | `lcov` | `jacoco`), `threshold`,
  `enforce`, `working-directory`
- Outputs: `coverage`

## Formats

| Format | Emitted by | Read from |
|---|---|---|
| `istanbul-summary` | Jest, Vitest, nyc (with the `json-summary` reporter) | `total.lines.pct` |
| `cobertura` | Coverlet, coverage.py, many others | `line-rate` on `<coverage>` |
| `lcov` | most runners | `LF`/`LH` records, summed across files |
| `jacoco` | Maven, Gradle | the largest `type="LINE"` counter, which is the report total |

`istanbul-summary` is the default so existing JavaScript callers are unaffected.

## Notes

- Runs as a composite action rather than a reusable workflow because the report is a file in the
  workspace: a reusable workflow runs in its own job and would not see it.
- A missing report is reported differently from low coverage. One means the test command is not emitting
  the expected format — usually a reporter that was never configured — and the other means the code is
  under-tested.
- `lcov` percentages are summed across records rather than averaged per file, so a small file cannot
  weigh as much as a large one. This matches how the other formats compute their totals.
