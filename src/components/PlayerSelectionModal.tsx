import { Lock, MousePointer2 } from "lucide-react";
import { useMemo, useState } from "react";
import ActionButton from "./ActionButton";
import type { DraftPick, FormationSlot, Player, Position, TeamSeasonSquad } from "../types";
import { getValidSlots } from "../utils/draft";
import { getDisplayClubName } from "../utils/clubNames";

type PlayerSelectionModalProps = {
  squad: TeamSeasonSquad;
  players: Player[];
  slots: FormationSlot[];
  picks: DraftPick[];
  hardMode: boolean;
  lockedSlot: FormationSlot | null;
  selectedPlayer: Player | null;
  rerollsLeft: number;
  onSelectPlayer: (player: Player) => void;
  onDraft: (player: Player, slot: FormationSlot) => void;
  onReroll: () => void;
  onClose?: () => void;
};

type PositionFilter = "ALL" | "GK" | "DEF" | "MID" | "ATT";

const filters: Array<{ id: PositionFilter; label: string; positions: Position[] }> = [
  { id: "ALL", label: "All", positions: [] },
  { id: "GK", label: "GK", positions: ["GK"] },
  { id: "DEF", label: "DEF", positions: ["CB", "LB", "RB", "LWB", "RWB"] },
  { id: "MID", label: "MID", positions: ["CDM", "CM", "CAM", "LM", "RM"] },
  { id: "ATT", label: "ATT", positions: ["LW", "RW", "CF", "ST"] },
];

export default function PlayerSelectionModal({
  squad,
  players,
  slots,
  picks,
  hardMode,
  lockedSlot,
  selectedPlayer,
  rerollsLeft,
  onSelectPlayer,
  onDraft,
  onReroll,
}: PlayerSelectionModalProps) {
  const [activeFilter, setActiveFilter] = useState<PositionFilter>("ALL");
  const [query, setQuery] = useState("");
  const filteredPlayers = useMemo(() => {
    const selectedFilter = filters.find((filter) => filter.id === activeFilter);
    const normalizedQuery = query.trim().toLowerCase();

    return players
      .filter((player) => {
        const matchesPosition =
          activeFilter === "ALL" || player.positions.some((position) => selectedFilter?.positions.includes(position));
        const matchesSearch = !normalizedQuery || player.name.toLowerCase().includes(normalizedQuery);
        return matchesPosition && matchesSearch;
      })
      .sort((a, b) => (b.overallRating ?? -1) - (a.overallRating ?? -1));
  }, [activeFilter, players, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/82 px-2 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-5">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-auto rounded-3xl border border-frost/12 bg-night-900 shadow-flood animate-modalIn">
        <div className="sticky top-0 z-20 border-b border-frost/10 bg-night-900/95 px-4 py-4 backdrop-blur sm:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="section-kicker">Draft board revealed</div>
              <h2 className="mt-1 font-display text-xl font-black text-frost sm:text-2xl">
                {squad.season.seasonLabel} - {getDisplayClubName(squad.clubName)}
              </h2>
              {lockedSlot && (
                <p className="mt-1 text-sm font-bold text-steel/72">Locked slot: {lockedSlot.label}. Invalid players are disabled.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton tone="secondary" onClick={onReroll} disabled={rerollsLeft <= 0}>
                Reroll {rerollsLeft} left
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="sticky top-[86px] z-10 mb-4 grid gap-3 rounded-2xl border border-frost/10 bg-night-900/95 p-2 backdrop-blur md:grid-cols-[auto_1fr] md:items-center">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${
                      activeFilter === filter.id
                        ? "border-signal bg-signal/15 text-frost"
                        : "border-frost/10 bg-night-950/35 text-steel hover:border-frost/25 hover:text-frost"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search player name"
                className="min-h-11 rounded-xl border border-frost/10 bg-night-950/45 px-3 text-sm font-semibold text-frost outline-none transition placeholder:text-steel/45 focus:border-signal/70"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {filteredPlayers.map((player) => {
                const validSlots = getValidSlots(player, slots, picks, lockedSlot);
                const isSelected = selectedPlayer?.id === player.id;
                const invalid = validSlots.length === 0;

                return (
                  <article
                    key={player.id}
                    className={`draft-card p-4 transition ${isSelected ? "selected" : ""} ${invalid ? "invalid" : ""}`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-2xl font-black leading-tight text-frost">{player.name}</h3>
                          <p className="mt-1 text-xs font-semibold leading-5 text-steel/74">
                            {getDisplayClubName(player.clubName)} - {player.seasonLabel}
                          </p>
                        </div>
                        <div className="grid min-w-20 place-items-center rounded-2xl border border-signal/35 bg-signal/12 px-3 py-2 text-center">
                          <div className="text-[0.55rem] font-black uppercase tracking-[0.1em] text-steel/60">
                            OVR
                          </div>
                          <div className="font-display text-3xl font-black text-frost">
                            {hardMode ? "???" : player.overallRating ?? "--"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="rounded-xl border border-signal/30 bg-signal/14 px-3 py-2 text-sm font-black text-frost">
                          {player.primaryPosition}
                        </div>
                        {player.secondaryPositions.length ? (
                          player.secondaryPositions.map((position) => (
                            <div key={position} className="rounded-xl border border-frost/10 bg-night-950/35 px-3 py-2 text-xs font-black text-steel">
                              {position}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-frost/10 bg-night-950/35 px-3 py-2 text-xs font-bold text-steel/65">
                            No secondary positions
                          </div>
                        )}
                      </div>

                      {hardMode ? (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-frost/10 bg-night-950/35 px-3 py-3 text-sm text-steel">
                          <Lock size={16} />
                          Ratings reveal after the XI is complete.
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-frost/10 bg-night-950/35 px-3 py-3 text-xs font-bold text-steel/65">
                          Rating source: {player.sourceName}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {validSlots.length ? (
                          validSlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => onDraft(player, slot)}
                              onMouseEnter={() => onSelectPlayer(player)}
                              className="rounded-xl border border-flood/40 bg-flood/12 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-frost hover:bg-flood/22"
                            >
                              Draft at {slot.label}
                            </button>
                          ))
                        ) : (
                          <span className="rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-100">
                            No valid open slot
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredPlayers.length === 0 && (
              <div className="rounded-2xl border border-frost/10 bg-frost/[0.045] p-6 text-sm font-semibold text-steel/70">
                No players match the current filters.
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-frost/10 bg-night-950/40 p-4">
            <MousePointer2 className="text-signal" size={22} />
            <h3 className="mt-3 text-lg font-black text-frost">Draft board</h3>
            <p className="mt-2 text-sm leading-6 text-steel/78">
              {lockedSlot
                ? `Hard Mode lock: pick one player who can play ${lockedSlot.label}.`
                : "Pick a player, then choose one of his valid open slots."}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
