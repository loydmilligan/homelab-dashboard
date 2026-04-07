# Versioning And Changelog Workflow

**Document Version:** 1.0.0
**Last Updated:** 2026-04-06

This workflow defines how Shost versions app artifacts, documentation, and the repo changelog.

## Version Types

### App Version

- format: `YYYYMMDDHHMM-<git-short-hash>`
- generated at build time
- displayed in the UI footer

### Exporter Version

- format: `<git-short-hash>`
- passed via `EXPORTER_VERSION`
- displayed in exporter-backed host details

### Document Version

- format: `MAJOR.MINOR.PATCH`
- used in workflow docs, top-level repo docs, and AI control docs

### Changelog Release Version

- format: `0.x.y` for the current project stage
- `0.x.y` entries represent committed repo states, not uncommitted working tree drafts

## Document Version Rules

Increment versions like this:

- `PATCH`: wording cleanup, path fixes, formatting, clarifications, minor procedural detail
- `MINOR`: meaningful process change, new section, new rule, or changed expected behavior
- `MAJOR`: document intent or governance changed substantially enough that prior guidance is no longer the same process

Also update `Last Updated` when the document content changes materially.

## Changelog Rules

`docs/CHANGELOG.md` should always contain:

1. an `Unreleased` section for working tree or not-yet-committed changes
2. dated release sections for committed milestones

Use the `Unreleased` section when:

- work is still in the working tree
- a cleanup pass is not yet committed
- content is being staged across multiple commits

Create a dated release entry only when the corresponding repo state is actually committed.

## Changelog Entry Rules

Include entries for:

- user-visible feature changes
- workflow/process additions that affect how the repo is operated
- meaningful repo-structure cleanup
- important fixes

Usually exclude:

- tiny wording-only doc edits
- purely local scratch changes
- low-signal refactors with no practical effect

## Before Commit

When a change materially affects behavior or repo operation:

1. update `docs/CHANGELOG.md` under `Unreleased`
2. update any affected document versions
3. verify the changelog does not claim an uncommitted release

## After Commit

If the commit represents a milestone worth recording as a release:

1. move the relevant `Unreleased` entries into a dated release section
2. leave any remaining in-progress items under `Unreleased`
3. keep the section contents aligned with what was actually committed
