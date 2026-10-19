# coverage-gate

Composite action. Reads a line-coverage percentage from a report and enforces a threshold. It
supports several report formats, so stacks other than JavaScript get the same gate.

- Source: `.github/actions/coverage-gate/action.yml`
- Used by: `backend-tests.yml`, `dotnet-test.yml`, `sonarcloud-dotnet-scan.yml`

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `report-path` | yes | | Coverage report, relative to `working-directory`. |
| `format` | no | `istanbul-summary` | `istanbul-summary`, `cobertura`, `lcov` or `jacoco`. |
| `threshold` | no | `80` | Minimum line coverage percentage. |
| `enforce` | no | `true` | Fail when coverage is below `threshold` or the report is missing. |
| `promotion-threshold` | no | `0` | Threshold uat and main require. Coverage that meets `threshold` but not this gets a warning, never a failure. `0` turns it off. |
| `working-directory` | no | `.` | Directory the report path is relative to. |

## Outputs

| Output | Description |
| --- | --- |
| `coverage` | Line coverage percentage, or `unknown` when the report is missing and `enforce` is `false`. |

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
