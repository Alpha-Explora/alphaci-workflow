# dotnet-format.yml

## Role
Primitive check.

## Purpose
Verifies C# formatting and style rules with `dotnet format`, without rewriting anything.

## Public Contract
- Source workflow: `.github/workflows/dotnet-format.yml`
- Inputs: `working-directory`, `system-name`, `dotnet-version`, `solution-path`, `fail-on-warning`, `checkout-ref`
- Secrets: none
- Outputs: `format-result`

## Usage
This is the .NET counterpart of `lint-check.yml`. Call it in parallel with tests and analysis. Use `checkout-ref` in `workflow_run` chains.

`fail-on-warning` selects the reported severity: `true` runs at `warn`, `false` at `error`. The relaxed setting still fails on error-level violations, so a branch policy that turns it off is loosening the gate rather than removing it.

Rules come from the repository's own `.editorconfig`. A repository without one is checked against the SDK defaults, which is weaker than it looks; commit an `.editorconfig` to make the standard explicit.

`--verify-no-changes` exits non-zero when anything would change, so the exit code is the result and nothing parses output to decide.
