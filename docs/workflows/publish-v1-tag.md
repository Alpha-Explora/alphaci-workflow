# publish-v1-tag.yml

Moves the floating `v1` tag to the latest `main` commit. Generated customer pipelines call the reusable workflows at `@v1`, so this is how a merge to `main` reaches them. The tag moves only after Workflow Validation passes on that commit.

- Source: `.github/workflows/publish-v1-tag.yml`
- Trigger: `push` to `main`, `workflow_dispatch`
- Used by: Repository maintenance

## Inputs

None.

## Secrets

None. The job pushes the tag with the default `GITHUB_TOKEN`.

## Outputs

None.

## Permissions

Workflow: `contents: write`.

Concurrency group `publish-v1-tag` with `cancel-in-progress: true`, so the newest run wins.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `validate` | Always | Calls `./.github/workflows/workflow-validation.yml`. |
| `retag` | `validate` succeeded | Checks out with full history, runs `git tag -f v1 $GITHUB_SHA` and force-pushes `refs/tags/v1`. |

## Notes

- If validation fails, `v1` stays on the last commit that passed.
- `workflow_dispatch` retags whatever ref the run was started on. Start it on `main`.
- AlphaCI reads the ref it writes into generated pipelines from `CENTRAL_WORKFLOW_REF` (default `v1`).
