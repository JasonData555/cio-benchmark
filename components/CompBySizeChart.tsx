"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SizeStat, formatCompPrecise, formatCurrency } from "@/lib/dataUtils";

interface Props {
  data: SizeStat[];
}

function SizeXTick({
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
        x={0}
        dy={14}
        textAnchor="middle"
        fill="var(--color-ink)"
        fontSize={12}
        fontFamily="var(--font-sans)"
        fontWeight={500}
      >
        {payload?.value}
      </text>
      {entry && (
        <text
          x={0}
          dy={28}
          textAnchor="middle"
          fill="var(--color-ink-muted)"
          fontSize={10}
          fontFamily="var(--font-sans)"
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
        {formatCurrency(d.mean)}
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
  const weightedMean =
    data.length > 0
      ? data.reduce((s, d) => s + d.mean * d.n, 0) /
        data.reduce((s, d) => s + d.n, 0)
      : 0;

  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="panel-title">Compensation by Company Size</h2>
        <span className="panel-sub">Average · USD</span>
      </header>
      <div className="panel-body">
        {data.length === 0 ? (
          <div className="panel-empty">No data for current filters</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 30, right: 16, left: 10, bottom: 48 }}
            >
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={<SizeXTick data={data} />}
                interval={0}
              />
              <YAxis
                hide
                domain={[0, (dataMax: number) => dataMax * 1.22]}
              />
              <Tooltip
                content={<SizeTooltip />}
                cursor={{ fill: "var(--color-surface)" }}
              />
              <ReferenceLine
                y={weightedMean}
                stroke="var(--color-amber)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `Avg ${formatCompPrecise(weightedMean)}`,
                  position: "insideBottomLeft",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fill: "var(--color-amber)",
                  dx: 8,
                  dy: -4,
                }}
              />
              <Bar
                dataKey="mean"
                fill="var(--c2)"
                radius={[3, 3, 0, 0]}
                maxBarSize={56}
              >
                <LabelList
                  dataKey="mean"
                  position="top"
                  formatter={(v: unknown) => formatCompPrecise(Number(v))}
                  style={{
                    fill: "var(--color-ink)",
                    fontSize: 12,
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
