"use server";

// Server Action wrapper around buildStatCards. Imported by the client Dashboard,
// but only an RPC reference ships to the browser — the implementation (and the
// pinned values in lib/statCards.ts) stays on the server.

import { buildStatCards, StatStrings } from "@/lib/statCards";
import { FilterState } from "@/lib/filters";

export async function getStatCards(filters: FilterState): Promise<StatStrings> {
  return buildStatCards(filters);
}
