import { loadRawChampionsLeagueData, writeIntermediate } from "./pipeline-utils";

const inputDir = process.argv[2] ?? "data/raw/champions_league";
const output = process.argv[3] ?? "data/processed/ucl.normalized.json";

const data = loadRawChampionsLeagueData(inputDir);
writeIntermediate(output, data);

console.log(
  `Imported ${data.seasons.length} seasons, ${data.teamSeasons.length} team-seasons, ${data.players.length} players to ${output}`,
);
