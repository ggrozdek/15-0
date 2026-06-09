import seasonsJson from "../src/data/generated/seasons.json";
import teamSeasonsJson from "../src/data/generated/teamSeasons.json";
import type { Season, TeamSeason } from "../src/types";
import { randomItem } from "../src/utils/random";

const iterations = Number(process.argv[2] ?? 10000);
const seasons = seasonsJson as Season[];
const teamSeasons = (teamSeasonsJson as TeamSeason[]).filter((teamSeason) => teamSeason.isPlayable && teamSeason.playerCount >= 14);
const eligibleSeasons = seasons.filter((season) => teamSeasons.some((teamSeason) => teamSeason.seasonId === season.id));
const famousClubWatchlist = new Set(
  [
    "Real Madrid",
    "Barcelona",
    "Bayern Munich",
    "Manchester City",
    "Manchester United",
    "Liverpool",
    "Chelsea",
    "Arsenal",
    "Paris Saint-Germain",
    "Juventus",
    "Inter",
    "AC Milan",
    "Borussia Dortmund",
    "Atletico Madrid",
    "Ajax",
    "Porto",
    "Benfica",
  ].map((club) => club.toLowerCase()),
);

function normalizeClub(club: string) {
  return club
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isFamousClub(club: string) {
  const normalized = normalizeClub(club);
  return [...famousClubWatchlist].some((famous) => normalized.includes(normalizeClub(famous)));
}

const byClub = new Map<string, number>();
const byTeamSeason = new Map<string, number>();
const bySeason = new Map<string, number>();
const byCountry = new Map<string, number>();
const lessFamousExamples = new Set<string>();

for (let index = 0; index < iterations; index += 1) {
  const season = randomItem(eligibleSeasons);
  const team = randomItem(teamSeasons.filter((teamSeason) => teamSeason.seasonId === season.id));
  byClub.set(team.clubName, (byClub.get(team.clubName) ?? 0) + 1);
  byTeamSeason.set(team.id, (byTeamSeason.get(team.id) ?? 0) + 1);
  bySeason.set(season.seasonLabel, (bySeason.get(season.seasonLabel) ?? 0) + 1);
  byCountry.set(team.country, (byCountry.get(team.country) ?? 0) + 1);
  if (!isFamousClub(team.clubName)) {
    lessFamousExamples.add(`${team.clubName} ${team.seasonLabel}`);
  }
}

function sortedEntries(map: Map<string, number>, direction: "asc" | "desc" = "desc") {
  return [...map.entries()].sort((a, b) => (direction === "desc" ? b[1] - a[1] : a[1] - b[1]));
}

console.log(`Simulated ${iterations} random draws.`);
console.log(`Playable team-seasons available: ${teamSeasons.length}`);
console.log(`Seasons with valid teams: ${eligibleSeasons.length}`);
console.log(`Unique clubs drawn: ${byClub.size}`);
console.log(`Unique team-seasons drawn: ${byTeamSeason.size}`);
console.log("\nTop 50 most drawn clubs:");
console.table(sortedEntries(byClub).slice(0, 50).map(([club, count]) => ({ club, count })));
console.log("\nBottom 50 most drawn clubs:");
console.table(sortedEntries(byClub, "asc").slice(0, 50).map(([club, count]) => ({ club, count })));
console.log("\nDraw count by season:");
console.table(sortedEntries(bySeason).map(([season, count]) => ({ season, count })));
console.log("\nDraw count by country:");
console.table(sortedEntries(byCountry).map(([country, count]) => ({ country, count })));
console.log("\nExamples of smaller/less famous clubs drawn:");
console.table([...lessFamousExamples].slice(0, 25).map((example) => ({ example })));
