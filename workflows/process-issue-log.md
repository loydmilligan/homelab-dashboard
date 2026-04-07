# Process Issue Log

**Document Version:** 1.1.0
**Last Updated:** 2026-04-06

Use `/add_process_issue` to append new entries.

## Issue Types

- `ambiguity`: the process was unclear or open to interpretation
- `doc-drift`: the docs no longer matched reality
- `missing-step`: a necessary step was absent
- `verification-gap`: the process did not force adequate checking
- `ownership-gap`: it was unclear who should do or update something
- `tooling-gap`: the process should have been supported by a command or script
- `structure-gap`: files lived in the wrong place or lacked a clear home
- `safety-risk`: the process allowed risky handling of secrets, destructive edits, or unsafe defaults
- `overhead`: the process was unnecessarily heavy for the value it provided

## Entry Template

```text
- ID: PI-YYYYMMDD-HHMMSS-MMM
  Status: open
  Type: <issue-type>
  Process: <process-name-or-path>
  Reported: <ISO timestamp>
  Description: <what went wrong>
```

## Open Issues

- ID: PI-20260406-000001
  Status: open
  Type: structure-gap
  Process: repo-hygiene
  Reported: 2026-04-06T00:00:01Z
  Description: Planning docs, superseded docs, and dead files were left in active repo areas long enough to create drift and cleanup debt.
