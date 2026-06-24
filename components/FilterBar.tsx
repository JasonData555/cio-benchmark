"use client";

import { useState } from "react";
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
  structures: string[];
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
    >
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FilterBar({
  filters,
  onChange,
  counts,
  structures,
}: FilterBarProps) {
  const [openSections, setOpenSections] = useState({
    structure: false,
    size: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setSizeMin = (v: number) => {
    onChange({ ...filters, sizeMin: Math.min(v, filters.sizeMax) });
  };

  const setSizeMax = (v: number) => {
    onChange({ ...filters, sizeMax: Math.max(v, filters.sizeMin) });
  };

  const pct = (v: number) => `${((v - 1) / (SIZE_MAX - 1)) * 100}%`;

  const trackStyle = {
    background: `linear-gradient(to right,
      var(--color-border-strong) ${pct(filters.sizeMin)},
      var(--color-blue) ${pct(filters.sizeMin)},
      var(--color-blue) ${pct(filters.sizeMax)},
      var(--color-border-strong) ${pct(filters.sizeMax)})`,
  };

  const sizeLabel =
    filters.sizeMin === 1 && filters.sizeMax === SIZE_MAX
      ? "All sizes"
      : `${SIZE_LABELS[filters.sizeMin]} – ${SIZE_LABELS[filters.sizeMax]}`;

  const hasActiveFilters = !isDefaultState(filters);

  return (
    <aside className="filter-sidebar">
      {/* Sidebar header */}
      <div className="sidebar-top">
        <span className="sidebar-top-label">Filters</span>
        <span className="filter-count">n={counts.total}</span>
      </div>

      {hasActiveFilters && (
        <button
          className="sidebar-reset"
          onClick={() => onChange(defaultFilterState)}
        >
          Reset all filters
        </button>
      )}

      {/* Company Structure */}
      <div className="sidebar-section">
        <button
          className="sidebar-section-trigger"
          onClick={() => toggleSection("structure")}
        >
          <span className="sidebar-section-title">
            Structure
            {filters.structure !== "All" && (
              <span className="sidebar-badge">1</span>
            )}
          </span>
          <span className="sidebar-chevron">
            <ChevronIcon open={openSections.structure} />
          </span>
        </button>

        {openSections.structure && (
          <div className="sidebar-section-body">
            <select
              className="sidebar-select"
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
        )}
      </div>

      {/* Company Size */}
      <div className="sidebar-section">
        <button
          className="sidebar-section-trigger"
          onClick={() => toggleSection("size")}
        >
          <span className="sidebar-section-title">
            Company Size
            {(filters.sizeMin !== 1 || filters.sizeMax !== SIZE_MAX) && (
              <span className="sidebar-badge">1</span>
            )}
          </span>
          <span className="sidebar-chevron">
            <ChevronIcon open={openSections.size} />
          </span>
        </button>

        {openSections.size && (
          <div className="sidebar-section-body">
            <span className="sidebar-size-label">{sizeLabel}</span>
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
            <div className="sidebar-size-ends">
              <span>{SIZE_LABELS[1]}</span>
              <span>{SIZE_LABELS[SIZE_MAX]}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
