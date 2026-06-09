import type { DraftPick, FormationSlot, MatchResult, Player, SimulationResult, SquadMetrics } from "../types";
import { seasons, teamSeasons } from "../data/gameData";
import { getDisplayClubName, normalizeClubName } from "./clubNames";
import { getAdjustedOverall, getOverall } from "./ratingUtils";
import { randomInt, randomItem } from "./random";

const round = (value: number) => Math.round(value * 10) / 10;
const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

export function calculateSquadMetrics(picks: DraftPick[], _slots: FormationSlot[]): SquadMetrics {
  const players = picks.map((pick) => pick.player);
  const adjustedRatings = picks.map((pick) => getAdjustedOverall(pick.player, pick.penalty));
  const clubs = new Set(players.map((player) => player.clubName));
  const seasons = new Set(players.map((player) => player.seasonId));
  const averageOverall = average(players.map(getOverall));
  const teamOverall = average(adjustedRatings);
  const positionFit = average(picks.map((pick) => pick.fit)) * 100;

  const sameClubLinks = players.filter((player, index) =>
    players.some((other, otherIndex) => otherIndex !== index && other.clubName === player.clubName),
  ).length;
  const chemistry = Math.min(100, 70 + sameClubLinks * 2.4 + Math.max(0, 6 - clubs.size) * 1.2);
  const clubDiversity = Math.min(100, 60 + clubs.size * 4.5);
  const seasonDiversity = Math.min(100, 66 + seasons.size * 5.5);

  // Modern-format strength model using the simplified rating system:
  // adjusted XI overall is the base, with smaller bonuses for fit, chemistry, club diversity, and season diversity.
  const squadRating =
    teamOverall * 0.78 +
    positionFit * 0.08 +
    chemistry * 0.06 +
    clubDiversity * 0.04 +
    seasonDiversity * 0.04;

  return {
    teamOverall: round(teamOverall),
    averageOverall: round(averageOverall),
    positionFit: round(positionFit),
    chemistry: round(chemistry),
    clubDiversity: round(clubDiversity),
    seasonDiversity: round(seasonDiversity),
    squadRating: round(squadRating),
  };
}

function uniqueDisplayClubNames(names: string[]) {
  const byNormalized = new Map<string, string>();
  for (const name of names) {
    const displayName = getDisplayClubName(name);
    byNormalized.set(normalizeClubName(displayName), displayName);
  }
  return [...byNormalized.values()].sort((a, b) => a.localeCompare(b));
}

function buildOpponentPool() {
  const latestSeason = [...seasons]
    .sort((a, b) => b.yearEnd - a.yearEnd)
    .find((season) => teamSeasons.filter((teamSeason) => teamSeason.seasonId === season.id && teamSeason.isPlayable).length >= 24);

  if (latestSeason) {
    return uniqueDisplayClubNames(
      teamSeasons
        .filter((teamSeason) => teamSeason.seasonId === latestSeason.id && teamSeason.isPlayable)
        .map((teamSeason) => teamSeason.clubName),
    );
  }

  const allPlayable = uniqueDisplayClubNames(teamSeasons.filter((teamSeason) => teamSeason.isPlayable).map((teamSeason) => teamSeason.clubName));
  return allPlayable.length ? allPlayable : ["Real Madrid", "Barcelona", "Bayern Munich", "AC Milan"];
}

function takeOpponent(pool: string[], used: Set<string>) {
  const unused = pool.filter((club) => !used.has(club));
  const opponent = randomItem(unused.length ? unused : pool);
  used.add(opponent);
  return opponent;
}

function scoreFromExpected(expected: number) {
  const roll = Math.random();
  if (expected > 2.2 && roll > 0.18) return randomInt(2, 4);
  if (expected > 1.6 && roll > 0.22) return randomInt(1, 3);
  if (expected > 1.15 && roll > 0.34) return randomInt(1, 2);
  return roll > 0.62 ? 1 : 0;
}

function makeMatch(stage: string, opponent: string, opponentStrength: number, squadRating: number): MatchResult {
  const edge = (squadRating - opponentStrength) / 18;
  const homeExpected = Math.max(0.25, Math.min(3.2, 1.35 + edge));
  const awayExpected = Math.max(0.15, Math.min(2.9, 1.08 - edge * 0.65));
  const homeGoals = scoreFromExpected(homeExpected);
  const awayGoals = scoreFromExpected(awayExpected);
  const won = homeGoals > awayGoals;
  const draw = homeGoals === awayGoals;

  return {
    stage,
    opponent,
    opponentStrength: round(opponentStrength),
    homeGoals,
    awayGoals,
    won,
    draw,
    points: won ? 3 : draw ? 1 : 0,
  };
}

function estimateLeagueRank(points: number, goalDifference: number, squadRating: number) {
  const tableScore = points * 3.2 + goalDifference * 0.75 + (squadRating - 84) * 0.9 + Math.random() * 5;
  if (tableScore >= 69) return randomInt(1, 4);
  if (tableScore >= 58) return randomInt(5, 8);
  if (tableScore >= 43) return randomInt(9, 16);
  if (tableScore >= 31) return randomInt(17, 24);
  return randomInt(25, 36);
}

function aggregateWon(matches: MatchResult[]) {
  const goalsFor = matches.reduce((sum, match) => sum + match.homeGoals, 0);
  const goalsAgainst = matches.reduce((sum, match) => sum + match.awayGoals, 0);
  if (goalsFor === goalsAgainst) return Math.random() > 0.44;
  return goalsFor > goalsAgainst;
}

function pickWeightedPlayer(players: Player[]) {
  const sorted = [...players].sort((a, b) => getOverall(b) - getOverall(a));
  return sorted[Math.min(sorted.length - 1, Math.floor(Math.random() * 3))];
}

function tierFor(trophyWon: boolean, route: SimulationResult["route"], finalStageReached: string, wins: number, losses: number) {
  if (trophyWon && route === "Direct Round of 16" && wins === 15 && losses === 0) return "Perfect 15-0";
  if (trophyWon && losses === 0) return "Unbeaten Champions";
  if (trophyWon) return "Champions";
  if (finalStageReached === "Final") return "Finalist";
  if (finalStageReached === "Semi-final") return "Semi-finalist";
  if (finalStageReached === "Quarter-final") return "Quarter-finalist";
  if (finalStageReached === "Round of 16") return "Round of 16 Exit";
  if (finalStageReached === "Playoff") return "Playoff Exit";
  return "League Phase Exit";
}

export function simulateCampaign(picks: DraftPick[], slots: FormationSlot[], metrics: SquadMetrics): SimulationResult {
  void slots;
  const players = picks.map((pick) => pick.player);
  const matches: MatchResult[] = [];
  const opponentPool = buildOpponentPool();
  const usedOpponents = new Set<string>();

  for (let index = 0; index < 8; index += 1) {
    matches.push(makeMatch("League phase", takeOpponent(opponentPool, usedOpponents), randomInt(78, 96), metrics.squadRating));
  }

  const leagueMatches = matches.slice(0, 8);
  const leagueWins = leagueMatches.filter((match) => match.won).length;
  const leagueDraws = leagueMatches.filter((match) => match.draw).length;
  const leagueLosses = 8 - leagueWins - leagueDraws;
  const leaguePoints = leagueMatches.reduce((sum, match) => sum + match.points, 0);
  const goalsFor = leagueMatches.reduce((sum, match) => sum + match.homeGoals, 0);
  const goalsAgainst = leagueMatches.reduce((sum, match) => sum + match.awayGoals, 0);
  const goalDifference = goalsFor - goalsAgainst;
  const leaguePosition = estimateLeagueRank(leaguePoints, goalDifference, metrics.squadRating);

  let route: SimulationResult["route"] = "League phase exit";
  let finalStageReached = "League phase";
  let trophyWon = false;

  if (leaguePosition <= 8) {
    route = "Direct Round of 16";
    finalStageReached = "Round of 16";
  } else if (leaguePosition <= 24) {
    route = "Playoff route";
    finalStageReached = "Playoff";
    const playoffOpponent = takeOpponent(opponentPool, usedOpponents);
    const playoff = [
      makeMatch("Playoff first leg", playoffOpponent, randomInt(82, 91), metrics.squadRating),
      makeMatch("Playoff second leg", playoffOpponent, randomInt(82, 91), metrics.squadRating),
    ];
    matches.push(...playoff);
    if (!aggregateWon(playoff)) {
      return finishResult(matches, leagueWins, leagueDraws, leagueLosses, leaguePoints, goalsFor, goalsAgainst, leaguePosition, route, true, finalStageReached, trophyWon, players);
    }
    finalStageReached = "Round of 16";
  }

  const knockoutStages = [
    { name: "Round of 16", min: 84, max: 92, next: "Quarter-final" },
    { name: "Quarter-final", min: 87, max: 94, next: "Semi-final" },
    { name: "Semi-final", min: 90, max: 96, next: "Final" },
  ];

  if (route !== "League phase exit") {
    for (const stage of knockoutStages) {
      const opponent = takeOpponent(opponentPool, usedOpponents);
      const tie = [
        makeMatch(`${stage.name} first leg`, opponent, randomInt(stage.min, stage.max), metrics.squadRating),
        makeMatch(`${stage.name} second leg`, opponent, randomInt(stage.min, stage.max), metrics.squadRating),
      ];
      matches.push(...tie);
      finalStageReached = stage.name;
      if (!aggregateWon(tie)) {
        return finishResult(matches, leagueWins, leagueDraws, leagueLosses, leaguePoints, goalsFor, goalsAgainst, leaguePosition, route, route === "Playoff route", finalStageReached, trophyWon, players);
      }
      finalStageReached = stage.next;
    }

    const final = makeMatch("Final", takeOpponent(opponentPool, usedOpponents), randomInt(91, 96), metrics.squadRating);
    matches.push(final);
    finalStageReached = "Final";
    trophyWon = final.won;
  }

  return finishResult(matches, leagueWins, leagueDraws, leagueLosses, leaguePoints, goalsFor, goalsAgainst, leaguePosition, route, route === "Playoff route", finalStageReached, trophyWon, players);
}

function finishResult(
  matches: MatchResult[],
  leagueWins: number,
  leagueDraws: number,
  leagueLosses: number,
  leaguePoints: number,
  leagueGoalsFor: number,
  leagueGoalsAgainst: number,
  leaguePosition: number,
  route: SimulationResult["route"],
  playoffRequired: boolean,
  finalStageReached: string,
  trophyWon: boolean,
  players: Player[],
): SimulationResult {
  const totalWins = matches.filter((match) => match.won).length;
  const totalDraws = matches.filter((match) => match.draw).length;
  const totalLosses = matches.length - totalWins - totalDraws;
  const bestRatedPlayer = [...players].sort((a, b) => getOverall(b) - getOverall(a))[0];

  return {
    matches,
    leagueWins,
    leagueDraws,
    leagueLosses,
    leaguePoints,
    goalsFor: leagueGoalsFor,
    goalsAgainst: leagueGoalsAgainst,
    goalDifference: leagueGoalsFor - leagueGoalsAgainst,
    leaguePosition,
    route,
    playoffRequired,
    finalStageReached,
    knockoutResult: trophyWon ? "Trophy won" : finalStageReached,
    trophyWon,
    finalRecord: `${totalWins}-${totalDraws}-${totalLosses}`,
    topScorer: pickWeightedPlayer(players),
    playerOfTournament: pickWeightedPlayer(players),
    bestRatedPlayer,
    tier: tierFor(trophyWon, route, finalStageReached, totalWins, totalLosses),
  };
}
