import playersJson from "../src/data/generated/players.json";
import teamSeasonsJson from "../src/data/generated/teamSeasons.json";
import type { Player, TeamSeason } from "../src/types";

const players = playersJson as Player[];
const teamSeasons = teamSeasonsJson as TeamSeason[];

function rating(player: Player) {
  return player.overallRating ?? 0;
}

function bucketLabel(value: number) {
  if (value <= 64) return "60 to 64";
  if (value <= 69) return "65 to 69";
  if (value <= 74) return "70 to 74";
  if (value <= 79) return "75 to 79";
  if (value <= 84) return "80 to 84";
  if (value <= 89) return "85 to 89";
  return "90 to 96";
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

const sortedPlayers = [...players].sort((a, b) => rating(b) - rating(a) || b.minutesPlayed - a.minutesPlayed);
const distribution = new Map<string, number>(
  ["60 to 64", "65 to 69", "70 to 74", "75 to 79", "80 to 84", "85 to 89", "90 to 96"].map((label) => [label, 0]),
);

for (const player of players) {
  distribution.set(bucketLabel(rating(player)), (distribution.get(bucketLabel(rating(player))) ?? 0) + 1);
}

const playersByTeamSeason = new Map<string, Player[]>();
for (const player of players) {
  const list = playersByTeamSeason.get(player.teamSeasonId) ?? [];
  list.push(player);
  playersByTeamSeason.set(player.teamSeasonId, list);
}

const teamSeasonRows = teamSeasons.map((teamSeason) => {
  const squad = playersByTeamSeason.get(teamSeason.id) ?? [];
  const sortedSquad = [...squad].sort((a, b) => rating(b) - rating(a) || b.minutesPlayed - a.minutesPlayed);
  const lowestSquad = [...squad].sort((a, b) => rating(a) - rating(b) || a.minutesPlayed - b.minutesPlayed);
  const top = sortedSquad[0];
  const lowest = lowestSquad[0];
  return {
    season: teamSeason.seasonLabel,
    club: teamSeason.clubName,
    players: squad.length,
    average: average(squad.map(rating)),
    topPlayer: top ? `${top.name} (${rating(top)})` : "None",
    lowestPlayer: lowest ? `${lowest.name} (${rating(lowest)})` : "None",
  };
});

console.log("Top 100 estimated players by rating:");
console.table(
  sortedPlayers.slice(0, 100).map((player) => ({
    rating: rating(player),
    name: player.name,
    club: player.clubName,
    season: player.seasonLabel,
    position: player.primaryPosition,
    minutes: player.minutesPlayed,
    ratingType: player.ratingType,
  })),
);

console.log("\nRating distribution:");
console.table([...distribution.entries()].map(([range, count]) => ({ range, count })));

console.log("\nAverage rating, top player, and lowest player by team-season:");
console.table(teamSeasonRows);
