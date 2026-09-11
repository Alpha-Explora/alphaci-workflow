# dotnet-sbom.yml

## Role
Primitive check.

## Purpose
Exports a CycloneDX software bill of materials for the resolved NuGet graph and keeps it as a release record.

## Public Contract
- Source workflow: `.github/workflows/dotnet-sbom.yml`
- Inputs: `working-directory`, `system-name`, `dotnet-version`, `solution-path`, `require-sbom`, `tool-version`, `retention-days`, `checkout-ref`
- Secrets: none
- Outputs: `sbom-result`, `component-count`

## Usage
Call it in parallel with the other quality checks. Use `checkout-ref` in `workflow_run` chains.

`require-sbom` is what a branch policy moves: report-only on the working branch, required on the promoted ones. `retention-days` defaults to 90 rather than the usual 7 — this artifact is the evidence record for a release, and it is wanted long after the run that produced it has stopped being interesting.

## This one judges nothing
Every other check in the stage has a pass condition. An SBOM does not: it is a record, not a verdict. What can go wrong is producing no record at all, and on a promoted branch that is a governance failure — a release whose contents nobody can enumerate afterwards, which is precisely what an SBOM exists to prevent.

## An empty SBOM is worse than none
A bill of materials listing zero components is treated as a failure on promoted branches. It looks like evidence and asserts that the build had no dependencies, which is untrue — so it is more misleading than a missing file, which at least announces itself.

## Restore decides the contents
The SBOM describes the resolved graph, so `dotnet restore` runs first. Exported before restore it would describe the declared references rather than the versions actually shipped, which are the ones that matter to whoever reads it after a CVE lands.
