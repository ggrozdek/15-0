import { ArrowRight, Medal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ActionButton from "./ActionButton";
import BottomActionBar from "./BottomActionBar";
import MetricPill from "./MetricPill";
import type { MatchResult, SimulationResult } from "../types";

type SimulationScreenProps = {
  result: SimulationResult;
  onContinue: () => void;
};

export default function SimulationScreen({ result, onContinue }: SimulationScreenProps) {
  const [started, setStarted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const complete = visibleCount >= result.matches.length;
  const visibleMatches = started ? result.matches.slice(0, visibleCount) : [];
  const latestMatch = visibleMatches.length ? visibleMatches[visibleMatches.length - 1] : undefined;
  const aggregateSummaries = useMemo(() => getAggregateSummaries(visibleMatches), [visibleMatches]);
  const leagueSummaryVisible = visibleCount >= Math.min(8, result.matches.length);

  function revealNext() {
    setStarted(true);
    setVisibleCount((count) => Math.min(result.matches.length, count + 1));
  }

  useEffect(() => {
    if (!autoPlay || !started || complete) return;
    const delay = 1200 + Math.round(Math.random() * 600);
    const timer = window.setTimeout(revealNext, delay);
    return () => window.clearTimeout(timer);
  }, [autoPlay, complete, started, visibleCount]);

  return (
    <main className="app-frame">
      <section className="mx-auto grid w-full max-w-7xl gap-4 xl:grid-cols-[340px_1fr]">
        <aside className="game-panel p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-signal">
            <Medal size={17} />
            Modern format simulated
          </div>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight text-frost">{result.tier}</h1>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <MetricPill label="Record" value={result.finalRecord} />
            <MetricPill label="League rank" value={`#${result.leaguePosition}`} />
            <MetricPill label="Points" value={result.leaguePoints} />
            <MetricPill label="Route" value={result.route.replace(" route", "")} />
            <MetricPill label="GF" value={result.goalsFor} />
            <MetricPill label="GA" value={result.goalsAgainst} />
          </div>
          {leagueSummaryVisible && (
            <div className="mt-4 rounded-2xl border border-signal/30 bg-signal/10 p-4 text-sm font-bold leading-6 text-steel">
              League phase: #{result.leaguePosition}, {result.leaguePoints} points, {result.goalDifference >= 0 ? "+" : ""}
              {result.goalDifference} GD. Route: {result.route}.
            </div>
          )}
        </aside>

        <div className="game-panel p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-1">
            <div className="section-kicker">Match log</div>
            <h2 className="font-display text-2xl font-black text-frost sm:text-3xl">The road under floodlights</h2>
          </div>

          {!started && (
            <div className="rounded-2xl border border-frost/10 bg-night-950/45 p-5">
              <div className="section-kicker">Ready</div>
              <h3 className="mt-2 text-2xl font-black text-frost">Start the campaign reveal.</h3>
              <p className="mt-2 text-sm leading-6 text-steel/74">
                Matches reveal one at a time. Use Next Match for manual pacing or Auto Play for a broadcast-style run.
              </p>
            </div>
          )}

          {latestMatch && (
            <MatchCard match={latestMatch} index={visibleCount} featured />
          )}

          {aggregateSummaries.length > 0 && (
            <div className="mt-3 grid gap-2">
              {aggregateSummaries.map((summary) => (
                <div key={summary.stage} className="rounded-2xl border border-frost/10 bg-night-950/35 px-4 py-3 text-sm font-bold text-steel">
                  <span className="font-black text-frost">{summary.stage}</span> aggregate: {summary.forGoals}-{summary.againstGoals} vs{" "}
                  {summary.opponent}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 grid gap-2">
            {visibleMatches.slice(0, -1).map((match, index) => (
              <div
                key={`${match.stage}-${match.opponent}-${index}`}
                className="match-row grid gap-2 p-3 sm:grid-cols-[1.1fr_1fr_auto_auto] sm:items-center"
                style={{ animation: `modalIn 240ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 28}ms both` }}
              >
                <div className="text-sm font-black text-frost">{match.stage}</div>
                <div className="text-sm text-steel">Road XI vs {match.opponent}</div>
                <div className="text-sm text-steel">STR {match.opponentStrength}</div>
                <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
                  <span className={`rounded-xl px-2 py-1 text-[0.64rem] font-black uppercase tracking-[0.1em] ${
                    match.won ? "bg-signal/16 text-signal" : match.draw ? "bg-frost/10 text-frost" : "bg-red-500/10 text-red-100"
                  }`}>
                    {match.won ? "W" : match.draw ? "D" : "L"}
                  </span>
                  <span className="text-sm font-black text-frost">{match.homeGoals}-{match.awayGoals}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <BottomActionBar note={started ? `${visibleCount} of ${result.matches.length} matches revealed.` : "Simulation is ready."}>
        {!started ? (
          <ActionButton className="w-full sm:w-auto" onClick={revealNext}>
            Start Simulation
          </ActionButton>
        ) : (
          <>
            <ActionButton className="w-full sm:w-auto" onClick={revealNext} disabled={complete}>
              Next Match
            </ActionButton>
            <ActionButton className="w-full sm:w-auto" tone="secondary" onClick={() => setAutoPlay((value) => !value)} disabled={complete}>
              {autoPlay ? "Pause Auto" : "Auto Play"}
            </ActionButton>
            <ActionButton className="w-full sm:w-auto" tone={complete ? "primary" : "ghost"} onClick={onContinue}>
              {complete ? "Final result" : "Skip to Final Result"}
              <ArrowRight size={18} />
            </ActionButton>
          </>
        )}
      </BottomActionBar>
    </main>
  );
}

function MatchCard({ match, index, featured = false }: { match: MatchResult; index: number; featured?: boolean }) {
  return (
    <div
      className={`match-row grid gap-2 p-4 sm:grid-cols-[1.1fr_1fr_auto_auto] sm:items-center ${featured ? "border-signal/40 bg-signal/10" : ""}`}
      style={{ animation: `modalIn 240ms cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(index, 10) * 28}ms both` }}
    >
      <div>
        <div className="text-xs font-black uppercase tracking-[0.12em] text-signal">Match {index}</div>
        <div className="mt-1 text-base font-black text-frost">{match.stage}</div>
      </div>
      <div className="text-sm text-steel">Road XI vs {match.opponent}</div>
      <div className="text-sm text-steel">STR {match.opponentStrength}</div>
      <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
        <span className={`rounded-xl px-2 py-1 text-[0.64rem] font-black uppercase tracking-[0.1em] ${
          match.won ? "bg-signal/16 text-signal" : match.draw ? "bg-frost/10 text-frost" : "bg-red-500/10 text-red-100"
        }`}>
          {match.won ? "W" : match.draw ? "D" : "L"}
        </span>
        <span className="text-lg font-black text-frost">{match.homeGoals}-{match.awayGoals}</span>
      </div>
    </div>
  );
}

function getAggregateSummaries(matches: MatchResult[]) {
  const groups = new Map<string, MatchResult[]>();
  for (const match of matches) {
    const stage = match.stage.replace(" first leg", "").replace(" second leg", "");
    if (stage === match.stage || stage === "Final" || stage === "League phase") continue;
    groups.set(stage, [...(groups.get(stage) ?? []), match]);
  }

  return [...groups.entries()]
    .filter(([, legs]) => legs.length >= 2)
    .map(([stage, legs]) => ({
      stage,
      opponent: legs[0].opponent,
      forGoals: legs.reduce((sum, match) => sum + match.homeGoals, 0),
      againstGoals: legs.reduce((sum, match) => sum + match.awayGoals, 0),
    }));
}
