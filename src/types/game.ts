export type Position =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "LWB"
  | "RWB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "CF"
  | "ST";

export type DifficultyMode = "classic" | "hard";
export type FormationName =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "3-5-2"
  | "3-4-3"
  | "5-3-2"
  | "4-1-2-1-2"
  | "4-3-1-2"
  | "4-2-2-2"
  | "4-5-1"
  | "4-1-4-1"
  | "5-4-1"
  | "5-2-1-2"
  | "3-4-1-2"
  | "3-4-2-1"
  | "3-1-4-2"
  | "4-2-4";
export type RatingType = "online" | "estimated" | "missing";
export type PositionFit = "natural" | "close" | "awkward" | "invalid";

export interface Season {
  id: string;
  seasonLabel: string;
  yearStart: number;
  yearEnd: number;
}

export interface TeamSeason {
  id: string;
  seasonId: string;
  seasonLabel: string;
  clubName: string;
  country: string;
  sourceName: string;
  sourceUrl: string;
  isComplete: boolean;
  isPlayable: boolean;
  playerCount: number;
}

export interface TeamReference {
  seasonId: string;
  seasonLabel: string;
  clubName: string;
  country: string;
}

export interface Player {
  id: string;
  teamSeasonId: string;
  seasonId: string;
  seasonLabel: string;
  clubName: string;
  name: string;
  nationality: string;
  birthYear: number | null;
  age: number | null;
  primaryPosition: Position;
  secondaryPositions: Position[];
  positions: Position[];
  positionWasDefaulted?: boolean;
  overallRating: number | null;
  ratingType: RatingType;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  minutesPlayed: number;
}

export interface TeamSeasonSquad extends TeamSeason {
  season: Season;
  players: Player[];
}

export interface FormationSlot {
  id: string;
  label: Position;
  line: "gk" | "defense" | "midfield" | "attack";
  x: number;
  y: number;
}

export interface PositionCompatibility {
  allowed: boolean;
  fit: PositionFit;
  penalty: number;
}

export interface DraftPick {
  slotId: string;
  player: Player;
  fit: number;
  penalty: number;
}

export interface SquadMetrics {
  teamOverall: number;
  averageOverall: number;
  positionFit: number;
  chemistry: number;
  clubDiversity: number;
  seasonDiversity: number;
  squadRating: number;
}

export interface DataStatus {
  datasetMode: "sample" | "uploaded" | "full";
  datasetName: string;
  generatedAt: string;
  totalSeasons: number;
  totalTeamSeasons: number;
  totalPlayers: number;
  validTeamSeasons: number;
  playableTeamSeasons: number;
  completeTeamSeasons: number;
  incompleteTeamSeasons: number;
  onlineRatings: number;
  estimatedRatings: number;
  missingRatings: number;
  coverageStatus: "partial" | "full";
  warnings: string[];
}

export interface MatchResult {
  stage: string;
  opponent: string;
  opponentStrength: number;
  homeGoals: number;
  awayGoals: number;
  won: boolean;
  draw: boolean;
  points: number;
}

export interface SimulationResult {
  matches: MatchResult[];
  leagueWins: number;
  leagueDraws: number;
  leagueLosses: number;
  leaguePoints: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  leaguePosition: number;
  route: "Direct Round of 16" | "Playoff route" | "League phase exit";
  playoffRequired: boolean;
  finalStageReached: string;
  knockoutResult: string;
  trophyWon: boolean;
  finalRecord: string;
  topScorer: Player;
  playerOfTournament: Player;
  bestRatedPlayer: Player;
  tier: string;
}

export interface ValidationReport {
  totalSeasons: number;
  totalTeamSeasons: number;
  totalPlayers: number;
  playableTeamSeasons: string[];
  completeTeamSeasons: string[];
  incompleteTeamSeasons: string[];
  teamsPerSeason: Record<string, number>;
  playersPerTeamSeason: Record<string, number>;
  missingTeamsPerSeason: Record<string, string[]>;
  teamSeasonsWithFewerThan20Players: string[];
  seasonsWithZeroValidTeamSeasons: string[];
  validDraftTeamSeasons: string[];
  invalidDraftTeamSeasons: string[];
  playersMissingPrimaryPosition: string[];
  playersMissingPositions: string[];
  playersWithDefaultedPositions: string[];
  playersMissingNationality: string[];
  playersMissingBirthYear: string[];
  playersMissingRatings: string[];
  playersWithOnlineRatings: number;
  playersWithEstimatedRatings: number;
  playersWithMissingRatings: number;
  seasonsWithOnlyFamousClubs: string[];
  duplicateSeasonIds: string[];
  duplicateTeamSeasonIds: string[];
  duplicatePlayerIds: string[];
  invalidReferences: string[];
  wrongSeasonPlayers: string[];
  warnings: string[];
}
