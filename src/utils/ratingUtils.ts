import type { Player } from "../types";

export function ratingValue(value: number | null, fallback = 70) {
  return typeof value === "number" ? value : fallback;
}

export function getOverall(player: Player) {
  return ratingValue(player.overallRating);
}

export function getAdjustedOverall(player: Player, penalty: number) {
  return Math.max(1, getOverall(player) + penalty);
}

export function getRatingLabel(player: Player) {
  if (player.ratingType === "online") return "Online";
  if (player.ratingType === "estimated") return "Estimated";
  return "Missing";
}
