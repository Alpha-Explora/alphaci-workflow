# dotnet-audit.yml

## Role
Security check.

## Purpose
Audits NuGet dependencies, direct and transitive, against known advisories and fails at a configurable severity.

## Public Contract
- Source workflow: `.github/workflows/dotnet-audit.yml`
- Inputs: `working-directory`, `system-name`, `dotnet-version`, `solution-path`, `fail-on-severity`, `include-transitive`, `upload-artifact`, `checkout-ref`
- Secrets: none
- Outputs: `audit-result`, `vulnerability-count`

## Usage
This is the .NET counterpart of `security-scan.yml`. `fail-on-severity` takes `Low`, `Moderate`, `High`, `Critical`, or `none` to report without failing. The default is `High`.

## Why the exit code is not the gate
`dotnet list package --vulnerable` exits `0` whether or not it finds anything. A clean report and a High-severity advisory are indistinguishable to the shell, so a workflow that trusted the exit code would pass silently on a vulnerable dependency. This workflow writes the report as JSON and decides from its contents.

Two consequences of that decision are deliberate:

- **Findings are deduplicated by package, version and advisory.** The same package is listed once per project that resolves it and again as a transitive of every dependent project, so counting rows would report one bad package as a dozen findings.
- **An unrecognised severity blocks.** If NuGet introduces a severity name this workflow does not know, it is treated as above the threshold rather than ignored, so a new name cannot become a silent pass.

The raw report is uploaded as `<system-name>-dotnet-audit` for triage.
