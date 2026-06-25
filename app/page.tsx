import Dashboard from "@/components/Dashboard";
import { buildStatCards } from "@/lib/statCards";
import { defaultFilterState } from "@/lib/filters";

// Server component: compute the initial (overridden) StatCard values on the
// server so first paint is correct and no per-card stats are computed client-side.
export default function Home() {
  const initialStats = buildStatCards(defaultFilterState);
  return <Dashboard initialStats={initialStats} />;
}
