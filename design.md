# design.md — CIO Benchmark Dashboard

> Living draft. Captures the visual language for the dashboard. Refine as the
> product is guided. Implemented in `app/globals.css`.

## Principles
- **Single-page, no-scroll, desktop-first.** Everything fits one viewport
  (`body { overflow: hidden }`; `.app` is a full-height CSS grid). The user takes
  in the whole picture at a glance — no scrolling, no navigation.
- **Chart-led, minimal copy.** Data does the talking. Titles are short; one-line
  sub-captions give units/context. No paragraphs.
- **Clean & credible.** Calm neutral surfaces, restrained palette, generous
  whitespace, precise type. It should read like an institutional research product.

## Layout
Five-region CSS grid below a header, filter bar, and a 4-up KPI row:

```
┌─────────────────────────── header (logo · title) ───────────────────────────┐
├─────────────────────────────── filter bar ──────────────────────────────────┤
├──────────── 4 × StatCard (respondents · total · base · team) ────────────────┤
│  ┌───────────────── box-plot (span 2) ─────────────┐ ┌── comp by industry ──┐│
│  ├──────────── comp by size ─────┬──── pay mix ─────┤ │   (tall, top sectors)││
│  └───────────────────────────────┴──────────────────┘ └── functions (tall) ─┘│
├──────────────────────── footer (source · confidential · logo) ───────────────┤
```

Grid: `grid-template-areas: "box box industry" / "size mix functions"`,
columns `1fr 1fr 1.15fr`, two equal rows. Tall right column suits the
many-category horizontal bars (industry, functions).

## Color
Sequential blue–teal scale conveys "data / trustworthy / financial":

| token | hex | use |
|-------|-----|-----|
| `--c1` | `#123a5e` | deepest — industry bars, box outlines, mix "Base" |
| `--c2` | `#1f6391` | comp-by-size bars |
| `--c3` | `#2e8bb0` | functions bars, mix "Bonus" |
| `--c4` | `#57b0c4` | box fill |
| `--c5` | `#93cdcf` | lightest — mix "Equity" |

Surfaces: app bg `#eef1f6`, panels `#ffffff`, borders `#e2e7ef`, gridlines
`#e7ebf1`. Ink `#0f1f33`, muted `#6b7888`. Accent = `--c2`.

## Type
Geist (local, via `next/font`). Scale: KPI value 26px/700, brand title 19px/700,
panel title 13px/700, body/axis 11–13px, labels 10px uppercase tracked. Tight
negative letter-spacing on large numerals for a precise, editorial feel.

## Components
- **Panels** — white card, 1px border, 10px radius, compact header
  (title + right-aligned unit sub-caption), flexible body holding a
  `ResponsiveContainer`.
- **StatCards** — uppercase micro-label, large value, muted sublabel.
- **Charts** — no chart chrome beyond what aids reading: horizontal gridlines only,
  hidden value axes where a data label suffices, direct value labels on bars,
  rounded bar caps, thin bars. Box plot drawn with a custom SVG shape
  (whisker + IQR box + median line).
- **FilterBar** — inline labeled selects; live respondent count; reset appears only
  when filters are active.

## Open questions to revisit with the user
- Exact Hitch brand palette / typeface (currently inferred; logo art is in place).
- Whether tooltips/hover detail are wanted (kept off for a static, glanceable feel).
- Which KPIs and which 5 charts are the canonical "headline" set.
- Number formatting locale and whether to show percentile ranges as text anywhere.
