# publish-internal-v1-tag.yml

Moves the floating `internal-v1` tag to the latest commit on the `refactor-internal` branch. An AlphaCI deployment that sets `CENTRAL_WORKFLOW_REF=internal-v1` generates pipelines pinned to this tag, so it can move independently of `v1`. The tag moves only after Workflow Validation passes on that commit.

- Source: `.github/workflows/publish-internal-v1-tag.yml`
- Trigger: `push` to `refactor-internal`, `workflow_dispatch`
- Used by: Repository maintenance

## Inputs

None.

## Secrets

None. The job pushes the tag with the default `GITHUB_TOKEN`.

## Outputs

None.

## Permissions

Workflow: `contents: write`.

Concurrency group `publish-internal-v1-tag` with `cancel-in-progress: true`, so the newest run wins.

## Jobs

| Job | Runs when | What it does |
| --- | --- | --- |
| `validate` | Always | Calls `./.github/workflows/workflow-validation.yml`. |
| `retag` | `validate` succeeded | Checks out with full history, runs `git tag -f internal-v1 $GITHUB_SHA` and force-pushes `refs/tags/internal-v1`. |

## Notes

- The `refactor-internal` branch and the `internal-v1` tag do not exist in this repository today, so the push trigger never fires. A `workflow_dispatch` run would create `internal-v1` on the ref it was started from.
- If validation fails, the tag is not moved.
