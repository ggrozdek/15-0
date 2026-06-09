import { Shield } from "lucide-react";
import type { DraftPick, FormationSlot, Player } from "../types";
import { getPositionFit } from "../utils/draft";
import { getAdjustedOverall } from "../utils/ratingUtils";

type PitchProps = {
  slots: FormationSlot[];
  picks: DraftPick[];
  selectedPlayer?: Player | null;
  hideRatings: boolean;
  lockedSlotId?: string | null;
  allowEmptySlotClick?: boolean;
  onSlotClick?: (slot: FormationSlot) => void;
};

export default function Pitch({
  slots,
  picks,
  selectedPlayer,
  hideRatings,
  lockedSlotId,
  allowEmptySlotClick = false,
  onSlotClick,
}: PitchProps) {
  return (
    <div className="pitch-shell">
      <div className="pitch-lines" />
      {slots.map((slot) => {
        const pick = picks.find((item) => item.slotId === slot.id);
        const fit = selectedPlayer ? getPositionFit(selectedPlayer, slot) : 0;
        const clickable = Boolean(onSlotClick && !pick && ((selectedPlayer && fit > 0) || allowEmptySlotClick));
        const locked = lockedSlotId === slot.id;

        return (
          <button
            key={slot.id}
            type="button"
            disabled={!clickable}
            onClick={() => onSlotClick?.(slot)}
            className={`pitch-card ${pick ? "filled" : "empty"} ${clickable ? "slot-ready" : ""} ${
              locked ? "slot-locked" : ""
            }`}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            aria-label={pick ? `${pick.player.name} at ${slot.label}` : `Empty ${slot.label} slot`}
          >
            <span className="slot-label">{slot.label}</span>
            {pick ? (
              <>
                <span className="player-name">{pick.player.name}</span>
                <span className="player-meta">
                  {hideRatings
                    ? "??? OVR"
                    : pick.player.overallRating === null
                      ? "Missing OVR"
                      : `${getAdjustedOverall(pick.player, pick.penalty)} OVR`}{" "}
                  - {pick.penalty} pen
                </span>
              </>
            ) : (
              <span className="empty-mark">
                <Shield size={15} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
