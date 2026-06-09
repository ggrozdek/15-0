import { getDraftEligibleTeamSeasonsForSeason, getSquad, seasons } from "../data/gameData";
import type { DraftPick, FormationSlot, Player, TeamSeasonSquad } from "../types";
import { getPositionCompatibility, getPositionFitScore } from "./positionCompatibility";
import { randomItem, shuffle } from "./random";

export function getValidSlots(player: Player, slots: FormationSlot[], picks: DraftPick[], lockedSlot?: FormationSlot | null) {
  const filled = new Set(picks.map((pick) => pick.slotId));
  const candidateSlots = lockedSlot ? [lockedSlot] : slots;
  return candidateSlots.filter((slot) => {
    return !filled.has(slot.id) && getPositionCompatibility(player, slot).allowed;
  });
}

export function isSlotFilled(slotId: string, picks: DraftPick[]) {
  return picks.some((pick) => pick.slotId === slotId);
}

export function selectRandomSquadSeasonFirst(
  slots: FormationSlot[],
  picks: DraftPick[],
  lockedSlot?: FormationSlot | null,
): TeamSeasonSquad {
  const validSeasonIds = shuffle(seasons.map((season) => season.id));

  for (const seasonId of validSeasonIds) {
    const candidates = shuffle(getDraftEligibleTeamSeasonsForSeason(seasonId));
    for (const teamSeason of candidates) {
      const squad = getSquad(teamSeason);
      const hasValidPlayer = squad.players.some((player) => getValidSlots(player, slots, picks, lockedSlot).length > 0);
      if (hasValidPlayer) return squad;
    }
  }

  throw new Error("No valid season-first team-season draw is available for the current draft state.");
}

export function buildOffer(squad: TeamSeasonSquad, slots: FormationSlot[], picks: DraftPick[], lockedSlot?: FormationSlot | null) {
  const draftedIds = new Set(picks.map((pick) => pick.player.id));
  void slots;
  void lockedSlot;
  return squad.players.filter((player) => !draftedIds.has(player.id));
}

export function createDraftPick(player: Player, slot: FormationSlot): DraftPick | null {
  const compatibility = getPositionCompatibility(player, slot);
  if (!compatibility.allowed) return null;
  return {
    player,
    slotId: slot.id,
    fit: getPositionFitScore(player, slot),
    penalty: compatibility.penalty,
  };
}
