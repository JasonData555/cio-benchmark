interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "amber" | "default";
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  const cls =
    accent && accent !== "default"
      ? `stat-card stat-card--${accent}`
      : "stat-card";
  return (
    <div className={cls}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub ? <span className="stat-sub">{sub}</span> : null}
    </div>
  );
}
