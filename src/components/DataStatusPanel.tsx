import { Database, Shuffle } from "lucide-react";
import { useState } from "react";
import { getDataStatus, getDraftEligibleTeamSeasonsForSeason, seasons } from "../data/gameData";
import { randomItem } from "../utils/random";
import ActionButton from "./ActionButton";
import MetricPill from "./MetricPill";

type DrawSummary = {
  uniqueClubs: number;
  uniqueTeamSeasons: number;
  clubs: Array<[string, number]>;
};

export default function DataStatusPanel() {
  const status = getDataStatus();
  const [drawSummary, setDrawSummary] = useState<DrawSummary | null>(null);

  function runTestDraws() {
    const eligibleSeasons = seasons.filter((season) => getDraftEligibleTeamSeasonsForSeason(season.id).length > 0);
    const byClub = new Map<string, number>();
    const byTeamSeason = new Map<string, number>();

    for (let index = 0; index < 100; index += 1) {
      const season = randomItem(eligibleSeasons);
      const team = randomItem(getDraftEligibleTeamSeasonsForSeason(season.id));
      byClub.set(team.clubName, (byClub.get(team.clubName) ?? 0) + 1);
      byTeamSeason.set(team.id, (byTeamSeason.get(team.id) ?? 0) + 1);
    }

    setDrawSummary({
      uniqueClubs: byClub.size,
      uniqueTeamSeasons: byTeamSeason.size,
      clubs: [...byClub.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
    });
  }

  return (
    <details className="mt-6 rounded-2xl border border-frost/10 bg-frost/[0.045] p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-signal">
          <Database size={16} />
          Data: {status.datasetMode === "uploaded" ? "uploaded Champions League set" : status.datasetName}
        </span>
        <span className="text-xs font-bold text-steel/58">{status.totalPlayers.toLocaleString()} players</span>
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetricPill label="Dataset" value={status.datasetName} />
        <MetricPill label="Coverage" value={status.coverageStatus === "full" ? "Full" : "Partial"} />
        <MetricPill label="Seasons" value={status.totalSeasons} />
        <MetricPill label="Team-seasons" value={status.totalTeamSeasons} />
        <MetricPill label="Players" value={status.totalPlayers} />
        <MetricPill label="Playable" value={status.playableTeamSeasons} />
        <MetricPill label="Complete" value={status.completeTeamSeasons} />
        <MetricPill label="Incomplete" value={status.incompleteTeamSeasons} />
        <MetricPill label="Estimated" value={status.estimatedRatings} />
      </div>

      {status.datasetMode === "uploaded" ? (
        <p className="mt-3 text-xs leading-5 text-steel/65">Uploaded Champions League data loaded for draft draws.</p>
      ) : status.coverageStatus === "partial" ? (
        <p className="mt-3 text-xs leading-5 text-steel/65">
          Dataset is partial. Random draws only use the teams currently loaded.
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-steel/65">Full Champions League generated dataset loaded.</p>
      )}

      <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-steel/45">
        Generated {new Date(status.generatedAt).toLocaleString()}
      </p>
      <p className="mt-3 text-xs leading-5 text-steel/55">
        This is an unofficial fan-made football draft game. It is not affiliated with, endorsed by, or sponsored by
        UEFA, any club, competition, player, publisher, or governing body. Club names, player names, and historical
        seasons are used descriptively.
      </p>

      {status.warnings.length > 0 && (
        <div className="mt-3 grid gap-1 text-xs font-semibold leading-5 text-steel/65">
          {status.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      )}

      <ActionButton tone="secondary" className="mt-4 w-full" onClick={runTestDraws}>
        <Shuffle size={17} />
        Run 100 test draws
      </ActionButton>

      {drawSummary && (
        <div className="mt-4 rounded-2xl border border-frost/10 bg-night-950/35 p-3">
          <div className="grid grid-cols-2 gap-2">
            <MetricPill label="Unique clubs" value={drawSummary.uniqueClubs} muted />
            <MetricPill label="Unique team-seasons" value={drawSummary.uniqueTeamSeasons} muted />
          </div>
          <div className="mt-3 grid gap-1 text-xs text-steel/75">
            {drawSummary.clubs.map(([club, count]) => (
              <div key={club} className="flex justify-between gap-3">
                <span>{club}</span>
                <span className="font-black text-frost">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}
