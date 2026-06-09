import { buildDataStatus, loadRawChampionsLeagueData, loadRawRatings, loadReference, mergeRatings, writeGeneratedFiles } from "./pipeline-utils";
import { validateGameData } from "../src/utils/dataValidation";

const uclDir = process.argv[2] ?? "data/raw/champions_league";
const ratingsPath = process.argv[3];

const { seasons, teamSeasons, players } = loadRawChampionsLeagueData(uclDir);
const ratings = ratingsPath ? loadRawRatings(ratingsPath) : [];
const mergedPlayers = mergeRatings(players, ratings);
const refreshedTeamSeasons = teamSeasons.map((teamSeason) => {
  const playerCount = mergedPlayers.filter((player) => player.teamSeasonId === teamSeason.id).length;
  return { ...teamSeason, playerCount, isComplete: playerCount >= 20, isPlayable: playerCount >= 14 };
});
const reference = process.argv[4] ? loadReference(process.argv[4]) : [];
const report = validateGameData(seasons, refreshedTeamSeasons, mergedPlayers, reference);
const hasFullCoverage = reference.length >= seasons.length * 16 && Object.keys(report.missingTeamsPerSeason).length === 0;
const status = buildDataStatus(seasons, refreshedTeamSeasons, mergedPlayers, hasFullCoverage, report.warnings);

writeGeneratedFiles(seasons, refreshedTeamSeasons, mergedPlayers, status);
console.log(`Generated ${seasons.length} seasons, ${refreshedTeamSeasons.length} team-seasons, ${mergedPlayers.length} players.`);
