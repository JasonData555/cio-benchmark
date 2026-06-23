"use client";

import {
  FilterState,
  SIZE_LABELS,
  SIZE_MAX,
  defaultFilterState,
  isDefaultState,
} from "@/lib/filters";

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  counts: { total: number };
  industries: string[];
  structures: string[];
}

export default function FilterBar({
  filters,
  onChange,
  counts,
  industries,
  structures,
}: FilterBarProps) {
  const toggleIndustry = (industry: string) => {
    if (industry === "All") {
      onChange({ ...filters, industries: [] });
      return;
    }
    const next = filters.industries.includes(industry)
      ? filters.industries.filter((i) => i !== industry)
      : [...filters.industries, industry];
    onChange({ ...filters, industries: next });
  };

  const setSizeMin = (v: number) => {
    const next = Math.min(v, filters.sizeMax);
    onChange({ ...filters, sizeMin: next });
  };

  const setSizeMax = (v: number) => {
    const next = Math.max(v, filters.sizeMin);
    onChange({ ...filters, sizeMax: next });
  };

  const pct = (v: number) => `${((v - 1) / (SIZE_MAX - 1)) * 100}%`;

  const trackStyle = {
    background: `linear-gradient(to right,
      var(--color-border) ${pct(filters.sizeMin)},
      var(--color-blue) ${pct(filters.sizeMin)},
      var(--color-blue) ${pct(filters.sizeMax)},
      var(--color-border) ${pct(filters.sizeMax)})`,
  };

  const sizeLabel =
    filters.sizeMin === 1 && filters.sizeMax === SIZE_MAX
      ? "All sizes"
      : `${SIZE_LABELS[filters.sizeMin]}–${SIZE_LABELS[filters.sizeMax]} employees`;

  return (
    <div className="filter-bar">
      <div className="filter-group">
        {/* Industry pills */}
        <div className="filter-field">
          <span className="filter-field-label">Industry</span>
          <div className="pill-group">
            <button
              className={`pill ${filters.industries.length === 0 ? "pill-active" : "pill-inactive"}`}
              onClick={() => toggleIndustry("All")}
            >
              All
            </button>
            {industries.map((ind) => (
              <button
                key={ind}
                className={`pill ${filters.industries.includes(ind) ? "pill-active" : "pill-inactive"}`}
                onClick={() => toggleIndustry(ind)}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Structure dropdown */}
        <div className="filter-field">
          <span className="filter-field-label">Structure</span>
          <select
            className="filter-select"
            value={filters.structure}
            onChange={(e) => onChange({ ...filters, structure: e.target.value })}
          >
            <option value="All">All Structures</option>
            {structures.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Company size dual-handle slider */}
        <div className="filter-field">
          <span className="filter-field-label">Company Size</span>
          <span className="range-label">{sizeLabel}</span>
          <div className="range-slider-wrap">
            <div className="range-track" style={trackStyle} />
            <input
              type="range"
              min={1}
              max={SIZE_MAX}
              value={filters.sizeMin}
              onChange={(e) => setSizeMin(Number(e.target.value))}
            />
            <input
              type="range"
              min={1}
              max={SIZE_MAX}
              value={filters.sizeMax}
              onChange={(e) => setSizeMax(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="filter-right">
        <span className="filter-count">n={counts.total} CIOs</span>
        {!isDefaultState(filters) && (
          <button
            className="filter-reset"
            onClick={() => onChange(defaultFilterState)}
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
