import { RotateCcw, Share2, Star, Trophy } from "lucide-react";
import ActionButton from "./ActionButton";
import MetricPill from "./MetricPill";
import type { DifficultyMode, DraftPick, SimulationResult, SquadMetrics } from "../types";
import { getDisplayClubName } from "../utils/clubNames";
import { getOverall } from "../utils/ratingUtils";

type FinalResultScreenProps = {
  mode: DifficultyMode;
  metrics: SquadMetrics;
  result: SimulationResult;
  picks: DraftPick[];
  onRestart: () => void;
  onShare: () => void;
};

export default function FinalResultScreen({ mode, metrics, result, picks, onRestart, onShare }: FinalResultScreenProps) {
  return (
    <main className="app-frame">
      <section className="mx-auto w-full max-w-6xl py-4 sm:py-8">
        <div className="result-poster mx-auto max-w-4xl p-5 text-center sm:p-8">
          <div className="relative z-10">
            <div className="result-crest mx-auto">
              {result.trophyWon ? <Trophy size={44} /> : <Star size={44} />}
            </div>
            <div className="mx-auto mt-5 max-w-3xl">
              <div className="section-kicker">Final result</div>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight text-frost sm:text-6xl">{result.tier}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-steel/80">
                Record {result.finalRecord}. League phase #{result.leaguePosition} with {result.leaguePoints} points.{" "}
                {result.trophyWon ? "The trophy is yours." : `Final stage reached: ${result.finalStageReached}.`}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <MetricPill label="Record" value={result.finalRecord} />
              <MetricPill label="Rank" value={`#${result.leaguePosition}`} />
              <MetricPill label="Squad" value={metrics.squadRating} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricPill label="Final record" value={result.finalRecord} />
          <MetricPill label="League rank" value={`#${result.leaguePosition}`} />
          <MetricPill label="League points" value={result.leaguePoints} />
          <MetricPill label="Route" value={result.route} />
          <MetricPill label="Goals for" value={result.goalsFor} />
          <MetricPill label="Goals against" value={result.goalsAgainst} />
          <MetricPill label="Goal diff." value={result.goalDifference} />
          <MetricPill label="Stage reached" value={result.finalStageReached} />
          <MetricPill label="Trophy" value={result.trophyWon ? "Won" : "No"} />
          <MetricPill label="Difficulty" value={mode === "classic" ? "Classic" : "Hard"} />
          <MetricPill label="Top scorer" value={result.topScorer.name} />
          <MetricPill label="Tournament player" value={result.playerOfTournament.name} />
          <MetricPill label="Best player" value={`${result.bestRatedPlayer.name} (${getOverall(result.bestRatedPlayer)})`} />
          <MetricPill label="Squad rating" value={metrics.squadRating} />
          <MetricPill label="Adjusted avg." value={metrics.teamOverall} />
          <MetricPill label="Position fit" value={`${metrics.positionFit}%`} />
          <MetricPill label="Chemistry" value={metrics.chemistry} />
          <MetricPill label="Club diversity" value={metrics.clubDiversity} />
          <MetricPill label="Season diversity" value={metrics.seasonDiversity} />
        </div>

        <div className="mt-6 game-panel p-4">
          <div className="section-kicker">Drafted XI</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {picks.map((pick) => (
              <div key={pick.slotId} className="rounded-2xl border border-frost/10 bg-night-950/35 px-3 py-2 text-sm text-steel">
                <span className="font-black text-frost">{pick.player.name}</span> - {getDisplayClubName(pick.player.clubName)}{" "}
                {pick.player.seasonLabel} - slot penalty {pick.penalty}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ActionButton onClick={onShare}>
            <Share2 size={18} />
            Share result
          </ActionButton>
          <ActionButton tone="secondary" onClick={onRestart}>
            <RotateCcw size={18} />
            New run
          </ActionButton>
        </div>
      </section>
    </main>
  );
}
