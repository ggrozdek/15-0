import type { Player } from "../src/types";
import { mergeRatings, readIntermediate, writeIntermediate, type RawRating } from "./pipeline-utils";

const uclInput = process.argv[2] ?? "data/processed/ucl.normalized.json";
const ratingsInput = process.argv[3] ?? "data/processed/ratings.normalized.json";
const output = process.argv[4] ?? "data/processed/players.merged.json";

const uclData = readIntermediate<{ players: Player[] }>(uclInput);
const ratings = readIntermediate<RawRating[]>(ratingsInput);
const players = mergeRatings(uclData.players, ratings);

writeIntermediate(output, players);
console.log(`Merged ratings for ${players.length} Champions League squad players to ${output}`);
