import samplePlayersJson from "./players.json";
import sampleSeasonsJson from "./seasons.json";
import sampleTeamSeasonsJson from "./teamSeasons.json";
import type { DataStatus, Player, Season, TeamSeason, TeamSeasonSquad } from "../types";

function normalizeTeamSeason(teamSeason: TeamSeason): TeamSeason {
  return {
    ...teamSeason,
    isComplete: teamSeason.isComplete ?? teamSeason.playerCount >= 20,
    isPlayable: teamSeason.isPlayable ?? teamSeason.playerCount >= 14,
  };
}

function normalizePlayer(player: Player): Player {
  return {
    ...player,
    birthYear: player.birthYear ?? null,
    minutesPlayed: player.minutesPlayed ?? 0,
  };
}

function buildFallbackStatus(seasons: Season[], teamSeasons: TeamSeason[], players: Player[]): DataStatus {
  const complete = teamSeasons.filter((teamSeason) => teamSeason.isComplete).length;
  const playable = teamSeasons.filter((teamSeason) => teamSeason.isPlayable).length;
  return {
    datasetMode: "sample",
    datasetName: "sample data",
    generatedAt: "",
    totalSeasons: seasons.length,
    totalTeamSeasons: teamSeasons.length,
    totalPlayers: players.length,
    validTeamSeasons: playable,
    playableTeamSeasons: playable,
    completeTeamSeasons: complete,
    incompleteTeamSeasons: teamSeasons.length - complete,
    onlineRatings: players.filter((player) => player.ratingType === "online").length,
    estimatedRatings: players.filter((player) => player.ratingType === "estimated").length,
    missingRatings: players.filter((player) => player.ratingType === "missing").length,
    coverageStatus: "partial",
    warnings: ["Generated data is missing, so the app is using bundled sample data."],
  };
}

export let seasons = sampleSeasonsJson as Season[];
export let teamSeasons = (sampleTeamSeasonsJson as TeamSeason[]).map(normalizeTeamSeason);
export let players = (samplePlayersJson as Player[]).map(normalizePlayer);
export let dataStatus = buildFallbackStatus(seasons, teamSeasons, players);

type LoadGameDataResult = {
  loadedGenerated: boolean;
  warning?: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function loadGameData(): Promise<LoadGameDataResult> {
  try {
    const [generatedSeasons, generatedTeamSeasons, generatedPlayers, generatedDataStatus] = await Promise.all([
      fetchJson<Season[]>("/data/generated/seasons.json"),
      fetchJson<TeamSeason[]>("/data/generated/teamSeasons.json"),
      fetchJson<Player[]>("/data/generated/players.json"),
      fetchJson<DataStatus>("/data/generated/dataStatus.json"),
    ]);

    if (!generatedSeasons.length || !generatedTeamSeasons.length || !generatedPlayers.length) {
      throw new Error("Generated data files are empty or invalid.");
    }

    seasons = generatedSeasons;
    teamSeasons = generatedTeamSeasons.map(normalizeTeamSeason);
    players = generatedPlayers.map(normalizePlayer);
    dataStatus = generatedDataStatus;
    return { loadedGenerated: true };
  } catch (error) {
    const warning =
      error instanceof Error
        ? `Generated data not found. Using sample data. ${error.message}`
        : "Generated data not found. Using sample data.";
    dataStatus = {
      ...buildFallbackStatus(seasons, teamSeasons, players),
      warnings: [warning],
    };
    return { loadedGenerated: false, warning };
  }
}

export function getSquad(teamSeason: TeamSeason): TeamSeasonSquad {
  const season = seasons.find((item) => item.id === teamSeason.seasonId);
  if (!season) {
    throw new Error(`Missing season for team-season ${teamSeason.id}`);
  }

  return {
    ...teamSeason,
    season,
    players: players.filter((player) => player.teamSeasonId === teamSeason.id),
  };
}

export function getTeamSeasonsForSeason(seasonId: string) {
  return teamSeasons.filter((teamSeason) => teamSeason.seasonId === seasonId);
}

export function isDraftEligibleTeamSeason(teamSeason: TeamSeason) {
  return teamSeason.isPlayable && teamSeason.playerCount >= 14;
}

export function getDraftEligibleTeamSeasonsForSeason(seasonId: string) {
  return getTeamSeasonsForSeason(seasonId).filter(isDraftEligibleTeamSeason);
}

export function getDataStatus(): DataStatus {
  return dataStatus;
}
