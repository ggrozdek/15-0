import { Dices, Trophy } from "lucide-react";
import ActionButton from "./ActionButton";
import BottomActionBar from "./BottomActionBar";
import GameHeader from "./GameHeader";
import MetricPill from "./MetricPill";
import Pitch from "./Pitch";
import PlayerSelectionModal from "./PlayerSelectionModal";
import SpinResultCards from "./SpinResultCards";
import type { DifficultyMode, DraftPick, FormationName, FormationSlot, Player, Season, SquadMetrics, TeamSeasonSquad } from "../types";

type SpinPhase = "idle" | "season" | "pause" | "club" | "complete";

type DraftScreenProps = {
  mode: DifficultyMode;
  formation: FormationName;
  slots: FormationSlot[];
  picks: DraftPick[];
  round: number;
  metrics: SquadMetrics;
  spinning: boolean;
  spinPhase: SpinPhase;
  selectedSeason: Season | null;
  seasonDisplay: string;
  clubDisplay: string;
  currentSquad: TeamSeasonSquad | null;
  offeredPlayers: Player[];
  squadRevealPending: boolean;
  selectedPlayer: Player | null;
  lockedSlot: FormationSlot | null;
  rerollsLeft: number;
  onSpin: () => void;
  onReroll: () => void;
  onLockSlot: (slot: FormationSlot) => void;
  onSelectPlayer: (player: Player | null) => void;
  onDraft: (player: Player, slot: FormationSlot) => void;
  onCloseModal: () => void;
  onReset: () => void;
};

export default function DraftScreen({
  mode,
  formation,
  slots,
  picks,
  round,
  metrics,
  spinning,
  spinPhase,
  selectedSeason,
  seasonDisplay,
  clubDisplay,
  currentSquad,
  offeredPlayers,
  squadRevealPending,
  selectedPlayer,
  lockedSlot,
  rerollsLeft,
  onSpin,
  onReroll,
  onLockSlot,
  onSelectPlayer,
  onDraft,
  onCloseModal,
  onReset,
}: DraftScreenProps) {
  const hardMode = mode === "hard";
  const actionDisabled = spinning || Boolean(currentSquad) || (hardMode && !lockedSlot);
  const actionLabel = spinning ? "Revealing..." : hardMode ? "Reveal Team" : "Spin";
  const canReroll = rerollsLeft > 0 && !spinning && Boolean(currentSquad || squadRevealPending);
  const stepLabel = currentSquad
    ? "Pick from the revealed squad"
    : squadRevealPending
      ? "Squad reveal incoming..."
    : hardMode && !lockedSlot
      ? "Tap an empty pitch slot to lock the position"
      : "Spin for a season and club";

  return (
    <main className="app-frame">
      <GameHeader round={round} picks={picks.length} mode={mode} formation={formation} rerollsLeft={rerollsLeft} onReset={onReset} />

      <section className="mx-auto grid w-full max-w-7xl gap-4 xl:grid-cols-[400px_1fr]">
        <aside className="game-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="section-kicker">Draft room</div>
              <h1 className="mt-1 font-display text-2xl font-black text-frost sm:text-3xl">{stepLabel}</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-steel/72">
                {hardMode
                  ? lockedSlot
                    ? `Locked position: ${lockedSlot.label}. Only eligible players can be selected.`
                    : "Hard Mode hides the squad until you commit to a position."
                  : "Classic Mode shows ratings during the draft."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MetricPill label="Round" value={`${round} / 11`} />
            <MetricPill label="Mode" value={mode === "classic" ? "Classic" : "Hard"} />
            <MetricPill label="Rerolls" value={rerollsLeft} />
            <MetricPill label="Picked" value={picks.length} muted />
            <MetricPill label="Open slots" value={11 - picks.length} muted />
          </div>

          {!hardMode && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MetricPill label="Squad" value={picks.length ? metrics.squadRating : "0.0"} />
              <MetricPill label="Chemistry" value={picks.length ? metrics.chemistry : "0.0"} />
            </div>
          )}

          {hardMode && !lockedSlot && (
            <div className="mt-4 rounded-2xl border border-signal/30 bg-signal/10 p-4 text-sm font-bold leading-6 text-steel">
              Choose an empty position on the pitch first. The selected slot will glow before the reveal.
            </div>
          )}

          {hardMode && lockedSlot && !currentSquad && (
            <div className="mt-4 rounded-2xl border border-frost/10 bg-night-950/35 p-4">
              <div className="section-kicker">Locked position</div>
              <div className="mt-1 text-xl font-black text-frost">{lockedSlot.label}</div>
            </div>
          )}

          <SpinResultCards
            isSpinning={spinning}
            spinPhase={spinPhase}
            selectedSeason={selectedSeason}
            selectedTeam={currentSquad}
            seasonDisplay={seasonDisplay}
            clubDisplay={clubDisplay}
            playersAvailable={offeredPlayers.length}
            squadRevealPending={squadRevealPending}
          />
        </aside>

        <section className="game-panel p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-kicker">Squad view</div>
              <h2 className="mt-1 font-display text-2xl font-black text-frost sm:text-3xl">All-time XI board</h2>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-frost/10 bg-frost/[0.04] px-3 py-2 text-sm text-steel">
              <Trophy size={16} className="text-signal" />
              Perfect run target: direct route 15-0
            </div>
          </div>
          <Pitch
            slots={slots}
            picks={picks}
            selectedPlayer={selectedPlayer}
            hideRatings={hardMode}
            lockedSlotId={lockedSlot?.id}
            allowEmptySlotClick={hardMode && !lockedSlot}
            onSlotClick={(slot) => {
              if (hardMode && !lockedSlot) onLockSlot(slot);
              else if (selectedPlayer) onDraft(selectedPlayer, slot);
            }}
          />
        </section>
      </section>

      <BottomActionBar note={stepLabel}>
        <ActionButton className="w-full sm:w-auto" onClick={() => onSpin()} disabled={actionDisabled}>
          <Dices size={18} />
          {actionLabel}
        </ActionButton>
        {(currentSquad || squadRevealPending) && (
          <ActionButton className="w-full sm:w-auto" tone="secondary" onClick={onReroll} disabled={!canReroll}>
            Reroll {rerollsLeft} left
          </ActionButton>
        )}
      </BottomActionBar>

      {currentSquad && offeredPlayers.length > 0 && !spinning && !squadRevealPending && (
        <PlayerSelectionModal
          squad={currentSquad}
          players={offeredPlayers}
          slots={slots}
          picks={picks}
          hardMode={hardMode}
          lockedSlot={lockedSlot}
          selectedPlayer={selectedPlayer}
          rerollsLeft={rerollsLeft}
          onSelectPlayer={onSelectPlayer}
          onDraft={onDraft}
          onReroll={onReroll}
          onClose={onCloseModal}
        />
      )}
    </main>
  );
}
