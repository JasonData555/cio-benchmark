"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SizeStat, formatCurrency } from "@/lib/dataUtils";

interface Props {
  data: SizeStat[];
}

function SizeTick({
  x,
  y,
  payload,
  data,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  data: SizeStat[];
}) {
  const entry = data.find((d) => d.label === payload?.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-4}
        textAnchor="end"
        fill="var(--color-ink)"
        fontSize={11}
        fontFamily="var(--font-sans)"
        dy="-3"
      >
        {payload?.value}
      </text>
      {entry && (
        <text
          x={-4}
          textAnchor="end"
          fill="var(--color-ink-muted)"
          fontSize={10}
          fontFamily="var(--font-sans)"
          dy="9"
        >
          {`n=${entry.n}`}
        </text>
      )}
    </g>
  );
}

function SizeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SizeStat }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid var(--color-border)",
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          color: "var(--color-ink)",
          marginBottom: 4,
        }}
      >
        {d.sizeBand}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--color-blue)",
          fontSize: 13,
        }}
      >
        {formatCurrency(d.median)}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          color: "var(--color-ink-muted)",
          fontSize: 11,
          marginTop: 2,
        }}
      >
        n={d.n} respondents
      </div>
    </div>
  );
}

export default function CompBySizeChart({ data }: Props) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="panel-title">Compensation by Company Size</h2>
        <span className="panel-sub">Median · USD</span>
      </header>
      <div className="panel-body">
        {data.length === 0 ? (
          <div className="panel-empty">No data for current filters</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 2, right: 60, left: 8, bottom: 2 }}
            >
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="label"
                width={80}
                tick={<SizeTick data={data} />}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<SizeTooltip />}
                cursor={{ fill: "var(--color-surface)" }}
              />
              <Bar
                dataKey="median"
                fill="var(--c2)"
                radius={[0, 3, 3, 0]}
                maxBarSize={20}
              >
                <LabelList
                  dataKey="median"
                  position="right"
                  formatter={(v) => formatCurrency(Number(v))}
                  style={{
                    fill: "var(--color-ink)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
