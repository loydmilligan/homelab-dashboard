# Sprint 01 Plan — Overview + Wallboard

**Document Version:** 1.1.0
**Last Updated:** 2026-04-07

## Purpose

This plan defines the first concrete implementation pass for the shared summary surfaces:
- `Overview`
- `Wallboard`

It is intentionally narrower than the full initiative in `ROADMAP.md`.

The goal is to make both surfaces trustworthy and structurally sound before adding richer intelligence, RSS, rotation control, or hardware control.

## Why This Sprint First

These two screens are the product's top summary surfaces.

This sprint was started to fix the foundation first.

## Current State

### Overview At Sprint Start

Current file:
- `src/pages/Overview.tsx`

Current strengths:
- uses real polled state
- shows basic host, service, IoT, backup, and access summaries

Sprint-start weaknesses:
- mixes live and inventory-backed data without saying so
- no shared summary model with Wallboard
- no KPI framing
- no persistent state indicators
- no surfaced issues or suggested actions

### Wallboard At Sprint Start

Current file:
- `src/pages/Wallboard.tsx`

Current strengths:
- fullscreen-friendly shell exists
- host cards and summary stats render

Sprint-start weaknesses:
- duplicates Overview-like summary logic instead of sharing it
- not yet optimized around the original castable wallboard goal
- no structured state-indicator row
- no explicit provenance handling
- no rotation or playlist model yet

## Current Implementation Status

### Implemented In This Branch

- shared summary derivation in `src/lib/summary.ts`
- shared KPI and indicator presentation in `src/components/SummarySurface.tsx`
- Overview and Wallboard now read from the same summary model
- explicit provenance classification for KPI and indicator items
- KPI strip on both summary surfaces
- state-indicator row on both summary surfaces
- backup freshness and host-pressure derived signals
- access-path KPI and inventory-backed access indicators
- notification readiness summary surfaced through `/api/state`
- summary derivation tests in `tests/summary.test.ts`

### Still Remaining Inside Sprint 01

- final visual/manual validation on actual cast hardware or TV distance
- decide whether any remaining secondary signal content should be trimmed further
- checkpoint and document the sprint as complete once the branch is committed

## Sprint Boundaries

### In Scope

- define one shared summary model for Overview and Wallboard
- define provenance rules for summary data
- make both screens use the same summary logic
- add the first KPI strip
- add the first state indicators
- improve layout/readability for desktop and TV use
- keep the screens workable at smaller widths

### Out Of Scope

- RSS/news panel
- suggested actions
- anomaly feed
- success feed
- wallboard auto-rotation
- Chromecast session control
- ESP32 or external-controller integration

## Shared Summary Model

This sprint added a shared summary layer instead of letting each page derive its own view ad hoc.

Implemented location:
- `src/lib/summary.ts`

Suggested outputs:

### KPI Summary

- hosts online / degraded / offline
- services online / degraded / offline
- backup health count
- backup freshness count
- high-pressure hosts count
- degraded access-path count

### State Indicators

Always-visible compact indicators for conditions like:
- Cloudflare access healthy
- Tailscale access healthy
- backups fresh enough
- notifications configured and healthy
- secrets with overdue rotation present

Important rule:
- if a signal is inventory-backed or inferred, label or style it differently from truly live state

### Provenance Metadata

Each surfaced summary item should be classified as:
- `live`
- `inferred`
- `inventory`
- `mixed`

This does not need to be exposed as raw text everywhere, but the UI must use it for tone, labels, and styling.

## UI Shape

### Overview Target Structure

1. Hero / intro
2. KPI strip
3. State indicators row
4. Short host pressure / health summary
5. Backup summary
6. Access / connectivity summary
7. Last updated + data-quality note

This sprint should stop here.

Do not yet add:
- actions
- RSS
- anomalies feed

### Wallboard Target Structure

1. Title + overall status banner
2. KPI strip scaled for TV readability
3. State indicators row
4. Host cards
5. Optional compact secondary strip for backups or connectivity
6. last-updated footer

Important:
- wallboard text must be readable from distance
- do not overload the first pass with too many panels

## Implementation Steps

### Sprint 1A — Shared Model + Truthfulness

Status:
- `Completed in this branch`

1. Create summary derivation helpers
   - convert `DashboardState` into a shared summary object
   - centralize counts and status rollups
   - centralize provenance classification

2. Define summary types
   - add types for KPI items
   - add types for state indicators
   - add provenance typing

3. Refactor Overview to use the shared summary object
   - replace page-local rollups
   - add provenance-aware labels

4. Refactor Wallboard to use the same shared summary object
   - remove duplicate page-local rollups
   - make overall status derive from the shared summary logic

5. Add data-quality text
   - add a short note explaining mixed live vs inventory-backed state

### Sprint 1B — First Summary UI Pass

Status:
- `Mostly completed in this branch`

1. Add KPI strip to Overview
2. Add KPI strip to Wallboard
3. Add state indicators row to both
4. Tune spacing, density, and readability
5. Verify smaller-width behavior for Overview
6. Verify cast-friendly behavior for Wallboard

## Candidate KPI Items

These are the best first-pass KPI candidates because they map to current available state.

- Hosts healthy
- Wapps healthy
- Backups healthy
- Backups stale or overdue
- Hosts under pressure
- Access paths degraded

Notes:
- `Backups stale or overdue` may need light derived logic if not already explicit
- `Hosts under pressure` can initially be inferred from RAM, CPU, disk, or temperature thresholds

## Candidate State Indicators

First-pass indicator candidates:

- Cloudflare path status
- Tailscale path status
- backup freshness
- notification channel readiness
- secrets rotation risk present

Implementation note:
- some of these may initially be `mixed` or `inventory` quality
- that is acceptable if the UI is honest about it

## File-Level Plan

Expected primary files:

- `src/pages/Overview.tsx`
- `src/pages/Wallboard.tsx`
- `src/types/inventory.ts`
- `src/lib/summary/*` new shared summary helpers

Likely supporting files:

- `src/components/Card.tsx`
- `src/components/StatusChip.tsx`
- shared presentation helpers for KPI or indicator rendering if needed

Possible backend follow-up:

- no backend changes are strictly required for Sprint 1A
- small backend changes may become useful for backup freshness or indicator quality if current state is too weak

## Acceptance Criteria

### Shared Foundation

- Overview and Wallboard use the same summary derivation logic
- summary counts are not duplicated ad hoc in each page
- provenance is handled explicitly

### Overview

- KPI strip exists
- state indicators row exists
- mixed vs live signals are clearer than before
- page remains readable on laptop-width screens

### Wallboard

- KPI strip exists
- state indicators row exists
- host cards remain readable on TV-scale display
- wallboard feels intentionally designed for casting, not like a stretched desktop page

### Branch Assessment

- Shared Foundation: `met`
- Overview: `met`
- Wallboard: `met in code, pending final real-world cast validation`

## Risks

- forcing too much intelligence into the first pass will bloat the sprint
- provenance may expose that some summary signals are weaker than expected
- wallboard readability may require different density choices than Overview

## Follow-On Work

After this sprint:

- add surfaced issues, successes, and suggested actions
- add RSS or external signal highlights
- add wallboard auto-rotation and playlists
- consider Chromecast-oriented session control
- later explore external controller support such as ESP32

## RSS Note

No RSS content is needed for this sprint.

If RSS becomes the next follow-on item, useful candidates would be:
- Ubuntu security notices
- Cloudflare incident status
- Tailscale incident or release notes
- Home Assistant release highlights
