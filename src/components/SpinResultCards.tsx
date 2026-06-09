import type { Season, TeamSeasonSquad } from "../types";
import { getDisplayClubName } from "../utils/clubNames";

type SpinPhase = "idle" | "season" | "pause" | "club" | "complete";

type SpinResultCardsProps = {
  isSpinning: boolean;
  spinPhase: SpinPhase;
  selectedSeason: Season | null;
  selectedTeam: TeamSeasonSquad | null;
  seasonDisplay: string;
  clubDisplay: string;
  playersAvailable: number;
  squadRevealPending: boolean;
};

export default function SpinResultCards({
  isSpinning,
  spinPhase,
  selectedSeason,
  selectedTeam,
  seasonDisplay,
  clubDisplay,
  playersAvailable,
  squadRevealPending,
}: SpinResultCardsProps) {
  const seasonActive = spinPhase === "season";
  const clubActive = spinPhase === "club";

  return (
    <div className="mt-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`spin-card ${seasonActive ? "spin-card-active" : ""}`}>
          <div className="spin-card-label">Season</div>
          <div className="spin-card-main">{seasonDisplay || "Ready"}</div>
          <div className="spin-card-foot">{seasonActive ? "Spinning" : selectedSeason ? "Locked" : "Waiting"}</div>
        </div>
        <div className={`spin-card ${clubActive ? "spin-card-active" : ""}`}>
          <div className="spin-card-label">Club</div>
          <div className="spin-card-main">{clubDisplay || "Ready"}</div>
          <div className="spin-card-foot">{clubActive ? "Spinning" : selectedTeam ? "Locked" : "Waiting"}</div>
        </div>
      </div>

      {selectedSeason && selectedTeam && !isSpinning && (
        <div className="reveal-panel mt-4 p-4">
          <div className="section-kicker">Reveal complete</div>
          <div className="mt-2 grid gap-3 text-sm text-steel sm:grid-cols-3">
            <div className="rounded-2xl bg-night-950/35 px-3 py-3">
              <span className="block text-[0.6rem] font-black uppercase tracking-[0.12em] text-steel/60">Season</span>
              <span className="mt-1 block font-black text-frost">{selectedSeason.seasonLabel}</span>
            </div>
            <div className="rounded-2xl bg-night-950/35 px-3 py-3">
              <span className="block text-[0.6rem] font-black uppercase tracking-[0.12em] text-steel/60">Club</span>
              <span className="mt-1 block font-black text-frost">{getDisplayClubName(selectedTeam.clubName)}</span>
            </div>
            <div className="rounded-2xl bg-night-950/35 px-3 py-3">
              <span className="block text-[0.6rem] font-black uppercase tracking-[0.12em] text-steel/60">Board</span>
              <span className="mt-1 block font-black text-frost">
                {squadRevealPending ? "Loading squad..." : `${playersAvailable} players`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
