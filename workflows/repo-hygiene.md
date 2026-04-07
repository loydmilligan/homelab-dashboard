# Repo Hygiene Workflow

**Document Version:** 1.0.0
**Last Updated:** 2026-04-06

This workflow defines the active surface of the repo.

## Folder Roles

- `docs/`: active product and reference documentation
- `docs/prio/`: planning and prioritization materials
- `workflows/`: active operating procedures
- `ARCHIVE/`: retained but inactive historical material
- `TRASH/`: inactive material pending deletion or intentionally removed from the active surface

## Active Surface Rule

Files in the active surface must be one of:

- used by the app
- used by active repo workflows
- necessary product/reference documentation

If a file is no longer active, move it instead of leaving it in place.

## Archive Vs Trash

Use `ARCHIVE/` when:

- the material may still be useful for historical reference
- the content is superseded but worth retaining
- the file explains prior design or repo state

Use `TRASH/` when:

- the file is dead code
- the file is repo junk
- the file should likely be deleted after one or two review passes

## Sensitive Material

Do not keep live secrets in the repo.

If sensitive material is discovered:

1. remove it from the active surface immediately
2. redact any retained copy
3. treat the original values as compromised

## Cleanup Review Checklist

Before calling cleanup complete:

1. dead files are out of active folders
2. planning docs are out of the main docs surface when they are not active execution docs
3. active docs point to current paths
4. no duplicate canonical document locations remain
