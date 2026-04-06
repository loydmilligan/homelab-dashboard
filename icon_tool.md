# Icon Tool Guide

Use the machine-wide `icon-gen` CLI to generate dashboard icons from any directory. The tool is backed by the repo at `/home/mmariani/Projects/dashboard-icon-gen` and uses its `.env` for the OpenRouter key and default model.

## Fastest Safe Workflow

1. Inspect the current built-in icons and existing dashboard icon guidance:
   - `/home/mmariani/Projects/dashboard-icon-gen/AI_AGENT_USAGE.md`
   - `/home/mmariani/Projects/homelab-dashboard/docs/ICON_GENERATION_TEMPLATE.md`

2. Scaffold a new batch spec in this repo:

```bash
icon-gen --init-spec /home/mmariani/Projects/homelab-dashboard/generated/icon-spec.json
```

3. Edit that JSON file to improve the icon set:
   - better concepts than the original quick template
   - more intentional color choices
   - stronger style direction
   - per-icon meanings tied to the dashboard sections

4. Validate the spec before spending API calls:

```bash
icon-gen --validate-spec /home/mmariani/Projects/homelab-dashboard/generated/icon-spec.json
```

5. Generate the icons into the dashboard repo:

```bash
icon-gen \
  --input-file /home/mmariani/Projects/homelab-dashboard/generated/icon-spec.json \
  --output-dir /home/mmariani/Projects/homelab-dashboard/generated/icons
```

## Useful Commands

List built-in dashboard icon names:

```bash
icon-gen --list
```

Check API access:

```bash
icon-gen --check-auth
```

Check the configured model:

```bash
icon-gen --check-model
```

Print the structured JSON schema:

```bash
icon-gen --print-json-schema
```

Generate one one-off custom icon:

```bash
icon-gen \
  --name "Analytics" \
  --meaning "traffic, trends, reports, and performance summaries" \
  --primary-concept "stacked charts and signal arcs" \
  --secondary-cues "trend line, dashboard tile, metric pulse" \
  --style "clean, bold, polished, futuristic, readable at small sizes" \
  --output-dir /home/mmariani/Projects/homelab-dashboard/generated/icons \
  --output-sizes 64x64,128x128,256x256
```

## Spec File Notes

Recommended location:

`/home/mmariani/Projects/homelab-dashboard/generated/icon-spec.json`

Core fields:

- `version`: must be `1`
- `defaults`: shared model, size, output sizes, style, and colors
- `icons`: array of icon definitions

Important per-icon fields:

- `section`
- `icon_name`
- `meaning`
- `primary_concept`
- `secondary_cues`
- `primary_color`
- `secondary_color`
- `style`
- `output_size` or `output_sizes`

## Quality Bar

Do not just reuse the quick original template as-is. Improve:

- color palettes so each section feels distinct but still cohesive
- style direction so the set has a strong visual identity
- icon concepts so each page has a clearer metaphor
- prompt wording so icons stay readable at small sizes and fit a polished homelab dashboard

Avoid:

- generic SaaS icon language
- cluttered compositions
- thin detail that disappears at small sizes
- weak or repetitive concepts across sections

## Output Expectations

Write generated assets into:

`/home/mmariani/Projects/homelab-dashboard/generated/icons`

If multiple sizes are requested, the tool writes suffixed filenames like:

- `overview_64x64.png`
- `overview_128x128.png`
- `overview_256x256.png`
