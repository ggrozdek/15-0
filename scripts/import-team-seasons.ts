import { readRows, writeJson } from "./import-utils";

const input = process.argv[2];
const output = process.argv[3] ?? "src/data/teamSeasons.json";

if (!input) {
  throw new Error("Usage: npm run import:team-seasons -- path/to/team_seasons.csv [output.json]");
}

const rows = readRows(input).map((row) => ({
  id: row.teamSeasonId,
  seasonId: row.seasonId,
  clubName: row.clubName,
  country: row.country,
  sourceName: row.sourceName,
  sourceUrl: row.sourceUrl,
}));

writeJson(output, rows);
console.log(`Imported ${rows.length} team-seasons to ${output}`);
