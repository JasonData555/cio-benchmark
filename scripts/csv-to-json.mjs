/**
 * Converts CIO-Comp-Data-final.csv → data/cio_data.json
 *
 * Inclusion rule: Role_Bucket === "CIO" && totalComp > 0
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

function parseMoney(s) {
  const cleaned = s.replace(/[$,]/g, "").trim();
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
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
  const roleBucket = row[C.roleBucket]?.trim();
  const totalComp = parseMoney(row[C.totalComp]);

  if (roleBucket !== "CIO" || totalComp <= 0) continue;

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
    base: parseMoney(row[C.base]),
    bonus: parseMoney(row[C.bonus]),
    equity: parseMoney(row[C.equity]),
    totalComp,
    functions,
    teamSize: parseFloat(row[C.teamSize]) || 0,
    boardFreq: row[C.boardFreq]?.trim() ?? "",
    company: row[C.company]?.trim() ?? "",
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const pub_priv = new Set(["Publicly Traded Company", "Privately Held Company"]);
const ppVals = records
  .filter((r) => pub_priv.has(r.companyStructure) && r.totalComp > 0)
  .map((r) => r.totalComp);
const ppMean = ppVals.reduce((s, v) => s + v, 0) / ppVals.length;
const allMean =
  records.reduce((s, r) => s + r.totalComp, 0) / records.length;

console.log(`Records included : ${records.length}`);
console.log(`Overall mean     : $${Math.round(allMean).toLocaleString()}`);
console.log(
  `Pub+Priv n       : ${ppVals.length}`
);
console.log(
  `Pub+Priv mean    : $${Math.round(ppMean).toLocaleString()} (target ≈ $1,720,667)`
);

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
