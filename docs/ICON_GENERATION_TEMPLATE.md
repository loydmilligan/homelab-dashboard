# Shost Icon Generation Template

**Document Version:** 1.0.0
**Last Updated:** 2026-04-04

## Purpose

Use this template to generate branded section icons for Shost.

The goal is a cohesive icon set for the app's main navigation and key views that feels:
- compact
- slightly glossy
- high-contrast
- readable at small sizes
- useful in a dashboard context

These icons should support the product's visual direction:
- colorful
- layered
- slightly shiny or luminous
- more expressive than flat system icons
- still practical and legible

## Prompt Template

Replace the bracketed fields with values from the table below.

```text
Create a single app icon for a homelab dashboard called "[ICON_NAME]".

Visual concept:
- primary idea: [PRIMARY_CONCEPT]
- secondary cues: [SECONDARY_CUES]
- emotional tone: practical, polished, slightly futuristic, personal-tooling, not corporate

Style:
- high-contrast icon on a transparent background
- square composition, centered subject
- bold readable silhouette at small sizes
- layered depth, soft reflections, subtle glossy highlights
- rich color accents using [PRIMARY_COLOR] and [ACCENT_COLOR]
- dark details are acceptable, but the icon must still read clearly on dark UI
- avoid photorealism
- avoid text, letters, words, numbers
- avoid clutter, thin linework, tiny details, or busy backgrounds
- avoid generic enterprise SaaS icon style

Rendering guidance:
- clean polished illustration style
- slight 3D depth or embossed feel
- subtle glow or shimmer where appropriate
- crisp edges
- transparent background

The icon should visually communicate:
[MEANING]
```

## Section Table

| Section | Icon Name | Primary Concept | Secondary Cues | Primary Color | Accent Color | Meaning |
|---------|-----------|-----------------|----------------|---------------|--------------|---------|
| Overview | Overview | central dashboard tile cluster | status lights, system pulse, overview grid | electric cyan | lime green | a high-level system summary and command center |
| Hosts | Hosts | stacked server or device nodes | CPU pulse, device lights, hardware chassis | cobalt blue | teal | physical machines and host-level resource status |
| Wapps | Wapps | container stack or app tiles | health pulse, service nodes, linked modules | amber | sky blue | running apps, service health, containers, and entry points |
| Works | Works | network pathway or routed grid | tunnel line, connected nodes, signal arcs | indigo | aqua | network devices, connectivity, access paths, and reachability |
| Yots | Yots | smart home hub with orbiting devices | sensor dots, wireless rings, battery cue | bright green | sunflower yellow | IoT hubs, device presence, low battery awareness, and room activity |
| Stows | Stows | storage crate or layered disk pack | drive bays, capacity bars, cleanup sparkle | orange | mint | storage, shares, cache usage, and cleanup opportunities |
| Shots | Shots | camera shutter merged with archive box | snapshot flash, backup ring, protected bundle | magenta | gold | backups, snapshots, retention, and recovery readiness |
| Tracs | Tracs | scrolling trace lines or terminal panel | waveform, log streaks, scan lines | hot red | orange | logs, traces, runtime debugging, and active system events |
| Crets | Crets | vault seal or key capsule | rotation arrows, protected token, trust badge | violet | cyan | secret inventory, credential metadata, and rotation status |
| Settings | Settings | tuned control sliders or precision gear | light glow, adjustment notches, calibration marks | steel blue | silver | app configuration, appearance settings, and system preferences |
| Wallboard | Wallboard | large display panel | cast signal, ambient status lights, big-screen frame | deep blue | neon cyan | a castable at-a-glance monitoring board for distant viewing |
| Shost Brand | Shost App Mark | compact home-lab crest | house grid, node links, monitor glow | cyan | amber | a personal homelab control center that combines monitoring and management |

## Notes

- Generate icons on transparent backgrounds.
- Keep the visual language consistent across the full set.
- Prefer one dominant object with one or two supporting cues.
- Test readability at small sizes such as 24px, 32px, and 48px.
- If generating variants, keep shape language stable and only vary polish, depth, or color balance.
