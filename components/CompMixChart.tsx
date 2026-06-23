"use client";

import { MixSlice, formatCompPrecise } from "@/lib/dataUtils";

interface Props {
  data: MixSlice[];
}

const SEGMENTS = [
  { fill: "#185FA5" },
  { fill: "#BA7517" },
  { fill: "#1D9E75" },
];

export default function CompMixChart({ data }: Props) {
  const isEmpty = data.every((d) => d.value === 0);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="panel-title">Compensation Mix</h2>
        <span className="panel-sub">Avg component breakdown · % of total</span>
      </header>
      <div
        className="panel-body"
        style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        {isEmpty ? (
          <div className="panel-empty">No data for current filters</div>
        ) : (
          <>
            {/* Stacked bar */}
            <div
              style={{
                display: "flex",
                height: 48,
                borderRadius: 6,
                overflow: "hidden",
                width: "100%",
              }}
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
                  }}
                >
                  {slice.pct > 8 && (
                    <span
                      style={{
                        color: "#fff",
                        fontSize: 11,
                        fontFamily: "var(--font-sans)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {`${slice.component} ${Math.round(slice.pct)}%`}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Legend pills */}
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              {data.map((slice, i) => (
                <div
                  key={slice.component}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: SEGMENTS[i].fill,
                      flexShrink: 0,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      color: "var(--color-ink-secondary)",
                    }}
                  >
                    {slice.component}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {`${Math.round(slice.pct)}%`}
                  </span>
                </div>
              ))}
            </div>

            {/* Metric callouts */}
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {data.map((slice) => (
                <div key={slice.component}>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 10,
                      color: "var(--color-ink-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 2,
                    }}
                  >
                    {`Avg ${slice.component}`}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "var(--color-ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCompPrecise(slice.value)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
