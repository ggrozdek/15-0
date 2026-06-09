import { RotateCcw, ShieldCheck } from "lucide-react";
import type { DifficultyMode, FormationName } from "../types";

type GameHeaderProps = {
  round?: number;
  picks?: number;
  mode: DifficultyMode;
  formation: FormationName;
  rerollsLeft?: number;
  label?: string;
  onReset?: () => void;
};

export default function GameHeader({ round, picks, mode, formation, rerollsLeft, label = "Road to 15-0", onReset }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-frost/15 bg-frost/8 text-signal shadow-[0_0_28px_rgba(91,192,255,0.18)]">
          <ShieldCheck size={20} />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-base font-black text-frost sm:text-lg">{label}</div>
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-[0.62rem] font-black uppercase text-steel/72">
            {round !== undefined && <span>Round {round} / 11</span>}
            {picks !== undefined && <span>{picks} picked</span>}
            {rerollsLeft !== undefined && <span>{rerollsLeft} rerolls</span>}
            <span>{mode === "classic" ? "Classic" : "Hard"}</span>
            <span>{formation}</span>
          </div>
        </div>
      </div>
      {onReset && (
        <button type="button" onClick={onReset} className="icon-button" aria-label="Reset run">
          <RotateCcw size={18} />
        </button>
      )}
    </header>
  );
}
