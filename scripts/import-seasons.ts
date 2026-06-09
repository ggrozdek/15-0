import { readRows, writeJson } from "./import-utils";

const input = process.argv[2];
const output = process.argv[3] ?? "src/data/seasons.json";

if (!input) {
  throw new Error("Usage: npm run import:seasons -- path/to/seasons.csv [output.json]");
}

const rows = readRows(input).map((row) => ({
  id: row.seasonId,
  seasonLabel: row.seasonLabel,
  yearStart: Number(row.yearStart),
  yearEnd: Number(row.yearEnd),
}));

writeJson(output, rows);
console.log(`Imported ${rows.length} seasons to ${output}`);
