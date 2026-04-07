# Documentation Management Workflow

**Document Version:** 1.1.0
**Last Updated:** 2026-04-06

This workflow governs where docs belong and how they stay current.

## Classification

- `docs/`: active product and reference docs
- `docs/prio/`: prioritization, roadmap, planning, and state-assessment docs
- `workflows/`: active operating procedures for the repo
- `ARCHIVE/`: retained historical or superseded material
- `TRASH/`: inactive files pending deletion or intentionally removed from the active surface

## Placement Rule

Put a process in `workflows/` when any of these are true:

- it is recurring
- it spans multiple files or roles
- it has verification or hand-off steps
- getting it wrong would create drift or repo debt

Keep guidance in `CLAUDE.md` and `agents.md` when it is short, stable repo policy rather than an operational procedure.

## Update Rules

When changing behavior that affects active operation:

1. Update the relevant file in `workflows/`
2. Update `CLAUDE.md` and `agents.md` if the change affects agent behavior
3. Update `README.md` if top-level navigation changed
4. Move stale docs to `ARCHIVE/` or `TRASH/` instead of leaving duplicates in active folders
5. Follow `workflows/versioning-and-changelog.md` for document version and changelog updates

## Document Metadata

Active repo docs should include:

- `Document Version`
- `Last Updated` when the document is process-bearing or likely to drift over time

Use the versioning rules in `workflows/versioning-and-changelog.md`.

## Planning Docs

Planning docs in `docs/prio/` are not automatically current.

Before executing from them:

1. compare them to the codebase
2. confirm they still reflect reality
3. promote or rewrite only the parts that are still valid

## Changelog Rule

When a commit materially changes product behavior, workflows, or repo structure:

1. decide whether the change belongs in `docs/CHANGELOG.md`
2. update the changelog before calling the repo clean
3. keep in-progress work under `Unreleased` until it is actually committed

## Review Trigger

Open a process issue when:

- a doc was misleading
- a process was followed incorrectly because the docs were weak
- a file lived in the wrong area long enough to cause confusion
