import type { FormationSlot, Player, Position, PositionCompatibility, PositionFit } from "../types";

const closeMap: Partial<Record<Position, Position[]>> = {
  LB: ["LWB"],
  LWB: ["LB"],
  RB: ["RWB"],
  RWB: ["RB"],
  CDM: ["CM"],
  CM: ["CDM", "CAM"],
  CAM: ["CM"],
  CF: ["ST", "CAM"],
  ST: ["CF"],
};

const awkwardMap: Partial<Record<Position, Position[]>> = {
  LM: ["LW", "LWB"],
  RM: ["RW", "RWB"],
  LW: ["LM", "ST"],
  RW: ["RM", "ST"],
};

function compatibilityForPosition(playerPosition: Position, slotPosition: Position): PositionCompatibility {
  if (playerPosition === slotPosition) {
    return { allowed: true, fit: "natural", penalty: 0 };
  }

  if (slotPosition === "GK" || playerPosition === "GK") {
    return { allowed: false, fit: "invalid", penalty: Number.NEGATIVE_INFINITY };
  }

  if (closeMap[playerPosition]?.includes(slotPosition)) {
    return { allowed: true, fit: "close", penalty: -2 };
  }

  if (awkwardMap[playerPosition]?.includes(slotPosition)) {
    return { allowed: true, fit: "awkward", penalty: -5 };
  }

  return { allowed: false, fit: "invalid", penalty: Number.NEGATIVE_INFINITY };
}

const fitRank: Record<PositionFit, number> = {
  natural: 3,
  close: 2,
  awkward: 1,
  invalid: 0,
};

export function getPositionCompatibility(player: Player, slot: FormationSlot): PositionCompatibility {
  return player.positions
    .map((position) => compatibilityForPosition(position, slot.label))
    .sort((a, b) => fitRank[b.fit] - fitRank[a.fit])[0] ?? {
    allowed: false,
    fit: "invalid",
    penalty: Number.NEGATIVE_INFINITY,
  };
}

export function getPositionFitScore(player: Player, slot: FormationSlot) {
  const compatibility = getPositionCompatibility(player, slot);
  if (!compatibility.allowed) return 0;
  return compatibility.penalty === 0 ? 1 : compatibility.penalty === -2 ? 0.96 : 0.9;
}
