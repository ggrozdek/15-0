import { BarChart3, PlayCircle } from "lucide-react";
import ActionButton from "./ActionButton";
import BottomActionBar from "./BottomActionBar";
import GameHeader from "./GameHeader";
import MetricPill from "./MetricPill";
import Pitch from "./Pitch";
import type { DifficultyMode, DraftPick, FormationName, FormationSlot, SquadMetrics } from "../types";
import { getDisplayClubName } from "../utils/clubNames";
import { getAdjustedOverall } from "../utils/ratingUtils";

type SquadScreenProps = {
  mode: DifficultyMode;
  formation: FormationName;
  slots: FormationSlot[];
  picks: DraftPick[];
  metrics: SquadMetrics;
  onSimulate: () => void;
  onShare: () => void;
};

export default function SquadScreen({ mode, formation, slots, picks, metrics, onSimulate, onShare }: SquadScreenProps) {
  return (
    <main className="app-frame">
      <GameHeader mode={mode} formation={formation} picks={picks.length} label="XI locked" />
      <section className="mx-auto grid w-full max-w-7xl gap-4 xl:grid-cols-[1fr_360px]">
        <div className="game-panel p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-kicker">Squad locked</div>
              <h1 className="mt-1 font-display text-2xl font-black text-frost sm:text-3xl">{formation} XI</h1>
            </div>
            <ActionButton tone="secondary" onClick={onShare}>
              Share squad
            </ActionButton>
          </div>
          <Pitch slots={slots} picks={picks} hideRatings={false} />
        </div>

        <aside className="grid gap-4">
          <div className="game-panel p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-signal">
            <BarChart3 size={17} />
            Squad report
          </div>
          <h2 className="mt-3 font-display text-3xl font-black text-frost">
            {mode === "hard" ? "Ratings revealed." : "Ready for Europe."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-steel/78">
            Modern simulation uses league phase points, route, two-leg knockout ties, adjusted overall, position penalties,
            chemistry, club diversity, and season diversity.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <MetricPill label="Squad" value={metrics.squadRating} />
            <MetricPill label="Adjusted avg." value={metrics.teamOverall} />
            <MetricPill label="Fit" value={`${metrics.positionFit}%`} />
            <MetricPill label="Chemistry" value={metrics.chemistry} />
            <MetricPill label="Club div." value={metrics.clubDiversity} />
            <MetricPill label="Season div." value={metrics.seasonDiversity} />
          </div>

          </div>

          <div className="game-panel p-4">
            <div className="section-kicker">{mode === "hard" ? "Rating reveal" : "Drafted XI detail"}</div>
            <div className="mt-3 grid gap-2">
              {picks.map((pick, index) => {
                const slot = slots.find((item) => item.id === pick.slotId);
                const adjusted = pick.player.overallRating === null ? "Missing" : getAdjustedOverall(pick.player, pick.penalty);
                return (
                  <div
                    key={pick.slotId}
                    className="rounded-2xl border border-frost/10 bg-frost/[0.04] p-3"
                    style={{ animation: `modalIn 260ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 42}ms both` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-frost">{pick.player.name}</div>
                        <div className="mt-1 text-xs font-semibold text-steel/65">
                          {getDisplayClubName(pick.player.clubName)} - {pick.player.seasonLabel}
                        </div>
                      </div>
                      <div className="rounded-md border border-frost/10 px-2 py-1 text-xs font-black text-frost">
                        {slot?.label ?? "XI"}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-steel/60 sm:grid-cols-3">
                      <span>Natural {pick.player.primaryPosition}</span>
                      <span>OVR {pick.player.overallRating ?? "Missing"}</span>
                      <span>Adjusted {adjusted}</span>
                      <span>Penalty {pick.penalty}</span>
                      <span>Fit {Math.round(pick.fit * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>
      <BottomActionBar note="Your XI is complete. Ratings are revealed and the campaign can begin.">
        <ActionButton className="w-full sm:w-auto" onClick={onSimulate}>
          <PlayCircle size={18} />
          Simulate Champions League
        </ActionButton>
      </BottomActionBar>
    </main>
  );
}
