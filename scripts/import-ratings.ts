import { loadRawRatings, writeIntermediate } from "./pipeline-utils";

const input = process.argv[2] ?? "data/raw/ratings/fifa_players.csv";
const output = process.argv[3] ?? "data/processed/ratings.normalized.json";

const ratings = loadRawRatings(input);
writeIntermediate(output, ratings);

console.log(`Imported ${ratings.length} rating rows to ${output}`);
