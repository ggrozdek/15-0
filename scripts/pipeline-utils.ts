import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { list, numberOrNull, readRows, writeJson } from "./import-utils";
import type { Player, Position, RatingType, Season, TeamReference, TeamSeason } from "../src/types";

const positionMap: Record<string, Position> = {
  GK: "GK",
  G: "GK",
  GOALKEEPER: "GK",
  KEEPER: "GK",
  CB: "CB",
  DF: "CB",
  "CENTRE-BACK": "CB",
  "CENTER-BACK": "CB",
  "DEFENDER CENTRE": "CB",
  "DEFENDER CENTER": "CB",
  LB: "LB",
  "LEFT-BACK": "LB",
  "LEFT BACK": "LB",
  RB: "RB",
  "RIGHT-BACK": "RB",
  "RIGHT BACK": "RB",
  LWB: "LWB",
  "LEFT WING-BACK": "LWB",
  "LEFT WING BACK": "LWB",
  RWB: "RWB",
  "RIGHT WING-BACK": "RWB",
  "RIGHT WING BACK": "RWB",
  DM: "CDM",
  CDM: "CDM",
  "DEFENSIVE MIDFIELD": "CDM",
  CM: "CM",
  MF: "CM",
  "CENTRAL MIDFIELD": "CM",
  "MIDFIELDER CENTRE": "CM",
  "MIDFIELDER CENTER": "CM",
  AM: "CAM",
  CAM: "CAM",
  "ATTACKING MIDFIELD": "CAM",
  LM: "LM",
  "LEFT MIDFIELD": "LM",
  RM: "RM",
  "RIGHT MIDFIELD": "RM",
  LW: "LW",
  "LEFT WINGER": "LW",
  "FORWARD LEFT": "LW",
  RW: "RW",
  "RIGHT WINGER": "RW",
  "FORWARD RIGHT": "RW",
  CF: "CF",
  "CENTRE-FORWARD": "CF",
  "CENTER-FORWARD": "CF",
  ST: "ST",
  FW: "ST",
  FWD: "ST",
  STRIKER: "ST",
  "FORWARD CENTRE": "ST",
  "FORWARD CENTER": "ST",
};

export type RawRating = {
  playerName: string;
  clubName: string;
  year: number;
  positions: Position[];
  overallRating: number | null;
  ratingType: RatingType;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
};

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeNameKey(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

const legendMinimums = new Map(
  [
    ["Cristiano Ronaldo", 94],
    ["Lionel Messi", 94],
    ["Zinedine Zidane", 92],
    ["Ronaldo", 92],
    ["Ronaldinho", 92],
    ["Kaka", 91],
    ["Andres Iniesta", 91],
    ["Xavi", 91],
    ["Luka Modric", 91],
    ["Karim Benzema", 91],
    ["Robert Lewandowski", 91],
    ["Thierry Henry", 90],
    ["Samuel Eto'o", 90],
    ["Neymar", 90],
    ["Luis Suarez", 90],
    ["Zlatan Ibrahimovic", 90],
    ["Sergio Ramos", 90],
    ["Paolo Maldini", 90],
    ["Alessandro Nesta", 90],
    ["Gianluigi Buffon", 90],
    ["Iker Casillas", 90],
    ["Manuel Neuer", 90],
    ["Xabi Alonso", 89],
    ["Toni Kroos", 89],
    ["Steven Gerrard", 89],
    ["Frank Lampard", 89],
    ["Didier Drogba", 89],
    ["Wayne Rooney", 89],
    ["Raul", 89],
    ["Arjen Robben", 89],
    ["Franck Ribery", 89],
    ["Sergio Busquets", 89],
    ["Gerard Pique", 88],
    ["Carles Puyol", 88],
    ["Virgil van Dijk", 88],
    ["Mohamed Salah", 88],
    ["Sadio Mane", 88],
    ["Kevin De Bruyne", 88],
    ["Erling Haaland", 88],
    ["Kylian Mbappe", 88],
    ["Andrea Pirlo", 88],
    ["Clarence Seedorf", 88],
    ["David Beckham", 87],
    ["Ryan Giggs", 87],
    ["Paul Scholes", 87],
    ["Sergio Aguero", 87],
    ["Eden Hazard", 87],
    ["Gareth Bale", 87],
    ["Thomas Muller", 87],
    ["Philipp Lahm", 87],
    ["Dani Alves", 87],
    ["Marcelo", 87],
    ["Roberto Carlos", 87],
    ["Petr Cech", 87],
    ["Thibaut Courtois", 87],
    ["Edwin van der Sar", 87],
  ].map(([name, rating]) => [normalizeNameKey(String(name)), Number(rating)]),
);

function pick(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[alias];
    if (value !== undefined && value !== "") return value;
  }
  const lowerMap = new Map(Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]));
  for (const alias of aliases) {
    const value = lowerMap.get(alias.toLowerCase());
    if (value !== undefined && value !== "") return value;
  }
  return "";
}

function toId(value: string) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function parseSeason(raw: string) {
  const label = raw.trim();
  const match = label.match(/(\d{4})\D+(\d{2,4})/);
  if (!match) return { seasonLabel: label, yearStart: Number(label.slice(0, 4)), yearEnd: Number(label.slice(0, 4)) + 1 };
  const yearStart = Number(match[1]);
  const endRaw = match[2];
  const yearEnd = endRaw.length === 2 ? Number(`${String(yearStart).slice(0, 2)}${endRaw}`) : Number(endRaw);
  return { seasonLabel: label, yearStart, yearEnd };
}

function makeTeamSeasonId(seasonId: string, teamId: string, clubName: string) {
  return `season-${seasonId}-team-${teamId || toId(clubName)}`;
}

function sampleGeneratedData() {
  const seasons = JSON.parse(readFileSync("src/data/seasons.json", "utf8")) as Season[];
  const existingTeamSeasons = JSON.parse(readFileSync("src/data/teamSeasons.json", "utf8")) as TeamSeason[];
  const players = JSON.parse(readFileSync("src/data/players.json", "utf8")) as Player[];
  const counts = new Map<string, number>();
  players.forEach((player) => counts.set(player.teamSeasonId, (counts.get(player.teamSeasonId) ?? 0) + 1));
  const teamSeasons = existingTeamSeasons.map((teamSeason) => {
    const playerCount = counts.get(teamSeason.id) ?? teamSeason.playerCount ?? 0;
    return {
      ...teamSeason,
      sourceName: teamSeason.sourceName || "Bundled sample data",
      sourceUrl: teamSeason.sourceUrl || "local://src/data",
      isComplete: playerCount >= 20,
      isPlayable: playerCount >= 14,
      playerCount,
    };
  }) satisfies TeamSeason[];
  const normalizedPlayers = players.map((player) => ({
    ...player,
    birthYear: player.birthYear ?? null,
    minutesPlayed: player.minutesPlayed ?? 0,
  })) satisfies Player[];
  return { seasons, teamSeasons, players: normalizedPlayers };
}

export function mapPosition(raw: string | undefined): Position {
  if (!raw) return "CM";
  const key = raw.trim().toUpperCase().replace(/\s*\/\s*/g, "/");
  return positionMap[key] ?? "CM";
}

export function mapPositions(rawPrimary: string | undefined, rawSecondary?: string | string[]) {
  const raw = rawPrimary?.trim().toUpperCase();
  if (raw === "GK") return { primaryPosition: "GK" as Position, secondaryPositions: [], positions: ["GK" as Position], defaulted: false };
  if (raw === "DF") {
    return {
      primaryPosition: "CB" as Position,
      secondaryPositions: ["LB", "RB"] as Position[],
      positions: ["CB", "LB", "RB"] as Position[],
      defaulted: false,
    };
  }
  if (raw === "MF") {
    return {
      primaryPosition: "CM" as Position,
      secondaryPositions: ["CDM", "CAM"] as Position[],
      positions: ["CM", "CDM", "CAM"] as Position[],
      defaulted: false,
    };
  }
  if (raw === "FW") {
    return {
      primaryPosition: "ST" as Position,
      secondaryPositions: ["CF", "LW", "RW"] as Position[],
      positions: ["ST", "CF", "LW", "RW"] as Position[],
      defaulted: false,
    };
  }

  const rawList = list(rawPrimary);
  if (rawList.length > 1) {
    const primaryPosition = mapPosition(rawList[0]);
    const secondaryPositions = rawList.slice(1).map(mapPosition).filter((position) => position !== primaryPosition);
    return {
      primaryPosition,
      secondaryPositions,
      positions: [...new Set([primaryPosition, ...secondaryPositions])],
      defaulted: false,
    };
  }

  const defaulted = !rawPrimary;
  const primaryPosition = mapPosition(rawPrimary);
  const secondaryPositions = list(rawSecondary).map(mapPosition).filter((position) => position !== primaryPosition);
  return {
    primaryPosition,
    secondaryPositions,
    positions: [...new Set([primaryPosition, ...secondaryPositions])],
    defaulted,
  };
}

function loadTeamBaseRatings(baseDir: string) {
  const ratings = new Map<string, number>();
  const add = (seasonId: string, teamId: string, rating: number) => {
    const key = makeTeamSeasonId(seasonId, teamId, "");
    ratings.set(key, Math.max(ratings.get(key) ?? 74, rating));
  };

  if (existsSync(`${baseDir}/group_stage.csv`)) {
    for (const row of readRows(`${baseDir}/group_stage.csv`)) {
      const status = pick(row, ["group_stage_place"]).toLowerCase();
      let teamBase = 72;
      if (status.includes("uefa") || status.includes("europa")) teamBase = 74;
      if (status.includes("first") || status.includes("secound") || status.includes("second") || status.includes("advance")) teamBase = 78;
      add(pick(row, ["season_id", "seasonId"]), pick(row, ["team_id", "teamId"]), teamBase);
    }
  }

  if (existsSync(`${baseDir}/secound_group_stage.csv`)) {
    for (const row of readRows(`${baseDir}/secound_group_stage.csv`)) {
      const status = pick(row, ["secound_group_stage_status"]).toLowerCase();
      add(pick(row, ["season_id", "seasonId"]), pick(row, ["team_id", "teamId"]), status.includes("drop") ? 76 : 78);
    }
  }

  if (existsSync(`${baseDir}/knock_out_stage.csv`)) {
    for (const row of readRows(`${baseDir}/knock_out_stage.csv`)) {
      const stage = pick(row, ["knock_out_stage"]).toLowerCase();
      const status = pick(row, ["knock_out_stage_status"]).toLowerCase();
      let teamBase = 78;
      if (stage.includes("round")) teamBase = 78;
      if (stage.includes("quater") || stage.includes("quarter")) teamBase = status.includes("advance") ? 82 : 80;
      if (stage.includes("semi")) teamBase = status.includes("advance") ? 84 : 82;
      if (stage.includes("final")) teamBase = status.includes("winner") ? 86 : 84;
      add(pick(row, ["season_id", "seasonId"]), pick(row, ["team_id", "teamId"]), teamBase);
    }
  }

  return ratings;
}

function deterministicVariance(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }
  return [-1, 0, 1][hash % 3];
}

function roleFromMinutes(minutesPlayed: number, maxMinutes: number) {
  if (!minutesPlayed || !maxMinutes) return "unknown" as const;
  const share = minutesPlayed / maxMinutes;
  if (share >= 0.8) return "star" as const;
  if (share >= 0.55) return "starter" as const;
  if (share >= 0.25) return "rotation" as const;
  return "bench" as const;
}

function ageAdjustment(age: number | null) {
  if (age === null) return 0;
  if (age >= 24 && age <= 31) return 1;
  if (age < 20 || age > 35) return -2;
  return 0;
}

function positionAdjustment(primaryPosition: Position) {
  return ["CM", "CDM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST"].includes(primaryPosition) ? 1 : 0;
}

function capByRole(rating: number, teamBase: number, role: ReturnType<typeof roleFromMinutes>, hasLegendOverride: boolean) {
  if (hasLegendOverride) return rating;
  if (role === "bench") return Math.min(rating, 78);
  if (role === "rotation") return Math.min(rating, 84);
  if (teamBase <= 74 && role === "star") return Math.min(rating, 83);
  if (teamBase <= 74 && role === "starter") return Math.min(rating, 78);
  return rating;
}

function legendMinimum(playerName: string) {
  return legendMinimums.get(normalizeNameKey(playerName));
}

function estimateOverall(params: {
  playerName: string;
  primaryPosition: Position;
  age: number | null;
  minutesPlayed: number;
  maxMinutes: number;
  teamBase: number;
  seed: string;
}) {
  const role = roleFromMinutes(params.minutesPlayed, params.maxMinutes);
  const roleAdjustment = {
    star: 5,
    starter: 2,
    rotation: -2,
    bench: -6,
    unknown: -4,
  }[role];
  const minimum = legendMinimum(params.playerName);
  const variance = deterministicVariance(params.seed);
  let rating =
    params.teamBase +
    roleAdjustment +
    positionAdjustment(params.primaryPosition) +
    ageAdjustment(params.age) +
    variance;

  rating = capByRole(rating, params.teamBase, role, minimum !== undefined);
  if (minimum !== undefined) rating = Math.max(rating, minimum);
  return Math.max(60, Math.min(96, Math.round(rating)));
}

export function loadRawChampionsLeagueData(baseDir = "data/raw/champions_league") {
  if (
    !existsSync(`${baseDir}/seasons.csv`) ||
    !existsSync(`${baseDir}/squads.csv`) ||
    !existsSync(`${baseDir}/players_list.csv`)
  ) {
    return sampleGeneratedData();
  }

  const seasons = readRows(`${baseDir}/seasons.csv`)
    .map((row) => {
      const seasonLabel = pick(row, ["season_year", "seasonLabel", "season", "label", "Season"]);
      const parsed = parseSeason(seasonLabel);
      return {
        id: pick(row, ["season_id", "seasonId", "id"]) || toId(parsed.seasonLabel),
        seasonLabel: seasonLabel || parsed.seasonLabel,
        yearStart: Number(pick(row, ["yearStart", "startYear", "year_start"])) || parsed.yearStart,
        yearEnd: Number(pick(row, ["yearEnd", "endYear", "year_end"])) || parsed.yearEnd,
      };
    })
    .filter((season) => season.yearStart >= 1992) satisfies Season[];

  const seasonIds = new Set(seasons.map((season) => season.id));
  const seasonById = new Map(seasons.map((season) => [season.id, season]));
  const teamsById = existsSync(`${baseDir}/teams.csv`)
    ? new Map(
        readRows(`${baseDir}/teams.csv`).map((row) => [
          pick(row, ["team_id", "teamId", "id"]),
          {
            clubName: pick(row, ["team_name", "teamName", "clubName"]),
            country: pick(row, ["country_name", "countryName", "country", "country_code"]),
          },
        ]),
      )
    : new Map<string, { clubName: string; country: string }>();
  const playersBySourceId = new Map(
    readRows(`${baseDir}/players_list.csv`).map((row) => [
      pick(row, ["player_id", "playerId", "id"]),
      {
        name: pick(row, ["player", "playerName", "name"]),
        nationality: pick(row, ["nationality", "nation"]),
        birthYear: numberOrNull(pick(row, ["birth_data", "birthYear", "birth_year"])),
      },
    ]),
  );
  const teamBaseRatings = loadTeamBaseRatings(baseDir);

  const squadRows = readRows(`${baseDir}/squads.csv`)
    .map((row, index) => {
      const seasonId = pick(row, ["season_id", "seasonId", "season"]);
      const teamId = pick(row, ["team_id", "teamId"]);
      const teamMeta = teamsById.get(teamId);
      const clubName = pick(row, ["team_name", "teamName", "clubName", "club"]) || teamMeta?.clubName || "";
      return {
        seasonId,
        teamId,
        teamSeasonId: makeTeamSeasonId(seasonId, teamId, clubName),
        playerId: pick(row, ["player_id", "playerId", "id"]),
        playerName: pick(row, ["player", "playerName", "name"]),
        playerPosition: pick(row, ["player_position", "playerPosition", "position"]),
        clubName,
        country: teamMeta?.country || "",
        minutesPlayed: numberOrNull(pick(row, ["min_played", "minutesPlayed", "minutes"])) ?? 0,
        sourceRowId: index + 1,
      };
    })
    .filter((row) => seasonIds.has(row.seasonId));

  const playersByTeamSeason = new Map<string, typeof squadRows>();
  for (const row of squadRows) {
    const rows = playersByTeamSeason.get(row.teamSeasonId) ?? [];
    rows.push(row);
    playersByTeamSeason.set(row.teamSeasonId, rows);
  }
  const maxMinutesByTeamSeason = new Map(
    [...playersByTeamSeason.entries()].map(([teamSeasonId, rows]) => [
      teamSeasonId,
      Math.max(...rows.map((row) => row.minutesPlayed), 0),
    ]),
  );

  const teamSeasons = [...playersByTeamSeason.entries()].map(([teamSeasonId, rows]) => {
    const first = rows[0];
    const season = seasonById.get(first.seasonId);
    const playerCount = rows.length;
    return {
      id: teamSeasonId,
      seasonId: first.seasonId,
      seasonLabel: season?.seasonLabel || first.seasonId,
      clubName: first.clubName,
      country: first.country,
      sourceName: "Uploaded Champions League archive",
      sourceUrl: "local://data/raw/champions_league",
      isComplete: playerCount >= 20,
      isPlayable: playerCount >= 14,
      playerCount,
    };
  }) satisfies TeamSeason[];

  const teamSeasonById = new Map(teamSeasons.map((teamSeason) => [teamSeason.id, teamSeason]));
  const players = squadRows.map((row) => {
    const season = seasonById.get(row.seasonId);
    const teamSeason = teamSeasonById.get(row.teamSeasonId);
    const profile = playersBySourceId.get(row.playerId);
    const mapped = mapPositions(row.playerPosition);
    const birthYear = profile?.birthYear ?? null;
    const age = birthYear && season ? season.yearStart - birthYear : null;
    const teamBase = teamBaseRatings.get(row.teamSeasonId) ?? 74;
    return {
      id: `${row.teamSeasonId}-player-${row.playerId || toId(row.playerName)}-row-${row.sourceRowId}`,
      teamSeasonId: row.teamSeasonId,
      seasonId: row.seasonId,
      seasonLabel: season?.seasonLabel || teamSeason?.seasonLabel || row.seasonId,
      clubName: row.clubName || teamSeason?.clubName || "",
      name: row.playerName || profile?.name || "",
      nationality: profile?.nationality || "",
      birthYear,
      age,
      primaryPosition: mapped.primaryPosition,
      secondaryPositions: mapped.secondaryPositions,
      positions: mapped.positions,
      positionWasDefaulted: mapped.defaulted,
      overallRating: estimateOverall({
        playerName: row.playerName || profile?.name || "",
        primaryPosition: mapped.primaryPosition,
        age,
        minutesPlayed: row.minutesPlayed,
        maxMinutes: maxMinutesByTeamSeason.get(row.teamSeasonId) ?? 0,
        teamBase,
        seed: `${row.teamSeasonId}-${row.playerId}-${row.sourceRowId}`,
      }),
      ratingType: "estimated",
      sourceName: "Uploaded Champions League archive estimate",
      sourceUrl: "local://data/raw/champions_league",
      sourceDate: "",
      minutesPlayed: row.minutesPlayed,
    };
  }) satisfies Player[];

  return { seasons, teamSeasons, players };
}

export function loadRawRatings(path = "data/raw/ratings/fifa_players.csv"): RawRating[] {
  if (!existsSync(path)) return [];
  return readRows(path).map((row) => {
    const name = pick(row, ["playerName", "name", "player_name", "short_name", "long_name"]);
    const club = pick(row, ["clubName", "club", "club_name", "team", "Team"]);
    const mapped = mapPositions(
      pick(row, ["primaryPosition", "position", "primary_position", "player_positions"]),
      pick(row, ["secondaryPositions", "positions", "secondary_positions", "player_positions"]),
    );
    return {
      playerName: name,
      clubName: club,
      year: Number(pick(row, ["year", "seasonYear", "fifaYear", "fifa_version", "version", "season"])),
      positions: mapped.positions,
      overallRating: numberOrNull(pick(row, ["overallRating", "overall", "Overall", "ova", "OVA"])),
      ratingType: ((pick(row, ["ratingType"]) as RatingType) || "online") as RatingType,
      sourceName: pick(row, ["sourceName", "source"]) || "Raw ratings data",
      sourceUrl: pick(row, ["sourceUrl", "url"]) || "local://data/raw/ratings",
      sourceDate: pick(row, ["sourceDate", "date"]) || "",
    };
  });
}

export function mergeRatings(players: Player[], ratings: RawRating[]) {
  return players.map((player) => {
    const playerYear = Number(player.seasonLabel.slice(0, 4));
    const exactClubCandidates = ratings
      .filter((rating) => {
        return normalizeText(rating.playerName) === normalizeText(player.name) && normalizeText(rating.clubName) === normalizeText(player.clubName);
      })
      .sort((a, b) => Math.abs(a.year - playerYear) - Math.abs(b.year - playerYear));
    const exactNameCandidates = ratings
      .filter((rating) => normalizeText(rating.playerName) === normalizeText(player.name))
      .sort((a, b) => Math.abs(a.year - playerYear) - Math.abs(b.year - playerYear));
    const match = exactClubCandidates[0] ?? exactNameCandidates[0];

    if (match?.overallRating !== null && match?.overallRating !== undefined) {
      return {
        ...player,
        overallRating: match.overallRating,
        ratingType: match.ratingType === "online" ? "online" : "estimated",
        sourceName: match.sourceName,
        sourceUrl: match.sourceUrl,
        sourceDate: match.sourceDate,
      } satisfies Player;
    }

    return player;
  });
}

export function buildDataStatus(seasons: Season[], teamSeasons: TeamSeason[], players: Player[], hasFullCoverage: boolean, warnings: string[]) {
  const playable = teamSeasons.filter((teamSeason) => teamSeason.isPlayable).length;
  const complete = teamSeasons.filter((teamSeason) => teamSeason.isComplete).length;
  const mode = hasFullCoverage ? "full" : seasons.length > 10 ? "uploaded" : "sample";
  return {
    datasetMode: mode,
    datasetName:
      mode === "full" ? "full Champions League coverage" : mode === "uploaded" ? "uploaded Champions League data" : "sample data",
    generatedAt: new Date().toISOString(),
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
    coverageStatus: hasFullCoverage ? "full" : "partial",
    warnings,
  };
}

export function loadReference(path = "data/raw/champions_league/champions_league_team_reference.csv"): TeamReference[] {
  if (!existsSync(path)) return [];
  return readRows(path).map((row) => ({
    seasonId: pick(row, ["season_id", "seasonId", "season"]),
    seasonLabel: pick(row, ["season_year", "seasonLabel", "season", "label"]),
    clubName: pick(row, ["team_name", "clubName", "club", "team", "Team"]),
    country: pick(row, ["country_name", "country", "nation"]),
  }));
}

export function writeGeneratedFiles(seasons: Season[], teamSeasons: TeamSeason[], players: Player[], dataStatus: unknown) {
  writeJson("src/data/generated/seasons.json", seasons);
  writeJson("src/data/generated/teamSeasons.json", teamSeasons);
  writeJson("src/data/generated/players.json", players);
  writeJson("src/data/generated/dataStatus.json", dataStatus);
  writeJson("public/data/generated/seasons.json", seasons);
  writeJson("public/data/generated/teamSeasons.json", teamSeasons);
  writeJson("public/data/generated/players.json", players);
  writeJson("public/data/generated/dataStatus.json", dataStatus);
}

export function writeIntermediate(path: string, data: unknown) {
  const resolved = resolve(path);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function readIntermediate<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
