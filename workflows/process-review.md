# Process Review Workflow

**Document Version:** 1.0.0
**Last Updated:** 2026-04-06

This workflow is for reviewing how the repo is being operated and tightening the process before drift compounds.

## Inputs

- `workflows/process-issue-log.md`
- recent cleanup pain points
- recent docs drift
- repeated verification misses
- repeated AI-agent confusion

## Review Cadence

Run a process review:

- after a meaningful cleanup pass
- after repeated agent confusion or doc drift
- before starting a new major work phase
- whenever the issue log has enough backlog to justify it

## Review Steps

1. Read the open issues in `workflows/process-issue-log.md`
2. Group them by process area
3. Decide whether the fix belongs in:
   - a workflow file
   - `CLAUDE.md` and `agents.md`
   - repo structure
   - tooling or automation
4. Apply the smallest durable fix
5. Close or reclassify the issue in the log

## Decision Rule

Prefer process changes that:

- reduce drift
- reduce repeated explanation
- reduce ambiguity for future agents
- improve verification discipline

Avoid process bloat for one-off annoyances.

## Output

Each review should leave:

- updated workflow docs when needed
- updated AI control docs when needed
- a shorter open issue queue
