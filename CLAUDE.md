# CLAUDE.md — CIO Benchmark Dashboard

## What this is
A single-page, no-scroll, desktop-first data dashboard visualizing **CIO compensation
and governance** for North America, from a proprietary **Hitch Partners** survey.
Client-facing intelligence product: clean, credible, chart-led, minimal copy.

## Stack & constraints
- **Next.js 14 (App Router)**, React 18, TypeScript.
- **No Tailwind. No component libraries.** Styling is hand-written CSS in `app/globals.css`.
- **recharts** is the *only* added dependency — do not add others without a reason.
- Import alias: `@/*` → project root.
- Deploy target: **Vercel**.

## Layout / structure
```
app/
  layout.tsx     root layout, Geist local fonts, metadata
  page.tsx       the dashboard (client component); holds filter state + aggregation
  globals.css    design tokens + single-page no-scroll grid (see design.md)
components/
  FilterBar.tsx          industry / company-size / gender selects
  StatCard.tsx           KPI card
  BoxPlotChart.tsx       total-comp distribution by size (custom box-plot shape)
  CompBySizeChart.tsx    median total comp by company size (bar)
  CompByIndustryChart.tsx median total comp by industry (horizontal bar)
  CompMixChart.tsx       base/bonus/equity pay mix (donut + legend)
  FunctionsChart.tsx     functions under CIO authority (horizontal bar)
  Footer.tsx             source attribution + logo
data/
  CIO-Comp-Data.csv      source dataset (143+ real records)
  cio_data.json          generated app data: { meta, records[] }
lib/
  dataUtils.ts   types (CIORecord/CIOData), formatters, stats, chart aggregators
  filters.ts     Filters type, applyFilters, filterOptions (data-driven)
public/
  hitch-logo.png Hitch Partners logo
```

## Data flow
`data/cio_data.json` is loaded in `page.tsx` → `applyFilters(records, filters)`
(`lib/filters.ts`) → aggregators in `lib/dataUtils.ts` (`compBySize`,
`compByIndustry`, `compMix`, `functionsBreakdown`, `median`, `percentileStats`)
→ chart components. **Charts receive already-filtered, pre-aggregated arrays** so
everything stays in sync with the FilterBar.

### `cio_data.json` shape
```jsonc
{
  "meta": { "title", "region", "source", "year", "currency", "n" },
  "records": [
    {
      "title","titleLevel","gender","location","city","region","tenure",
      "prevCISO","companySize","industry","companyStructure","reportsTo",
      "currency","base","bonus","equity","totalComp",
      "functions": ["…"], "teamSize","boardFreq","company"
    }
  ]
}
```

### Regenerating the data
`cio_data.json` is produced from the CSV. The converter normalizes headers to the
camelCase fields above, strips `$`/commas from money columns, and splits the
multi-value "functions" column into an array. To regenerate after the CSV changes,
re-run the conversion script (kept in the scratchpad during initial build; port it
into `scripts/` if this becomes a recurring task).

## Conventions
- Recharts components and anything using hooks/state are `"use client"`.
- Filter option lists are **derived from the data** (`filterOptions`), never hardcoded.
- Chart colors come from CSS custom properties (`--c1`…`--c5`) referenced as
  `var(--cN)` in SVG fills, so the palette is themed in one place (`globals.css`).
- The whole UI must fit one viewport: `body { overflow: hidden }`, `.app` is a
  full-height CSS grid. Charts sit in cells with `min-height: 0` so
  `ResponsiveContainer` can shrink.

## Commands
- `npm run dev` — local dev at http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm start` — serve production build
