import { readRows, writeJson, list, numberOrNull } from "./import-utils";

const input = process.argv[2];
const output = process.argv[3] ?? "src/data/players.json";

if (!input) {
  throw new Error("Usage: npm run import:players -- path/to/players.csv [output.json]");
}

const rows = readRows(input).map((row) => {
  const secondaryPositions = list(row.secondaryPositions);
  return {
    id: row.playerId,
    teamSeasonId: row.teamSeasonId,
    seasonId: row.seasonId,
    seasonLabel: row.seasonLabel,
    clubName: row.clubName,
    name: row.name,
    nationality: row.nationality,
    age: numberOrNull(row.age),
    primaryPosition: row.primaryPosition,
    secondaryPositions,
    positions: [row.primaryPosition, ...secondaryPositions].filter(Boolean),
    overallRating: null,
    ratingType: "missing",
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    sourceDate: "",
  };
});

writeJson(output, rows);
console.log(`Imported ${rows.length} players to ${output}`);
