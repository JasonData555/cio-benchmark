"use client";

import { useState } from "react";
import { MixSlice, formatCompPrecise } from "@/lib/dataUtils";

interface Props {
  data: MixSlice[];
}

const SEGMENTS = [
  { fill: "#185fa5" },
  { fill: "#65a6e5" },
  { fill: "#c8d4e0" },
];

export default function CompMixChart({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const isEmpty = data.every((d) => d.value === 0);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="panel-title">Compensation Mix</h2>
        <span className="panel-sub">Annual compensation · avg component breakdown</span>
      </header>
      <div
        className="panel-body"
        style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        {isEmpty ? (
          <div className="panel-empty">No data for current filters</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* KPI callouts */}
            <div className="mix-kpi-row">
              {data.map((slice, i) => (
                <div key={slice.component} className="mix-kpi-item">
                  <div
                    className="mix-kpi-swatch"
                    style={{ background: SEGMENTS[i].fill }}
                  />
                  <div className="mix-kpi-value">{formatCompPrecise(slice.value)}</div>
                  <div className="mix-kpi-label">{slice.component}</div>
                  <div className="mix-kpi-pct">{slice.pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>

            {/* Stacked bar + legend */}
            <div>
              <div
                style={{
                  display: "flex",
                  height: 110,
                  borderRadius: 6,
                  overflow: "hidden",
                  width: "100%",
                }}
                onMouseLeave={() => setHovered(null)}
              >
                {data.map((slice, i) => (
                  <div
                    key={slice.component}
                    style={{
                      flex: `0 0 ${slice.pct}%`,
                      background: SEGMENTS[i].fill,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      cursor: "default",
                    }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseMove={(e) => setTipPos({ x: e.clientX, y: e.clientY })}
                  >
                    {slice.pct > 8 && (
                      <span
                        style={{
                          color: i === 2 ? "var(--color-ink)" : "#fff",
                          fontSize: 15,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatCompPrecise(slice.value)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Hover tooltip */}
              {hovered !== null && (
                <div
                  style={{
                    position: "fixed",
                    left: tipPos.x + 14,
                    top: tipPos.y - 56,
                    background: "#fff",
                    border: "0.5px solid var(--color-border)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    pointerEvents: "none",
                    zIndex: 50,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      fontSize: 12,
                      marginBottom: 3,
                    }}
                  >
                    {data[hovered].component}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-blue)",
                      fontSize: 13,
                    }}
                  >
                    {formatCompPrecise(data[hovered].value)}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-ink-muted)",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {data[hovered].pct.toFixed(1)}% of total
                  </div>
                </div>
              )}

              {/* Legend */}
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                {data.map((slice, i) => (
                  <div
                    key={slice.component}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: SEGMENTS[i].fill,
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 13,
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      {slice.component}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
