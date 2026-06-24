/**
 * Converts CIO-Comp-Data-final.csv → data/cio_data.json
 *
 * Inclusion rule: totalComp > 0 (no Role_Bucket filter — the dataset is the
 * CIO population, incl. dual "CIO / CISO" title-holders tagged Role_Bucket=CISO).
 * bonus/equity preserve blank cells as null so Excel AVERAGE semantics hold.
 * Run: node scripts/csv-to-json.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

const CSV_PATH = resolve(ROOT, "CIO-Comp-Data-final.csv");
const OUT_PATH = resolve(ROOT, "data", "cio_data.json");

const SIZE_ORDER = [
  "< 250 employees",
  "250 - 499 employees",
  "500 - 999 employees",
  "1000 - 4999 employees",
  "5000 - 9,999 employees",
  "10,000 - 25,000 employees",
  "25,000+ employees",
];

// ---------------------------------------------------------------------------
// Minimal CSV parser — handles quoted fields containing commas and newlines
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuote) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop trailing empty row
  if (rows.length && rows[rows.length - 1].every((c) => c === "")) {
    rows.pop();
  }
  return rows;
}

// Parse a money cell. A blank/empty cell returns null so the blank-vs-$0
// distinction survives into the JSON (Excel AVERAGE ignores blanks). Use
// parseMoneyOr0 where a numeric is always required (base, totalComp).
function parseMoney(s) {
  const cleaned = (s ?? "").replace(/[$,]/g, "").trim();
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseMoneyOr0(s) {
  return parseMoney(s) ?? 0;
}

function sizeOrder(band) {
  const idx = SIZE_ORDER.indexOf(band);
  return idx === -1 ? 0 : idx + 1;
}

const INDUSTRY_ALIASES = {
  "Financial Services": "Banking / Financial Services",
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const raw = readFileSync(CSV_PATH, "utf8");
const rows = parseCSV(raw);
const [header, ...dataRows] = rows;

const col = (name) => {
  const idx = header.indexOf(name);
  if (idx === -1) throw new Error(`Column not found: "${name}"`);
  return idx;
};

const C = {
  title: col("Your Title"),
  titleLevel: col("Title-Level"),
  gender: col("Gender"),
  location: col("Location"),
  city: col("City"),
  region: col("Global Region"),
  tenure: col("Current Tenure"),
  prevCISO: col("Was your previous role a CISO / Head of Security position?"),
  companySize: col("Current Company Size"),
  industry: col("Industry"),
  companyStructure: col("Company Structure"),
  reportsTo: col("Title of person you report to?"),
  currency: col("Compensation Currency"),
  base: col("Base-Converted"),
  bonus: col("Bonus-Converted"),
  equity: col("Equity-Converted"),
  totalComp: col("Total Comp-Converted"),
  functions: col(
    "Which of the following functions fall under your direct responsibility and decision-making authority?"
  ),
  teamSize: col("Team Size"),
  boardFreq: col("How often do you present to the Board of Directors?"),
  roleBucket: col("Role_Bucket"),
  company: col("Company"),
};

const records = [];

for (const row of dataRows) {
  const totalComp = parseMoneyOr0(row[C.totalComp]);

  // Inclusion rule: any survey row with positive total comp. The dataset is
  // the CIO population (incl. dual "CIO / CISO" title-holders tagged
  // Role_Bucket=CISO), so we intentionally do NOT filter on Role_Bucket —
  // that matches the client's source-of-truth per-structure averages.
  if (totalComp <= 0) continue;

  const rawFunctions = row[C.functions]?.trim() ?? "";
  const functions = rawFunctions
    ? rawFunctions.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  const companySize = row[C.companySize]?.trim() ?? "";
  const rawIndustry = row[C.industry]?.trim() ?? "";
  const industry = INDUSTRY_ALIASES[rawIndustry] ?? rawIndustry;

  records.push({
    title: row[C.title]?.trim() ?? "",
    titleLevel: row[C.titleLevel]?.trim() ?? "",
    gender: row[C.gender]?.trim() ?? "",
    location: row[C.location]?.trim() ?? "",
    city: row[C.city]?.trim() ?? "",
    region: row[C.region]?.trim() ?? "",
    tenure: parseFloat(row[C.tenure]) || 0,
    prevCISO: row[C.prevCISO]?.trim() ?? "",
    companySize,
    sizeOrder: sizeOrder(companySize),
    industry,
    companyStructure: row[C.companyStructure]?.trim() ?? "",
    reportsTo: row[C.reportsTo]?.trim() ?? "",
    currency: row[C.currency]?.trim() ?? "",
    base: parseMoneyOr0(row[C.base]),
    bonus: parseMoney(row[C.bonus]),   // null when the cell is blank
    equity: parseMoney(row[C.equity]), // null when the cell is blank
    totalComp,
    functions,
    teamSize: parseFloat(row[C.teamSize]) || 0,
    boardFreq: row[C.boardFreq]?.trim() ?? "",
    company: row[C.company]?.trim() ?? "",
  });
}

// ---------------------------------------------------------------------------
// Validation — per-structure Excel AVERAGE (sum ÷ count of non-null cells),
// grouped by Company Structure with no Role_Bucket filter. Must match the
// client's source-of-truth pivot to the dollar.
// ---------------------------------------------------------------------------
const TARGETS = {
  "Privately Held Company": { base: 370785, bonus: 137368, equity: 825434 },
  "Publicly Traded Company": { base: 427836, bonus: 112774, equity: 1144506 },
};

const excelAvg = (vals) => {
  const filled = vals.filter((v) => v != null);
  return filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0;
};

console.log(`Records included : ${records.length}`);

// Per-row integrity: base + bonus + equity must reconcile to totalComp. Catches
// any transcription / column-shift error in the money columns.
let checksumBad = 0;
for (const r of records) {
  const sum = r.base + (r.bonus ?? 0) + (r.equity ?? 0);
  if (Math.abs(sum - r.totalComp) > 1) {
    checksumBad++;
    if (checksumBad <= 10) {
      console.log(
        `  CHECKSUM: ${r.companyStructure} base=${r.base} bonus=${r.bonus} ` +
          `equity=${r.equity} sum=${sum} total=${r.totalComp}`
      );
    }
  }
}
console.log(`Checksum mismatches: ${checksumBad}\n`);

let failed = checksumBad > 0;
for (const [structure, target] of Object.entries(TARGETS)) {
  const group = records.filter((r) => r.companyStructure === structure);
  const got = {
    base: excelAvg(group.map((r) => r.base)),
    bonus: excelAvg(group.map((r) => r.bonus)),
    equity: excelAvg(group.map((r) => r.equity)),
  };
  console.log(`${structure} (n=${group.length})`);
  for (const key of ["base", "bonus", "equity"]) {
    const ok = Math.abs(Math.round(got[key]) - target[key]) <= 1;
    if (!ok) failed = true;
    console.log(
      `  ${key.padEnd(6)} $${Math.round(got[key]).toLocaleString().padStart(11)}` +
        `  target $${target[key].toLocaleString().padStart(11)}  ${ok ? "OK" : "MISMATCH"}`
    );
  }
}
console.log(`\nValidation: ${failed ? "FAILED — values do not match targets" : "PASSED"}`);

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const output = {
  meta: {
    title: "CIO Compensation & Governance Benchmark",
    region: "North America",
    source: "Hitch Partners Proprietary Survey",
    year: 2026,
    currency: "USD",
    n: records.length,
  },
  records,
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
console.log(`\nWrote ${OUT_PATH}`);
