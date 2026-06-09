import type { Player, Season, TeamReference, TeamSeason, ValidationReport } from "../types";

function duplicates(values: string[]) {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  });
  return [...repeated];
}

function teamKey(seasonId: string, clubName: string) {
  return `${seasonId}::${clubName.trim().toLowerCase()}`;
}

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

export function validateGameData(
  seasons: Season[],
  teamSeasons: TeamSeason[],
  players: Player[],
  teamReference: TeamReference[] = [],
): ValidationReport {
  const seasonIds = new Set(seasons.map((season) => season.id));
  const teamSeasonById = new Map(teamSeasons.map((teamSeason) => [teamSeason.id, teamSeason]));
  const teamSeasonKeys = new Set(teamSeasons.map((teamSeason) => teamKey(teamSeason.seasonId, teamSeason.clubName)));
  const warnings: string[] = [];

  const playersByTeamSeason = new Map<string, Player[]>();
  for (const player of players) {
    const list = playersByTeamSeason.get(player.teamSeasonId) ?? [];
    list.push(player);
    playersByTeamSeason.set(player.teamSeasonId, list);
  }

  const teamsPerSeason = teamSeasons.reduce<Record<string, number>>((acc, teamSeason) => {
    acc[teamSeason.seasonId] = (acc[teamSeason.seasonId] ?? 0) + 1;
    return acc;
  }, {});

  const playersPerTeamSeason = Object.fromEntries(
    teamSeasons.map((teamSeason) => [teamSeason.id, playersByTeamSeason.get(teamSeason.id)?.length ?? 0]),
  );

  const playableTeamSeasons = teamSeasons
    .filter((teamSeason) => teamSeason.isPlayable && (playersByTeamSeason.get(teamSeason.id)?.length ?? 0) >= 14)
    .map((teamSeason) => teamSeason.id);
  const completeTeamSeasons = teamSeasons
    .filter((teamSeason) => teamSeason.isComplete && (playersByTeamSeason.get(teamSeason.id)?.length ?? 0) >= 20)
    .map((teamSeason) => teamSeason.id);
  const invalidDraftTeamSeasons = teamSeasons
    .filter((teamSeason) => !teamSeason.isPlayable || (playersByTeamSeason.get(teamSeason.id)?.length ?? 0) < 14)
    .map((teamSeason) => teamSeason.id);

  const validTeamSeasonSet = new Set(playableTeamSeasons);
  const seasonsWithZeroValidTeamSeasons = seasons
    .filter((season) => !teamSeasons.some((teamSeason) => teamSeason.seasonId === season.id && validTeamSeasonSet.has(teamSeason.id)))
    .map((season) => season.id);

  const missingTeamsPerSeason = teamReference.reduce<Record<string, string[]>>((acc, reference) => {
    if (!teamSeasonKeys.has(teamKey(reference.seasonId, reference.clubName))) {
      acc[reference.seasonId] = [...(acc[reference.seasonId] ?? []), reference.clubName];
    }
    return acc;
  }, {});

  const seasonsWithOnlyFamousClubs = seasons
    .filter((season) => {
      const clubs = teamSeasons.filter((teamSeason) => teamSeason.seasonId === season.id).map((teamSeason) => teamSeason.clubName);
      return clubs.length > 0 && clubs.every((club) => famousClubWatchlist.has(club.toLowerCase()));
    })
    .map((season) => season.id);

  if (teamSeasons.some((teamSeason) => !teamSeason.isComplete)) {
    warnings.push("Some team-seasons have fewer than 20 players; they stay generated and are playable when they have at least 14 players.");
  }

  if (invalidDraftTeamSeasons.length) {
    warnings.push("Some team-seasons have fewer than 14 players and will not appear in draft draws.");
  }

  if (players.some((player) => player.positionWasDefaulted)) {
    warnings.push("Some players had missing positions and were defaulted to CM.");
  }

  if (players.some((player) => player.ratingType === "missing" || player.overallRating === null)) {
    warnings.push("Some players are missing overall ratings and need rating imports or conservative estimates.");
  }

  const fullReferenceLikely = teamReference.length >= seasons.length * 16;

  if (teamReference.length > 0 && (!fullReferenceLikely || Object.keys(missingTeamsPerSeason).length)) {
    warnings.push("Dataset currently does not include every Champions League team-season.");
  }

  if (seasonsWithOnlyFamousClubs.length) {
    warnings.push("Some loaded seasons contain only famous-club sample entries.");
  }

  const invalidReferences: string[] = [];
  const wrongSeasonPlayers: string[] = [];

  for (const teamSeason of teamSeasons) {
    if (!seasonIds.has(teamSeason.seasonId)) {
      invalidReferences.push(`Team-season ${teamSeason.id} references missing season ${teamSeason.seasonId}`);
    }
  }

  for (const player of players) {
    const teamSeason = teamSeasonById.get(player.teamSeasonId);
    if (!teamSeason) {
      invalidReferences.push(`Player ${player.id} references missing team-season ${player.teamSeasonId}`);
      continue;
    }

    if (!player.ratingType) {
      invalidReferences.push(`Player ${player.id} is missing ratingType`);
    }

    if (player.overallRating === null && player.ratingType !== "missing") {
      invalidReferences.push(`Player ${player.id} has no overallRating but is not marked missing`);
    }

    if (player.ratingType === "online" && player.overallRating === null) {
      invalidReferences.push(`Online-rated player ${player.id} is missing overallRating`);
    }

    if (player.ratingType === "online" && (!player.sourceName || !player.sourceUrl)) {
      invalidReferences.push(`Online-rated player ${player.id} is missing sourceName or sourceUrl`);
    }

    if (player.seasonId !== teamSeason.seasonId) {
      wrongSeasonPlayers.push(
        `Player ${player.id} has season ${player.seasonId}, but ${teamSeason.id} belongs to ${teamSeason.seasonId}`,
      );
    }
  }

  return {
    totalSeasons: seasons.length,
    totalTeamSeasons: teamSeasons.length,
    totalPlayers: players.length,
    playableTeamSeasons,
    completeTeamSeasons,
    incompleteTeamSeasons: teamSeasons.filter((teamSeason) => !teamSeason.isComplete).map((teamSeason) => teamSeason.id),
    teamsPerSeason,
    playersPerTeamSeason,
    missingTeamsPerSeason,
    teamSeasonsWithFewerThan20Players: invalidDraftTeamSeasons,
    seasonsWithZeroValidTeamSeasons,
    validDraftTeamSeasons: playableTeamSeasons,
    invalidDraftTeamSeasons,
    playersMissingPrimaryPosition: players.filter((player) => !player.primaryPosition).map((player) => player.id),
    playersMissingPositions: players.filter((player) => player.positions.length === 0).map((player) => player.id),
    playersWithDefaultedPositions: players.filter((player) => player.positionWasDefaulted).map((player) => player.id),
    playersMissingNationality: players.filter((player) => !player.nationality).map((player) => player.id),
    playersMissingBirthYear: players.filter((player) => player.birthYear === null).map((player) => player.id),
    playersMissingRatings: players.filter((player) => player.overallRating === null).map((player) => player.id),
    playersWithOnlineRatings: players.filter((player) => player.ratingType === "online").length,
    playersWithEstimatedRatings: players.filter((player) => player.ratingType === "estimated").length,
    playersWithMissingRatings: players.filter((player) => player.ratingType === "missing").length,
    seasonsWithOnlyFamousClubs,
    duplicateSeasonIds: duplicates(seasons.map((season) => season.id)),
    duplicateTeamSeasonIds: duplicates(teamSeasons.map((teamSeason) => teamSeason.id)),
    duplicatePlayerIds: duplicates(players.map((player) => player.id)),
    invalidReferences,
    wrongSeasonPlayers,
    warnings,
  };
}

export function getValidationErrors(report: ValidationReport) {
  const errors: string[] = [];
  if (report.totalSeasons === 0) errors.push("No seasons loaded.");
  if (report.totalTeamSeasons === 0) errors.push("No team-seasons loaded.");
  if (report.totalPlayers === 0) errors.push("No players loaded.");
  if (report.playableTeamSeasons.length === 0) errors.push("No playable team-seasons loaded.");
  if (report.seasonsWithZeroValidTeamSeasons.length === report.totalSeasons && report.totalSeasons > 0) {
    errors.push("Every loaded season has zero draft-valid team-seasons.");
  }
  if (report.duplicateSeasonIds.length) errors.push(`Duplicate season IDs: ${report.duplicateSeasonIds.join(", ")}`);
  if (report.duplicateTeamSeasonIds.length) {
    errors.push(`Duplicate team-season IDs: ${report.duplicateTeamSeasonIds.join(", ")}`);
  }
  if (report.duplicatePlayerIds.length) errors.push(`Duplicate player IDs: ${report.duplicatePlayerIds.join(", ")}`);
  errors.push(...report.invalidReferences);
  errors.push(...report.wrongSeasonPlayers);
  return errors;
}
