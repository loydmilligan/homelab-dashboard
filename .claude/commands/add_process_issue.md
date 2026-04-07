Add a new process-review issue to the repo queue.

Usage:

`/add_process_issue -d "<description>" -p "<process>" -t "<type>"`

Valid types:

- `ambiguity`
- `doc-drift`
- `missing-step`
- `verification-gap`
- `ownership-gap`
- `tooling-gap`
- `structure-gap`
- `safety-risk`
- `overhead`

Run:

```bash
node scripts/add-process-issue.mjs $ARGUMENTS
```
