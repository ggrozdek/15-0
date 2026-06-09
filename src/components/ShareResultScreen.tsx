import { Clipboard, Download, RotateCcw, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import ActionButton from "./ActionButton";
import type { DifficultyMode, DraftPick, FormationName, SimulationResult, SquadMetrics } from "../types";
import { getDisplayClubName } from "../utils/clubNames";

type ShareResultScreenProps = {
  mode: DifficultyMode;
  formation: FormationName;
  picks: DraftPick[];
  metrics: SquadMetrics;
  result: SimulationResult | null;
  onBack: () => void;
  onRestart: () => void;
};

export default function ShareResultScreen({
  mode,
  formation,
  picks,
  metrics,
  result,
  onBack,
  onRestart,
}: ShareResultScreenProps) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => {
    const headline = result
      ? `Road to 15-0: ${result.tier} (${result.finalRecord})`
      : "Road to 15-0 squad locked";
    const squad = picks
      .map((pick) => `${pick.player.name} at ${pick.slotId.toUpperCase()} (${getDisplayClubName(pick.player.clubName)} ${pick.player.seasonLabel})`)
      .join(", ");
    return `${headline}
Formation: ${formation}
Mode: ${mode === "classic" ? "Classic" : "Hard"}
Squad rating: ${metrics.squadRating}
${result ? `League rank: #${result.leaguePosition}, ${result.leaguePoints} points\nRoute: ${result.route}` : ""}
XI: ${squad}`;
  }, [formation, metrics.squadRating, mode, picks, result]);

  async function copy() {
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function share() {
    if (!navigator.share) return;
    await navigator.share({
      title: result ? `Road to 15-0: ${result.tier}` : "Road to 15-0 squad",
      text,
    });
  }

  function downloadImage() {
    const svg = buildShareSvg({
      title: result ? result.tier : "Squad ready",
      record: result?.finalRecord ?? "Pending",
      leagueRank: result ? `#${result.leaguePosition}` : "Pending",
      squadRating: String(metrics.squadRating),
      bestPlayer: result?.bestRatedPlayer.name ?? picks[0]?.player.name ?? "Pending",
      topScorer: result?.topScorer.name ?? "Pending",
      formation,
      mode: mode === "classic" ? "Classic" : "Hard",
      xi: picks.map((pick) => pick.player.name).slice(0, 11),
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "road-to-15-0-result.svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-frame">
      <section className="mx-auto grid w-full max-w-6xl gap-5 py-4 md:grid-cols-[minmax(0,420px)_1fr] md:py-8">
        <div className="result-poster aspect-[9/16] p-5">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="section-kicker">Road to 15-0</div>
              <h1 className="mt-4 font-display text-4xl font-black leading-tight text-frost">
                {result ? result.tier : "Squad ready"}
              </h1>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Metric label="Formation" value={formation} />
                <Metric label="Mode" value={mode === "classic" ? "Classic" : "Hard"} />
                <Metric label="Squad" value={metrics.squadRating} />
                <Metric label="Record" value={result?.finalRecord ?? "Pending"} />
              </div>
            </div>
            <div className="grid gap-2">
              {picks.slice(0, 11).map((pick) => (
                <div key={pick.slotId} className="rounded-xl border border-frost/10 bg-night-950/36 px-3 py-2 text-xs font-bold text-steel">
                  <span className="text-frost">{pick.slotId.toUpperCase()}</span> {pick.player.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="game-panel p-5">
          <div className="section-kicker">Share text</div>
          <h1 className="mt-3 font-display text-4xl font-black text-frost">
            {result ? result.tier : "Squad ready"}
          </h1>
          <pre className="mt-5 max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-frost/10 bg-night-950/65 p-4 text-sm leading-7 text-steel">
            {text}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton onClick={copy}>
              <Clipboard size={18} />
              {copied ? "Copied" : "Copy result"}
            </ActionButton>
            {"share" in navigator && (
              <ActionButton tone="secondary" onClick={share}>
                <Share2 size={18} />
                Share result
              </ActionButton>
            )}
            <ActionButton tone="secondary" onClick={downloadImage}>
              <Download size={18} />
              Download Result Image
            </ActionButton>
            <ActionButton tone="secondary" onClick={onBack}>
              Back
            </ActionButton>
            <ActionButton tone="ghost" onClick={onRestart}>
              <RotateCcw size={18} />
              New run
            </ActionButton>
          </div>
        </div>
      </section>
    </main>
  );
}

function escapeSvg(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildShareSvg({
  title,
  record,
  leagueRank,
  squadRating,
  bestPlayer,
  topScorer,
  formation,
  mode,
  xi,
}: {
  title: string;
  record: string;
  leagueRank: string;
  squadRating: string;
  bestPlayer: string;
  topScorer: string;
  formation: string;
  mode: string;
  xi: string[];
}) {
  const xiRows = xi
    .map((name, index) => `<text x="72" y="${700 + index * 36}" font-size="24" fill="#d8e7f5">${index + 1}. ${escapeSvg(name)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="#07111f"/>
  <circle cx="840" cy="210" r="280" fill="#5bc0ff" opacity=".13"/>
  <path d="M0 1500c190-120 430-160 720-116 160 24 260-12 360-72v608H0Z" fill="#0d223b"/>
  <text x="72" y="150" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#5bc0ff">Road to 15-0</text>
  <text x="72" y="250" font-family="Arial, sans-serif" font-size="78" font-weight="900" fill="#f4f8ff">${escapeSvg(title)}</text>
  <text x="72" y="338" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#b8c7d8">Record ${escapeSvg(record)} • League ${escapeSvg(leagueRank)} • Squad ${escapeSvg(squadRating)}</text>
  <text x="72" y="445" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#f4f8ff">Best player</text>
  <text x="72" y="492" font-family="Arial, sans-serif" font-size="34" fill="#d8e7f5">${escapeSvg(bestPlayer)}</text>
  <text x="72" y="565" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#f4f8ff">Top scorer</text>
  <text x="72" y="612" font-family="Arial, sans-serif" font-size="34" fill="#d8e7f5">${escapeSvg(topScorer)}</text>
  ${xiRows}
  <text x="72" y="1770" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#f4f8ff">${escapeSvg(formation)} • ${escapeSvg(mode)} Mode</text>
</svg>`;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-frost/10 bg-frost/[0.055] px-3 py-3">
      <div className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-steel/62">{label}</div>
      <div className="mt-1 text-lg font-black text-frost">{value}</div>
    </div>
  );
}
