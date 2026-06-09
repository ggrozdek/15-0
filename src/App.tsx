import { useEffect, useMemo, useRef, useState } from "react";
import DraftScreen from "./components/DraftScreen";
import FinalResultScreen from "./components/FinalResultScreen";
import LandingPage from "./components/LandingPage";
import SetupScreen from "./components/SetupScreen";
import ShareResultScreen from "./components/ShareResultScreen";
import SimulationScreen from "./components/SimulationScreen";
import SquadScreen from "./components/SquadScreen";
import { getDraftEligibleTeamSeasonsForSeason, getSquad, loadGameData, players, seasons } from "./data/gameData";
import { formations } from "./data/formations";
import type {
  DifficultyMode,
  DraftPick,
  FormationName,
  FormationSlot,
  Player,
  Season,
  SimulationResult,
  TeamSeasonSquad,
} from "./types";
import { buildOffer, createDraftPick, getValidSlots } from "./utils/draftRules";
import { getDisplayClubName } from "./utils/clubNames";
import { randomItem } from "./utils/random";
import { calculateSquadMetrics, simulateCampaign } from "./utils/simulation";

type Screen = "landing" | "setup" | "draft" | "squad" | "simulation" | "final" | "share";
type SpinPhase = "idle" | "season" | "pause" | "club" | "complete";

const emptyMetrics = calculateSquadMetrics([], formations["4-3-3"]);
const startingRerolls = 3;
const saveKey = "road-to-15-0-save-v1";

type SavedRun = {
  screen: Screen;
  mode: DifficultyMode;
  formation: FormationName;
  picks: Array<{ slotId: string; playerId: string }>;
  rerollsLeft: number;
  lockedSlotId: string | null;
  result: SimulationResult | null;
};

function readSavedRun(): SavedRun | null {
  try {
    const raw = window.localStorage.getItem(saveKey);
    return raw ? (JSON.parse(raw) as SavedRun) : null;
  } catch {
    return null;
  }
}

function writeSavedRun(run: SavedRun) {
  try {
    window.localStorage.setItem(saveKey, JSON.stringify(run));
  } catch {
    // Storage can fail in private browsing or locked-down webviews. The game keeps running without persistence.
  }
}

function clearSavedRun() {
  try {
    window.localStorage.removeItem(saveKey);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [previousScreen, setPreviousScreen] = useState<Screen>("landing");
  const [mode, setMode] = useState<DifficultyMode>("classic");
  const [formation, setFormation] = useState<FormationName>("4-3-3");
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [spinPhase, setSpinPhase] = useState<SpinPhase>("idle");
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [seasonDisplay, setSeasonDisplay] = useState("");
  const [clubDisplay, setClubDisplay] = useState("");
  const [currentSquad, setCurrentSquad] = useState<TeamSeasonSquad | null>(null);
  const [offeredPlayers, setOfferedPlayers] = useState<Player[]>([]);
  const [squadRevealPending, setSquadRevealPending] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [lockedSlot, setLockedSlot] = useState<FormationSlot | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [rerollsLeft, setRerollsLeft] = useState(startingRerolls);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [hasSavedRun, setHasSavedRun] = useState(false);
  const spinTokenRef = useRef(0);

  const slots = formations[formation];
  const metrics = useMemo(() => (picks.length ? calculateSquadMetrics(picks, slots) : emptyMetrics), [picks, slots]);
  const round = Math.min(11, picks.length + 1);

  useEffect(() => {
    let active = true;
    loadGameData()
      .then((result) => {
        if (!active) return;
        setDataWarning(result.warning ?? null);
        setHasSavedRun(Boolean(readSavedRun()));
      })
      .catch((error) => {
        if (!active) return;
        setDataWarning(error instanceof Error ? error.message : "Failed to load game data.");
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (dataLoading || screen === "landing" || screen === "setup") return;
    writeSavedRun({
      screen,
      mode,
      formation,
      picks: picks.map((pick) => ({ slotId: pick.slotId, playerId: pick.player.id })),
      rerollsLeft,
      lockedSlotId: lockedSlot?.id ?? null,
      result,
    });
    setHasSavedRun(true);
  }, [dataLoading, formation, lockedSlot?.id, mode, picks, rerollsLeft, result, screen]);

  function clearSpinState() {
    spinTokenRef.current += 1;
    setSpinning(false);
    setSpinPhase("idle");
    setSelectedSeason(null);
    setSeasonDisplay("");
    setClubDisplay("");
    setCurrentSquad(null);
    setOfferedPlayers([]);
    setSquadRevealPending(false);
    setSelectedPlayer(null);
  }

  function resetRun() {
    setScreen("setup");
    setPicks([]);
    clearSpinState();
    setLockedSlot(null);
    setResult(null);
    setRerollsLeft(startingRerolls);
    clearSavedRun();
    setHasSavedRun(false);
  }

  function startDraft() {
    setPicks([]);
    clearSpinState();
    setLockedSlot(null);
    setResult(null);
    setRerollsLeft(startingRerolls);
    clearSavedRun();
    setHasSavedRun(false);
    setScreen("draft");
  }

  function continueSavedRun() {
    const saved = readSavedRun();
    if (!saved) return;
    const restoredFormation = formations[saved.formation] ? saved.formation : "4-3-3";
    const restoredSlots = formations[restoredFormation];
    const restoredPicks = saved.picks
      .map((savedPick) => {
        const slot = restoredSlots.find((item) => item.id === savedPick.slotId);
        const player = players.find((item) => item.id === savedPick.playerId);
        return slot && player ? createDraftPick(player, slot) : null;
      })
      .filter((pick): pick is DraftPick => Boolean(pick));

    setMode(saved.mode);
    setFormation(restoredFormation);
    setPicks(restoredPicks);
    setRerollsLeft(Math.max(0, Math.min(startingRerolls, saved.rerollsLeft)));
    setLockedSlot(restoredSlots.find((slot) => slot.id === saved.lockedSlotId) ?? null);
    setResult(saved.result);
    clearSpinState();

    if (saved.screen === "simulation" && !saved.result) {
      setScreen("squad");
    } else if ((saved.screen === "final" || saved.screen === "simulation") && saved.result) {
      setScreen(saved.screen);
    } else if (restoredPicks.length >= 11) {
      setScreen("squad");
    } else {
      setScreen("draft");
    }
  }

  function eligibleTeamSeasonsForSeason(season: Season) {
    return getDraftEligibleTeamSeasonsForSeason(season.id).filter((teamSeason) => {
      const squad = getSquad(teamSeason);
      return squad.players.some((player) => getValidSlots(player, slots, picks, mode === "hard" ? lockedSlot : null).length > 0);
    });
  }

  function eligibleSeasons() {
    return seasons.filter((season) => eligibleTeamSeasonsForSeason(season).length > 0);
  }

  function spinWheel(isReroll = false) {
    if (
      spinning ||
      picks.length >= 11 ||
      (mode === "hard" && !lockedSlot) ||
      (!isReroll && (currentSquad || squadRevealPending)) ||
      (isReroll && rerollsLeft <= 0) ||
      (isReroll && !currentSquad && !squadRevealPending)
    ) {
      return;
    }

    const seasonPool = eligibleSeasons();
    if (!seasonPool.length) return;

    const spinToken = spinTokenRef.current + 1;
    spinTokenRef.current = spinToken;
    if (isReroll) {
      setRerollsLeft((value) => Math.max(0, value - 1));
    }

    setSpinning(true);
    setSpinPhase("season");
    setSelectedSeason(null);
    setSeasonDisplay("");
    setClubDisplay("");
    setCurrentSquad(null);
    setOfferedPlayers([]);
    setSquadRevealPending(false);
    setSelectedPlayer(null);

    const finalSeason = randomItem(seasonPool);
    const seasonTicker = window.setInterval(() => {
      setSeasonDisplay(randomItem(seasonPool).seasonLabel);
    }, 90);

    window.setTimeout(() => {
      if (spinTokenRef.current !== spinToken) {
        window.clearInterval(seasonTicker);
        return;
      }
      window.clearInterval(seasonTicker);
      setSelectedSeason(finalSeason);
      setSeasonDisplay(finalSeason.seasonLabel);
      setSpinPhase("pause");

      window.setTimeout(() => {
        if (spinTokenRef.current !== spinToken) return;
        const teamPool = eligibleTeamSeasonsForSeason(finalSeason);
        const finalTeamSeason = randomItem(teamPool);
        const clubTicker = window.setInterval(() => {
          setClubDisplay(getDisplayClubName(randomItem(teamPool).clubName));
        }, 90);

        setSpinPhase("club");

        window.setTimeout(() => {
          if (spinTokenRef.current !== spinToken) {
            window.clearInterval(clubTicker);
            return;
          }
          window.clearInterval(clubTicker);
          const squad = getSquad(finalTeamSeason);
          const offer = buildOffer(squad, slots, picks, mode === "hard" ? lockedSlot : null);
          setClubDisplay(getDisplayClubName(squad.clubName));
          setCurrentSquad(squad);
          setSpinPhase("complete");
          setSpinning(false);
          setSquadRevealPending(true);

          window.setTimeout(() => {
            if (spinTokenRef.current !== spinToken) return;
            setOfferedPlayers(offer);
            setSquadRevealPending(false);
          }, 1000);
        }, 1200);
      }, 300);
    }, 1200);
  }

  function rerollDraw() {
    spinWheel(true);
  }

  function draftPlayer(player: Player, slot: FormationSlot) {
    if (mode === "hard" && lockedSlot?.id !== slot.id) return;
    if (picks.some((pick) => pick.slotId === slot.id)) return;

    const pick = createDraftPick(player, slot);
    if (!pick) return;

    const nextPicks = [...picks, pick];
    setPicks(nextPicks);
    clearSpinState();
    setLockedSlot(null);

    if (nextPicks.length === 11) {
      setScreen("squad");
    }
  }

  function simulate() {
    const simulated = simulateCampaign(picks, slots, metrics);
    setResult(simulated);
    setScreen("simulation");
  }

  function goShare() {
    setPreviousScreen(screen);
    setScreen("share");
  }

  if (screen === "landing") {
    return (
      <LandingPage
        dataLoading={dataLoading}
        dataWarning={dataWarning}
        hasSavedRun={hasSavedRun}
        onContinue={continueSavedRun}
        onStart={() => setScreen("setup")}
      />
    );
  }

  if (screen === "setup") {
    return (
      <SetupScreen
        mode={mode}
        formation={formation}
        onModeChange={setMode}
        onFormationChange={setFormation}
        onStart={startDraft}
      />
    );
  }

  if (screen === "draft") {
    return (
      <DraftScreen
        mode={mode}
        formation={formation}
        slots={slots}
        picks={picks}
        round={round}
        metrics={metrics}
        spinning={spinning}
        spinPhase={spinPhase}
        selectedSeason={selectedSeason}
        seasonDisplay={seasonDisplay}
        clubDisplay={clubDisplay}
        currentSquad={currentSquad}
        offeredPlayers={offeredPlayers}
        selectedPlayer={selectedPlayer}
        lockedSlot={lockedSlot}
        rerollsLeft={rerollsLeft}
        squadRevealPending={squadRevealPending}
        onSpin={spinWheel}
        onReroll={rerollDraw}
        onLockSlot={setLockedSlot}
        onSelectPlayer={setSelectedPlayer}
        onDraft={draftPlayer}
        onCloseModal={clearSpinState}
        onReset={resetRun}
      />
    );
  }

  if (screen === "squad") {
    return (
      <SquadScreen
        mode={mode}
        formation={formation}
        slots={slots}
        picks={picks}
        metrics={metrics}
        onSimulate={simulate}
        onShare={goShare}
      />
    );
  }

  if (screen === "simulation" && result) {
    return <SimulationScreen result={result} onContinue={() => setScreen("final")} />;
  }

  if (screen === "final" && result) {
    return <FinalResultScreen mode={mode} metrics={metrics} result={result} picks={picks} onRestart={resetRun} onShare={goShare} />;
  }

  return (
    <ShareResultScreen
      mode={mode}
      formation={formation}
      picks={picks}
      metrics={metrics}
      result={result}
      onBack={() => setScreen(previousScreen)}
      onRestart={resetRun}
    />
  );
}
