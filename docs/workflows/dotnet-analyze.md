# dotnet-analyze.yml

## Role
Primitive check.

## Purpose
Builds the solution with .NET analyzers enabled and, on strict branches, refuses to ignore warnings.

## Public Contract
- Source workflow: `.github/workflows/dotnet-analyze.yml`
- Inputs: `working-directory`, `system-name`, `dotnet-version`, `solution-path`, `configuration`, `treat-warnings-as-errors`, `analysis-level`, `checkout-ref`
- Secrets: none
- Outputs: `analyze-result`

## Usage
This occupies the slot `typecheck` fills for Node projects. .NET has no separate type-check step because the compiler is the type checker, so this job is a build that treats what the build says as the result.

`--no-incremental` is passed so analyzers run over every file rather than only what changed, which is what makes the outcome reproducible across runs.

## Relationship to dotnet-audit.yml
NuGet Audit reports vulnerable packages as build warnings `NU1901`-`NU1904`. Under `-warnaserror` those become build errors, which would fail this job for any advisory at any severity and make `dotnet-audit.yml`'s `fail-on-severity` policy unreachable.

They are therefore excluded here with `-warnnotaserror`. Dependency vulnerabilities are `dotnet-audit.yml`'s decision; this job owns compiler and analyzer diagnostics. One tool, one job.
