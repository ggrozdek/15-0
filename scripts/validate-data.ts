import playersJson from "../src/data/generated/players.json";
import seasonsJson from "../src/data/generated/seasons.json";
import teamSeasonsJson from "../src/data/generated/teamSeasons.json";
import type { Player, Season, TeamReference, TeamSeason } from "../src/types";
import { getValidationErrors, validateGameData } from "../src/utils/dataValidation";
import { loadReference } from "./pipeline-utils";

const referencePath = process.argv[2];
const referenceRows = referencePath ? loadReference(referencePath) : [];

const report = validateGameData(
  seasonsJson as Season[],
  teamSeasonsJson as TeamSeason[],
  playersJson as Player[],
  referenceRows as TeamReference[],
);
const errors = getValidationErrors(report);

console.log(JSON.stringify(report, null, 2));

if (errors.length) {
  console.error("\nData validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

if (report.warnings.length) {
  console.warn("\nData validation warnings:");
  report.warnings.forEach((warning) => console.warn(`- ${warning}`));
}

console.log("\nData validation passed.");
