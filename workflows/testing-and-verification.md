# Testing And Verification Workflow

**Document Version:** 1.0.0
**Last Updated:** 2026-04-06

This workflow defines the minimum verification expected before calling work complete.

## Minimum Verification

For meaningful changes:

1. run `npm run build`
2. run `npm run lint` when the changed area is covered by lint rules
3. check `curl http://localhost:3088/api/health` when the stack is up
4. verify the key affected routes or APIs manually
5. confirm docs still match the implemented state

## Frontend Changes

- load the affected route
- check for obvious console or render failures
- verify the changed controls still work with real state where possible

## Backend Changes

- hit the affected API directly or through the UI
- verify error handling still makes sense
- confirm no stale path or document references remain

## Inventory Or Process Changes

- verify file paths and references
- verify README and AI docs still point to the right locations
- verify moved files are in `ARCHIVE/`, `TRASH/`, or `docs/prio/` as intended

## Cleanup Changes

When cleanup moves files rather than editing runtime code:

1. run `npm run build`
2. run `npm run lint`
3. search for broken references with `rg`
4. review `git status` for unintended deletes or misses

## When Verification Is Deferred

If a check cannot be run, document:

- what was not run
- why it was not run
- what remains at risk
