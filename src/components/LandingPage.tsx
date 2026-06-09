import { Play, Sparkles } from "lucide-react";
import ActionButton from "./ActionButton";

type LandingPageProps = {
  dataLoading: boolean;
  dataWarning: string | null;
  hasSavedRun: boolean;
  onContinue: () => void;
  onStart: () => void;
};

export default function LandingPage({ dataLoading, dataWarning, hasSavedRun, onContinue, onStart }: LandingPageProps) {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden px-4 py-6 sm:px-5 sm:py-8">
      <div className="stadium-beams" />
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col justify-center">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-frost/12 bg-frost/6 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-steel">
            <Sparkles size={16} className="text-signal" />
            Original draft simulator
          </div>
          <h1 className="mt-7 font-display text-5xl font-black leading-[0.94] text-frost sm:text-7xl lg:text-8xl">
            Road to 15-0
          </h1>
          <p className="mt-5 max-w-2xl text-2xl font-semibold text-steel">
            Build the ultimate Champions League XI.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-steel/78 sm:text-lg">
            Spin the wheel, draft European legends, build your XI, and see if your squad can win every Champions
            League match.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {hasSavedRun && (
              <ActionButton onClick={onContinue} disabled={dataLoading}>
                <Play size={18} />
                Continue Run
              </ActionButton>
            )}
            <ActionButton onClick={onStart} tone={hasSavedRun ? "secondary" : "primary"} disabled={dataLoading}>
              <Play size={18} />
              {hasSavedRun ? "New Run" : "Start New Run"}
            </ActionButton>
            <div className="text-sm font-semibold text-steel/70">
              {dataLoading ? "Loading draft data..." : "11 picks. 15 possible wins. No official marks."}
            </div>
          </div>
          {dataWarning && (
            <div className="mt-4 max-w-2xl rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-100">
              {dataWarning}
            </div>
          )}
          <div className="mt-10 grid max-w-3xl grid-cols-3 gap-2">
            {["Spin", "Draft", "Simulate"].map((item) => (
              <div key={item} className="rounded-2xl border border-frost/10 bg-frost/[0.045] px-3 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-frost">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-5 text-steel/55">
            This is an unofficial fan-made football draft game. It is not affiliated with, endorsed by, or sponsored
            by UEFA, any club, competition, player, publisher, or governing body. Club names, player names, and
            historical seasons are used descriptively.
          </p>
        </div>
      </div>
    </section>
  );
}
