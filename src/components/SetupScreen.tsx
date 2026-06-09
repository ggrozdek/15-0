import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import ActionButton from "./ActionButton";
import BottomActionBar from "./BottomActionBar";
import DataStatusPanel from "./DataStatusPanel";
import { formations as formationSlots } from "../data/formations";
import type { DifficultyMode, FormationName } from "../types";

type SetupScreenProps = {
  mode: DifficultyMode;
  formation: FormationName;
  onModeChange: (mode: DifficultyMode) => void;
  onFormationChange: (formation: FormationName) => void;
  onStart: () => void;
};

const formations = Object.keys(formationSlots) as FormationName[];

export default function SetupScreen({ mode, formation, onModeChange, onFormationChange, onStart }: SetupScreenProps) {
  return (
    <main className="app-frame">
      <section className="mx-auto grid w-full max-w-6xl gap-5 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-10">
        <div>
          <div className="section-kicker">Run setup</div>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight text-frost sm:text-5xl">Choose your pressure.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-steel/78">
            Classic gives you all scouting information. Hard mode turns the draft into memory, instinct, and a
            little bit of nerve under the lights.
          </p>
          <DataStatusPanel />
        </div>

        <div className="game-panel p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onModeChange("classic")}
              className={`setup-tile ${mode === "classic" ? "active" : ""}`}
            >
              <Eye />
              <span>Classic Mode</span>
              <small>Ratings visible</small>
            </button>
            <button
              type="button"
              onClick={() => onModeChange("hard")}
              className={`setup-tile ${mode === "hard" ? "active" : ""}`}
            >
              <EyeOff />
              <span>Hard Mode</span>
              <small>Ratings hidden</small>
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-frost/10 bg-night-950/35 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-steel">
              <LayoutGrid size={17} className="text-signal" />
              Formation
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {formations.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onFormationChange(item)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    formation === item
                      ? "border-signal bg-signal/16 text-frost"
                      : "border-frost/10 bg-frost/[0.04] text-steel hover:bg-frost/[0.08]"
                  }`}
                >
                  <span className="block text-lg font-black">{item}</span>
                  <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.1em] text-steel/60">
                    {formationSlots[item].filter((slot) => slot.line === "defense").length}D /{" "}
                    {formationSlots[item].filter((slot) => slot.line === "midfield").length}M /{" "}
                    {formationSlots[item].filter((slot) => slot.line === "attack").length}A
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <BottomActionBar note={`${mode === "classic" ? "Classic" : "Hard"} Mode selected with ${formation}.`}>
        <ActionButton className="w-full sm:w-auto" onClick={onStart}>
          Begin Draft
        </ActionButton>
      </BottomActionBar>
    </main>
  );
}
