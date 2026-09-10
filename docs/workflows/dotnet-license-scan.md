# dotnet-license-scan.yml

## Role
Primitive check.

## Purpose
Inventories the licences of the resolved NuGet graph and fails when one is on the forbidden list.

## Public Contract
- Source workflow: `.github/workflows/dotnet-license-scan.yml`
- Inputs: `working-directory`, `system-name`, `dotnet-version`, `solution-path`, `forbidden-licenses`, `fail-on-forbidden`, `tool-version`, `checkout-ref`
- Secrets: none
- Outputs: `license-result`, `forbidden-count`

## Usage
Call it in parallel with the other quality checks. Use `checkout-ref` in `workflow_run` chains.

`fail-on-forbidden` is what a branch policy moves: report-only on the working branch, fatal on the promoted ones. The inventory artifact is uploaded either way, because the licence record is wanted even when nothing is wrong.

`forbidden-licenses` defaults to the strong copyleft terms — `GPL-2.0`, `GPL-3.0`, `AGPL-3.0`, `SSPL-1.0` — whose obligations a hosted service usually cannot meet. It is an input rather than a constant because the answer is a legal decision per organisation, not a technical one.

## The policy is here, not in the tool
`dotnet-project-licenses` reports what the licences ARE. Which of them are acceptable is the platform's decision, so the matching lives in this workflow: it is reviewable in a diff, and it can differ per branch. The tool produces data; the workflow judges it — the same split `dotnet-audit.yml` uses for severities.

## Transitive is the point
`--include-transitive` is not an optimisation. A forbidden licence is almost never a direct `PackageReference`; it arrives three levels down, which is exactly why reading the csproj never finds it.

## Unknown is not the same as forbidden
A package that reports no licence is counted and warned about separately, never folded into the forbidden count. "We could not tell" is a different problem from "this one is disallowed", and mixing them buries the real hits in noise. An empty inventory file is treated as a failed scan rather than a clean one.
