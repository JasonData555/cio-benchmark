"use client";

import { useState } from "react";
import {
  FilterState,
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
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    </aside>
  );
}
