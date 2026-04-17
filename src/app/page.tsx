"use client";

import { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";
import type {
  PlayerData,
  CalculationResult,
  CalculatedRound,
} from "@/lib/types";
import { calculateRating } from "@/lib/rating-calculator";

// ─── Language system ──────────────────────────────────────────────────────────

type Lang = "no" | "en";

interface Translations {
  title: string;
  subtitle: string;
  tabSearch: string;
  tabAnalyse: string;
  tabCompare: string;
  tabTournaments: string;
  tabManual: string;
  pdgaNumberLabel: string;
  pdgaPlaceholder: string;
  fetchButton: string;
  fetchingButton: string;
  errorInvalidNumber: string;
  errorFetch: string;
  errorNetwork: string;
  subTabCalculate: string;
  subTabGoal: string;
  officialRating: string;
  roundsFound: string;
  nextUpdateLabel: string;
  nextUpdateHint: string;
  windowHint: string;
  addNewRounds: string;
  addRound: string;
  noRoundsHint: string;
  ratingPlaceholder: string;
  calculateButton: string;
  official: string;
  calculated: string;
  difference: string;
  rounds: string;
  extendedWindow: (months: number) => string;
  months: string;
  colTournament: string;
  colDate: string;
  colRating: string;
  colTier: string;
  colEval: string;
  colIncl: string;
  yes: string;
  no: string;
  showAll: (total: number, more: number) => string;
  showFewer: string;
  roundDetails: string;
  legendInWindow: string;
  legendDoubleWeighted: string;
  legendOutlier: string;
  legendNewRound: string;
  legendOutsideWindow: string;
  colWeight: string;
  colStatus: string;
  badgeOutlier: string;
  badgeOutside: string;
  badgeNew2x: string;
  badgeNew: string;
  badgeIncluded: string;
  targetRatingLabel: string;
  examplePrefix: string;
  calculateGoalButton: string;
  currentProjected: string;
  target: string;
  newRoundsUnit: string;
  avgNeeded: string;
  diffFromCurrent: string;
  perRound: string;
  notReachable: string;
  maxProjected: string;
  colPace: string;
  colRounds: string;
  colAvgNeeded: string;
  colVsCurrent: string;
  badgeAchievable: string;
  badgeDifficult: string;
  badgeUnreachable: string;
  paceFast: string;
  paceMedium: string;
  paceSteady: string;
  paceRoundsLabel: (n: number) => string;
  manualInputLabel: string;
  calculatedRatingLabel: string;
  roundsUsedLabel: string;
  windowLabel: string;
  errorPrefix: string;
  errorHint: string;
  footerAttribution: string;
  newRoundEventName: string;
  simRoundName: (n: number) => string;
  manualRoundName: (n: number) => string;
  dangerZoneTitle: string;
  dangerZoneShootUnder: (n: number) => string;
  dangerZoneDistanceSafe: (n: number) => string;
  dangerZoneInDanger: string;
  dangerZoneDrop: string;
  dangerZoneBorderline: string;
  dangerZoneSafe: string;
  dangerZoneSimRound: string;
  consistencyTitle: string;
  consistencyScore: string;
  consistencyBest: string;
  consistencyWorst: string;
  consistencySpread: string;
  consistencyMsgVeryConsistent: string;
  consistencyMsgSolid: string;
  consistencyMsgSomeInconsistency: string;
  consistencyMsgHighVariance: string;
  consistencyAvg: string;
  // New tab labels
  noPlayerFetched: string;
  noResultYet: string;
  compareTitle: string;
  comparePdga1Label: string;
  comparePdga2Label: string;
  compareButton: string;
  compareComparingText: string;
  compareFetchError: string;
  compareRating: string;
  compareRounds: string;
  tournamentsTitle: string;
  tournamentsDescription: string;
  tournamentsOpen: string;
  manualModeSwitch: string;
  manualModeBack: string;
}

const translations: Record<Lang, Translations> = {
  no: {
    title: "PDGA Rating-kalkulator",
    subtitle: "Beregn rating fra ratede runder basert på PDGA-regler",
    tabSearch: "Søk",
    tabAnalyse: "Analyse",
    tabCompare: "Sammenligne",
    tabTournaments: "Turneringer",
    tabManual: "Manuell",
    pdgaNumberLabel: "PDGA-nummer",
    pdgaPlaceholder: "f.eks. 281989",
    fetchButton: "Hent runder",
    fetchingButton: "Henter...",
    errorInvalidNumber: "Vennligst oppgi et gyldig PDGA-nummer.",
    errorFetch: "Kunne ikke hente spillerdata.",
    errorNetwork: "Nettverksfeil. Kunne ikke nå serveren.",
    subTabCalculate: "Beregn rating",
    subTabGoal: "Målsetting",
    officialRating: "Offisiell rating",
    roundsFound: "ratede runder funnet",
    nextUpdateLabel: "Neste ratingoppdatering",
    nextUpdateHint: "(annenhver tirsdag hver måned)",
    windowHint: "365-dagers vinduet beregnes tilbake fra denne datoen.",
    addNewRounds: "Legg til nye runder",
    addRound: "Legg til",
    noRoundsHint: "Legg til hypotetiske runder for å se hvordan de påvirker ratingen.",
    ratingPlaceholder: "Rating",
    calculateButton: "Beregn rating",
    official: "Offisiell",
    calculated: "Beregnet",
    difference: "Differanse",
    rounds: "Runder",
    extendedWindow: (m) => `Utvidet vindu til ${m} måneder (færre enn 8 runder innen 12 måneder)`,
    months: "mnd",
    colTournament: "Turnering",
    colDate: "Dato",
    colRating: "Rating",
    colTier: "Tier",
    colEval: "Eval",
    colIncl: "Inkl",
    yes: "Ja",
    no: "Nei",
    showAll: (total, more) => `Vis alle ${total} runder (${more} til)`,
    showFewer: "Vis færre",
    roundDetails: "Rundedetaljer",
    legendInWindow: "I vindu",
    legendDoubleWeighted: "Dobbelvektet",
    legendOutlier: "Avvik",
    legendNewRound: "Ny runde",
    legendOutsideWindow: "Utenfor vindu",
    colWeight: "Vekt",
    colStatus: "Status",
    badgeOutlier: "Avvik",
    badgeOutside: "Utenfor",
    badgeNew2x: "Ny 2x",
    badgeNew: "Ny",
    badgeIncluded: "Inkludert",
    targetRatingLabel: "Målrating",
    examplePrefix: "f.eks.",
    calculateGoalButton: "Beregn",
    currentProjected: "Nåværende (beregnet)",
    target: "Mål",
    newRoundsUnit: "nye runder",
    avgNeeded: "Snittrating nødvendig",
    diffFromCurrent: "Forskjell fra nåværende",
    perRound: "per runde",
    notReachable: "Uoppnåelig",
    maxProjected: "Maks beregnet:",
    colPace: "Tempo",
    colRounds: "Runder",
    colAvgNeeded: "Snitt nødv.",
    colVsCurrent: "vs nåværende",
    badgeAchievable: "Oppnåelig",
    badgeDifficult: "Vanskelig",
    badgeUnreachable: "Uoppnåelig",
    paceFast: "Rask",
    paceMedium: "Middels",
    paceSteady: "Jevn",
    paceRoundsLabel: (n) => `${n} runder`,
    manualInputLabel: "Runde-ratinger (én per linje, eller kommaseparert)",
    calculatedRatingLabel: "Beregnet rating",
    roundsUsedLabel: "Runder brukt",
    windowLabel: "Vindu",
    errorPrefix: "Feil:",
    errorHint: "Sjekk PDGA-nummeret, eller bruk manuell modus for å legge inn runder direkte.",
    footerAttribution: "Spillerdata © 2026 PDGA",
    newRoundEventName: "Ny runde",
    simRoundName: (n) => `Sim. runde ${n}`,
    manualRoundName: (n) => `Runde ${n}`,
    dangerZoneTitle: "Faresone",
    dangerZoneShootUnder: (n) => `Skyt under ${n} → ratingen faller`,
    dangerZoneDistanceSafe: (n) => `Du er ${n} poeng fra faresonen`,
    dangerZoneInDanger: "Du er i faresonen",
    dangerZoneDrop: "Fall",
    dangerZoneBorderline: "Grense",
    dangerZoneSafe: "Trygg",
    dangerZoneSimRound: "Sim. runde",
    consistencyTitle: "Konsistens",
    consistencyScore: "Poengsum",
    consistencyBest: "Beste",
    consistencyWorst: "Svakeste",
    consistencySpread: "Spredning",
    consistencyMsgVeryConsistent: "Svært konsistent",
    consistencyMsgSolid: "Solid konsistens",
    consistencyMsgSomeInconsistency: "Noe inkonsistent",
    consistencyMsgHighVariance: "Høy varians skader ratingen",
    consistencyAvg: "Snitt",
    noPlayerFetched: "Søk etter en spiller for å komme i gang.",
    noResultYet: "Beregn rating i Søk-fanen for å se analyse her.",
    compareTitle: "Sammenligne spillere",
    comparePdga1Label: "Spiller 1",
    comparePdga2Label: "Spiller 2",
    compareButton: "Sammenligne",
    compareComparingText: "Henter...",
    compareFetchError: "Kunne ikke hente spiller",
    compareRating: "Offisiell rating",
    compareRounds: "Ratede runder",
    tournamentsTitle: "Finn turneringer",
    tournamentsDescription: "Søk etter og finn disc golf-turneringer i Norge og Europa på discgolfscene.com.",
    tournamentsOpen: "Åpne discgolfscene.com",
    manualModeSwitch: "Bruk manuell inndata",
    manualModeBack: "← Tilbake til PDGA-søk",
  },
  en: {
    title: "PDGA Rating Calculator",
    subtitle: "Calculate ratings from rated rounds using PDGA rules",
    tabSearch: "Search",
    tabAnalyse: "Analyse",
    tabCompare: "Compare",
    tabTournaments: "Tournaments",
    tabManual: "Manual",
    pdgaNumberLabel: "PDGA Number",
    pdgaPlaceholder: "e.g. 281989",
    fetchButton: "Fetch rounds",
    fetchingButton: "Fetching...",
    errorInvalidNumber: "Please enter a valid PDGA number.",
    errorFetch: "Could not fetch player data.",
    errorNetwork: "Network error. Could not reach the server.",
    subTabCalculate: "Calculate rating",
    subTabGoal: "Goal setting",
    officialRating: "Official rating",
    roundsFound: "rated rounds found",
    nextUpdateLabel: "Next rating update",
    nextUpdateHint: "(every 2nd Tuesday each month)",
    windowHint: "The 365-day window is counted back from this date.",
    addNewRounds: "Add new rounds",
    addRound: "Add",
    noRoundsHint: "Add hypothetical rounds to see how they affect the rating.",
    ratingPlaceholder: "Rating",
    calculateButton: "Calculate rating",
    official: "Official",
    calculated: "Calculated",
    difference: "Difference",
    rounds: "Rounds",
    extendedWindow: (m) => `Extended window to ${m} months (fewer than 8 rounds in 12 months)`,
    months: "mo",
    colTournament: "Tournament",
    colDate: "Date",
    colRating: "Rating",
    colTier: "Tier",
    colEval: "Eval",
    colIncl: "Incl",
    yes: "Yes",
    no: "No",
    showAll: (total, more) => `Show all ${total} rounds (${more} more)`,
    showFewer: "Show fewer",
    roundDetails: "Round details",
    legendInWindow: "In window",
    legendDoubleWeighted: "Double weighted",
    legendOutlier: "Outlier",
    legendNewRound: "New round",
    legendOutsideWindow: "Outside window",
    colWeight: "Wt",
    colStatus: "Status",
    badgeOutlier: "Outlier",
    badgeOutside: "Outside",
    badgeNew2x: "New 2x",
    badgeNew: "New",
    badgeIncluded: "Included",
    targetRatingLabel: "Target rating",
    examplePrefix: "e.g.",
    calculateGoalButton: "Calculate",
    currentProjected: "Current (projected)",
    target: "Target",
    newRoundsUnit: "new rounds",
    avgNeeded: "Avg rating needed",
    diffFromCurrent: "Difference from current",
    perRound: "per round",
    notReachable: "Unreachable",
    maxProjected: "Max projected:",
    colPace: "Pace",
    colRounds: "Rounds",
    colAvgNeeded: "Avg needed",
    colVsCurrent: "vs current",
    badgeAchievable: "Achievable",
    badgeDifficult: "Difficult",
    badgeUnreachable: "Unreachable",
    paceFast: "Fast",
    paceMedium: "Medium",
    paceSteady: "Steady",
    paceRoundsLabel: (n) => `${n} rounds`,
    manualInputLabel: "Round ratings (one per line, or comma-separated)",
    calculatedRatingLabel: "Calculated rating",
    roundsUsedLabel: "Rounds used",
    windowLabel: "Window",
    errorPrefix: "Error:",
    errorHint: "Check the PDGA number, or use manual mode to enter rounds directly.",
    footerAttribution: "Player data © 2026 PDGA",
    newRoundEventName: "New round",
    simRoundName: (n) => `Sim round ${n}`,
    manualRoundName: (n) => `Round ${n}`,
    dangerZoneTitle: "Danger Zone",
    dangerZoneShootUnder: (n) => `Shoot under ${n} → rating drops`,
    dangerZoneDistanceSafe: (n) => `You are ${n} points from danger`,
    dangerZoneInDanger: "You are in the danger zone",
    dangerZoneDrop: "Drop",
    dangerZoneBorderline: "Borderline",
    dangerZoneSafe: "Safe",
    dangerZoneSimRound: "Sim round",
    consistencyTitle: "Consistency",
    consistencyScore: "Score",
    consistencyBest: "Best",
    consistencyWorst: "Worst",
    consistencySpread: "Spread",
    consistencyMsgVeryConsistent: "Very consistent",
    consistencyMsgSolid: "Solid consistency",
    consistencyMsgSomeInconsistency: "Some inconsistency",
    consistencyMsgHighVariance: "High variance hurting rating",
    consistencyAvg: "Avg",
    noPlayerFetched: "Search for a player to get started.",
    noResultYet: "Calculate rating in the Search tab to see analysis here.",
    compareTitle: "Compare players",
    comparePdga1Label: "Player 1",
    comparePdga2Label: "Player 2",
    compareButton: "Compare",
    compareComparingText: "Fetching...",
    compareFetchError: "Could not fetch player",
    compareRating: "Official rating",
    compareRounds: "Rated rounds",
    tournamentsTitle: "Find tournaments",
    tournamentsDescription: "Search for and find disc golf tournaments in Norway and Europe on discgolfscene.com.",
    tournamentsOpen: "Open discgolfscene.com",
    manualModeSwitch: "Use manual input",
    manualModeBack: "← Back to PDGA search",
  },
};

const LangContext = createContext<Lang>("no");
function useT(): Translations {
  return translations[useContext(LangContext)];
}

// ─── Types & helpers ──────────────────────────────────────────────────────────

type TopTab = "search" | "analyse" | "compare" | "tournaments";

interface NewRound {
  id: number;
  rating: string;
}

function createNewRound(nextId: React.MutableRefObject<number>): NewRound {
  return { id: nextId.current++, rating: "" };
}

function truncName(name: string, max = 45): string {
  return name.length > max ? name.slice(0, max - 2) + ".." : name;
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<TopTab>("search");
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [ratingDate, setRatingDate] = useState(getNextRatingUpdate());
  const [lang, setLang] = useState<Lang>("no");
  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "no" || saved === "en") setLang(saved);
  }, []);

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "no" ? "en" : "no";
      localStorage.setItem("lang", next);
      return next;
    });
  }

  return (
    <LangContext.Provider value={lang}>
      <div className="flex flex-col min-h-full bg-zinc-950 text-zinc-100">
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <AdBanner
            clientId={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
            slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID ?? ""}
          />
        )}

        <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-heading tracking-tight text-white">
                {t.title}
              </h1>
            </div>
            <button
              onClick={toggleLang}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors px-3 py-1.5 text-xs font-semibold text-zinc-300 cursor-pointer"
              title={lang === "no" ? "Switch to English" : "Bytt til norsk"}
            >
              <span className="text-base leading-none">{lang === "no" ? "🇳🇴" : "🇬🇧"}</span>
              {lang === "no" ? "NO" : "EN"}
            </button>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-5 pb-24">
          {activeTab === "search" && (
            <FetchMode
              playerData={playerData}
              onPlayerData={(data) => {
                setPlayerData(data);
                if (!data) setResult(null);
              }}
              result={result}
              onResult={setResult}
              ratingDate={ratingDate}
              onDateChange={setRatingDate}
            />
          )}
          {activeTab === "analyse" && (
            <AnalyseTab
              playerData={playerData}
              result={result}
              ratingDate={ratingDate}
            />
          )}
          {activeTab === "compare" && <CompareTab />}
          {activeTab === "tournaments" && <TournamentsTab />}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="h-px bg-zinc-800" />
        <div className="bg-zinc-900 text-center py-2">
          <span className="text-xs text-zinc-600">{t.footerAttribution}</span>
        </div>
      </div>
    </LangContext.Provider>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TopTab;
  onTabChange: (tab: TopTab) => void;
}) {
  const t = useT();

  const items: { id: TopTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "search",
      label: t.tabSearch,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: "analyse",
      label: t.tabAnalyse,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: "compare",
      label: t.tabCompare,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "tournaments",
      label: t.tabTournaments,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900 border-t border-zinc-800 safe-bottom">
      <div className="mx-auto max-w-4xl flex">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors cursor-pointer ${
              activeTab === item.id
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className={activeTab === item.id ? "text-white" : "text-zinc-500"}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-medium ${activeTab === item.id ? "text-white" : "text-zinc-500"}`}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── FetchMode ────────────────────────────────────────────────────────────────

function FetchMode({
  playerData,
  onPlayerData,
  result,
  onResult,
  ratingDate,
  onDateChange,
}: {
  playerData: PlayerData | null;
  onPlayerData: (data: PlayerData | null) => void;
  result: CalculationResult | null;
  onResult: (r: CalculationResult | null) => void;
  ratingDate: string;
  onDateChange: (value: string) => void;
}) {
  const t = useT();
  const [pdgaNumber, setPdgaNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRounds, setNewRounds] = useState<NewRound[]>([]);
  const [showManual, setShowManual] = useState(false);
  const nextIdRef = useRef(1);

  useEffect(() => {
    const saved = localStorage.getItem("pdgaNumber");
    if (saved) setPdgaNumber(saved);
  }, []);

  async function handleFetch() {
    const num = parseInt(pdgaNumber, 10);
    if (isNaN(num) || num <= 0) {
      setError(t.errorInvalidNumber);
      return;
    }
    setLoading(true);
    setError(null);
    onPlayerData(null);
    onResult(null);
    try {
      const res = await fetch(`/api/pdga/${num}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errorFetch);
        return;
      }
      onPlayerData(data as PlayerData);
      localStorage.setItem("pdgaNumber", pdgaNumber);
    } catch {
      setError(t.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  const handleAddRound = useCallback(() => {
    setNewRounds((prev) => [...prev, createNewRound(nextIdRef)]);
  }, []);

  const handleRemoveRound = useCallback((id: number) => {
    setNewRounds((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleUpdateRound = useCallback((id: number, value: string) => {
    setNewRounds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rating: value } : r))
    );
  }, []);

  function handleCalculate() {
    if (!playerData) return;
    const existingRounds = playerData.rounds
      .filter((r) => r.evaluated && r.included)
      .map((r) => ({
        eventName: r.eventName,
        date: r.date,
        roundRating: r.roundRating,
        isNew: false,
      }));
    const parsedNewRounds = newRounds
      .filter((r) => r.rating.trim() !== "")
      .map((r) => ({
        eventName: t.newRoundEventName,
        date: ratingDate,
        roundRating: parseInt(r.rating, 10),
        isNew: true,
      }))
      .filter((r) => !isNaN(r.roundRating));
    const allRounds = [...existingRounds, ...parsedNewRounds];
    onResult(
      calculateRating(allRounds, {
        referenceDate: parsedNewRounds.length > 0 ? ratingDate : undefined,
      })
    );
  }

  if (showManual) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setShowManual(false)}
          className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {t.manualModeBack}
        </button>
        <ManualMode />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label
            htmlFor="pdga-number"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            {t.pdgaNumberLabel}
          </label>
          <input
            id="pdga-number"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pdgaNumber}
            onChange={(e) => setPdgaNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder={t.pdgaPlaceholder}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
          />
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-40 transition-colors min-h-[44px]"
        >
          {loading ? t.fetchingButton : t.fetchButton}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {!playerData && !error && (
        <button
          onClick={() => setShowManual(true)}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {t.manualModeSwitch} →
        </button>
      )}

      {playerData && (
        <FetchSubTabs
          playerData={playerData}
          result={result}
          newRounds={newRounds}
          ratingDate={ratingDate}
          onDateChange={onDateChange}
          onAddRound={handleAddRound}
          onRemoveRound={handleRemoveRound}
          onUpdateRound={handleUpdateRound}
          onCalculate={handleCalculate}
        />
      )}
    </div>
  );
}

// ─── FetchSubTabs ─────────────────────────────────────────────────────────────

type FetchSubTab = "calculate" | "goal";

function FetchSubTabs({
  playerData,
  result,
  newRounds,
  ratingDate,
  onDateChange,
  onAddRound,
  onRemoveRound,
  onUpdateRound,
  onCalculate,
}: {
  playerData: PlayerData;
  result: CalculationResult | null;
  newRounds: NewRound[];
  ratingDate: string;
  onDateChange: (value: string) => void;
  onAddRound: () => void;
  onRemoveRound: (id: number) => void;
  onUpdateRound: (id: number, value: string) => void;
  onCalculate: () => void;
}) {
  const t = useT();
  const [subTab, setSubTab] = useState<FetchSubTab>("calculate");

  const subTabs: { id: FetchSubTab; label: string }[] = [
    { id: "calculate", label: t.subTabCalculate },
    { id: "goal", label: t.subTabGoal },
  ];

  return (
    <div className="space-y-5">
      <PlayerInfo data={playerData} />

      <div className="flex border-b border-zinc-800">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-subheading border-b-2 transition-colors cursor-pointer ${
              subTab === tab.id
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "calculate" && (
        <div className="space-y-5">
          <NewRoundsInput
            rounds={newRounds}
            ratingDate={ratingDate}
            onDateChange={onDateChange}
            onAdd={onAddRound}
            onRemove={onRemoveRound}
            onUpdate={onUpdateRound}
          />
          <button
            onClick={onCalculate}
            className="w-full sm:w-auto rounded-lg bg-white text-zinc-900 px-6 py-3 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors min-h-[48px]"
          >
            {t.calculateButton}
          </button>
          {result && <ResultSummary result={result} playerData={playerData} />}
          <RoundsTable
            rounds={result?.rounds ?? null}
            allRounds={playerData.rounds}
          />
        </div>
      )}

      {subTab === "goal" && <GoalSection playerData={playerData} />}
    </div>
  );
}

// ─── AnalyseTab ───────────────────────────────────────────────────────────────

function AnalyseTab({
  playerData,
  result,
  ratingDate,
}: {
  playerData: PlayerData | null;
  result: CalculationResult | null;
  ratingDate: string;
}) {
  const t = useT();

  if (!playerData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <p className="text-sm text-zinc-400 max-w-xs">{t.noPlayerFetched}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-5">
        <PlayerInfo data={playerData} />
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-sm text-zinc-400 max-w-xs">{t.noResultYet}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PlayerInfo data={playerData} />
      <DangerZone
        playerData={playerData}
        result={result}
        ratingDate={ratingDate}
      />
      <ConsistencyCard result={result} />
    </div>
  );
}

// ─── CompareTab ───────────────────────────────────────────────────────────────

function CompareTab() {
  const t = useT();
  const [pdga1, setPdga1] = useState("");
  const [pdga2, setPdga2] = useState("");
  const [loading, setLoading] = useState(false);
  const [player1, setPlayer1] = useState<PlayerData | null>(null);
  const [player2, setPlayer2] = useState<PlayerData | null>(null);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);

  async function fetchPlayer(num: string): Promise<PlayerData | null> {
    const n = parseInt(num, 10);
    if (isNaN(n) || n <= 0) return null;
    const res = await fetch(`/api/pdga/${n}`);
    if (!res.ok) return null;
    return res.json();
  }

  async function handleCompare() {
    setLoading(true);
    setError1(null);
    setError2(null);
    setPlayer1(null);
    setPlayer2(null);
    const [p1, p2] = await Promise.all([
      fetchPlayer(pdga1).catch(() => null),
      fetchPlayer(pdga2).catch(() => null),
    ]);
    if (!p1 && pdga1) setError1(`${t.compareFetchError} #${pdga1}`);
    if (!p2 && pdga2) setError2(`${t.compareFetchError} #${pdga2}`);
    setPlayer1(p1);
    setPlayer2(p2);
    setLoading(false);
  }

  const refDate = getNextRatingUpdate();

  function getCalcRating(p: PlayerData): number | null {
    const rounds = p.rounds
      .filter((r) => r.evaluated && r.included)
      .map((r) => ({ eventName: r.eventName, date: r.date, roundRating: r.roundRating, isNew: false as const }));
    if (rounds.length === 0) return null;
    return calculateRating(rounds, { referenceDate: refDate }).calculatedRating;
  }

  const calc1 = player1 ? getCalcRating(player1) : null;
  const calc2 = player2 ? getCalcRating(player2) : null;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {t.comparePdga1Label}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t.pdgaPlaceholder}
              value={pdga1}
              onChange={(e) => setPdga1(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {t.comparePdga2Label}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t.pdgaPlaceholder}
              value={pdga2}
              onChange={(e) => setPdga2(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || (!pdga1 && !pdga2)}
          className="w-full rounded-lg bg-white text-zinc-900 px-5 py-3 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-40 transition-colors min-h-[48px]"
        >
          {loading ? t.compareComparingText : t.compareButton}
        </button>
      </div>

      {(error1 || error2) && (
        <div className="space-y-2">
          {error1 && <p className="text-sm text-red-400">{error1}</p>}
          {error2 && <p className="text-sm text-red-400">{error2}</p>}
        </div>
      )}

      {(player1 || player2) && (
        <div className="space-y-4">
          {/* Side-by-side ratings */}
          {(calc1 !== null || calc2 !== null) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  {player1 ? (
                    <>
                      <div className="text-3xl font-subheading text-white mb-1">{calc1 ?? "—"}</div>
                      <div className="text-xs text-zinc-500">{player1.officialRating ? `${t.compareRating}: ${player1.officialRating}` : ""}</div>
                    </>
                  ) : <div className="text-3xl font-subheading text-zinc-700">—</div>}
                </div>
                <div>
                  {player2 ? (
                    <>
                      <div className={`text-3xl font-subheading mb-1 ${
                        calc1 !== null && calc2 !== null
                          ? calc2 > calc1 ? "text-emerald-400" : calc2 < calc1 ? "text-red-400" : "text-white"
                          : "text-white"
                      }`}>{calc2 ?? "—"}</div>
                      <div className="text-xs text-zinc-500">{player2.officialRating ? `${t.compareRating}: ${player2.officialRating}` : ""}</div>
                    </>
                  ) : <div className="text-3xl font-subheading text-zinc-700">—</div>}
                </div>
              </div>
              {/* Rating bar */}
              {calc1 !== null && calc2 !== null && (
                <div className="mt-4">
                  <CompareBar v1={calc1} v2={calc2} label1={player1?.playerName ?? ""} label2={player2?.playerName ?? ""} />
                </div>
              )}
            </div>
          )}

          {/* Player cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {player1 && <ComparePlayerCard player={player1} calcRating={calc1} isWinner={calc1 !== null && calc2 !== null && calc1 > calc2} />}
            {player2 && <ComparePlayerCard player={player2} calcRating={calc2} isWinner={calc2 !== null && calc1 !== null && calc2 > calc1} />}
          </div>
        </div>
      )}
    </div>
  );
}

function CompareBar({
  v1,
  v2,
  label1,
  label2,
}: {
  v1: number;
  v2: number;
  label1: string;
  label2: string;
}) {
  const min = Math.min(v1, v2) - 20;
  const max = Math.max(v1, v2) + 20;
  const range = max - min || 1;
  const p1 = ((v1 - min) / range) * 100;
  const p2 = ((v2 - min) / range) * 100;

  return (
    <div className="space-y-2">
      <div className="relative h-3 rounded-full bg-zinc-800 overflow-visible">
        <div
          className="absolute top-0 bottom-0 rounded-full bg-zinc-600"
          style={{
            left: `${Math.min(p1, p2)}%`,
            width: `${Math.abs(p2 - p1)}%`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-zinc-900 z-10"
          style={{ left: `${p1}%`, transform: "translate(-50%, -50%)" }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-zinc-900 z-10 ${v2 > v1 ? "bg-emerald-400" : v2 < v1 ? "bg-red-400" : "bg-white"}`}
          style={{ left: `${p2}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span className="truncate max-w-[45%]">{label1}: {v1}</span>
        <span className="truncate max-w-[45%] text-right">{label2}: {v2}</span>
      </div>
    </div>
  );
}

function ComparePlayerCard({
  player,
  calcRating,
  isWinner,
}: {
  player: PlayerData;
  calcRating: number | null;
  isWinner: boolean;
}) {
  const t = useT();
  return (
    <div className={`rounded-lg border bg-zinc-900 p-4 ${isWinner ? "border-emerald-800/60" : "border-zinc-800"}`}>
      <div className="flex items-center gap-3">
        {player.profileImageUrl ? (
          <img
            src={player.profileImageUrl}
            alt={player.playerName}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-zinc-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0 border-2 border-zinc-700 flex items-center justify-center text-zinc-400 text-lg font-bold">
            {player.playerName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://www.pdga.com/player/${player.pdgaNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-subheading text-white hover:underline truncate"
            >
              {player.playerName}
            </a>
            {isWinner && (
              <span className="text-emerald-400 text-xs">▲</span>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">#{player.pdgaNumber}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-zinc-800/50 px-2 py-2">
          <div className="text-[10px] text-zinc-500">{t.compareRating}</div>
          <div className="font-subheading text-zinc-200">{player.officialRating ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-zinc-800/50 px-2 py-2">
          <div className="text-[10px] text-zinc-500">{t.calculated}</div>
          <div className={`font-subheading ${isWinner ? "text-emerald-400" : "text-zinc-200"}`}>{calcRating ?? "—"}</div>
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-zinc-600">
        {player.rounds.length} {t.compareRounds}
      </div>
    </div>
  );
}

// ─── TournamentsTab ───────────────────────────────────────────────────────────

function TournamentsTab() {
  const t = useT();

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h2 className="font-subheading text-white">{t.tournamentsTitle}</h2>
        </div>
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-400 max-w-xs">
            {t.tournamentsDescription}
          </p>
          <a
            href="https://www.discgolfscene.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-zinc-900 px-6 py-3 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors min-h-[48px]"
          >
            {t.tournamentsOpen}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs text-zinc-500 text-center">
          discgolfscene.com er en ekstern tjeneste og vedlikeholdes ikke av oss.
        </p>
      </div>
    </div>
  );
}

// ─── NewRoundsInput ───────────────────────────────────────────────────────────

function NewRoundsInput({
  rounds,
  ratingDate,
  onDateChange,
  onAdd,
  onRemove,
  onUpdate,
}: {
  rounds: NewRound[];
  ratingDate: string;
  onDateChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, value: string) => void;
}) {
  const t = useT();
  return (
    <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-4 space-y-4">
      <div>
        <label
          htmlFor="rating-date"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          {t.nextUpdateLabel}{" "}
          <span className="font-normal text-zinc-500">{t.nextUpdateHint}</span>
        </label>
        <input
          id="rating-date"
          type="date"
          value={ratingDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
        />
        <p className="mt-1 text-xs text-zinc-600">{t.windowHint}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-medium text-zinc-300">{t.addNewRounds}</h3>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-700 text-zinc-100 px-3 py-2 text-sm font-medium hover:bg-zinc-600 active:bg-zinc-500 transition-colors min-h-[40px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">{t.addRound}</span>
          </button>
        </div>

        {rounds.length === 0 && (
          <p className="text-sm text-zinc-600">{t.noRoundsHint}</p>
        )}

        <div className="space-y-2">
          {rounds.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-6 text-center text-xs text-zinc-600 flex-shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={t.ratingPlaceholder}
                value={r.rating}
                onChange={(e) => onUpdate(r.id, e.target.value)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
              />
              <button
                onClick={() => onRemove(r.id)}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 active:bg-zinc-700 transition-colors"
                aria-label="Remove round"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getNextRatingUpdate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  for (let m = month; m < month + 3; m++) {
    const d = nthWeekday(m > 11 ? year + 1 : year, m % 12, 2, 2);
    if (d >= now) return d.toISOString().slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
}

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  const offset = ((weekday - firstDay + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, 1 + offset);
}

// ─── Danger Zone logic ────────────────────────────────────────────────────────

function findDangerThreshold(
  existingRounds: { eventName: string; date: string; roundRating: number }[],
  currentRating: number,
  refDate: string,
  t: Translations
): number {
  let lo = 500;
  let hi = 1150;
  let threshold = 500;

  for (let iter = 0; iter < 50; iter++) {
    const mid = Math.round((lo + hi) / 2);
    const simRounds = [
      ...existingRounds.map((r) => ({ ...r, isNew: false })),
      { eventName: t.dangerZoneSimRound, date: refDate, roundRating: mid, isNew: true },
    ];
    const result = calculateRating(simRounds, { referenceDate: refDate });
    if (result.calculatedRating >= currentRating) {
      threshold = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  return threshold;
}

// ─── GoalSection ──────────────────────────────────────────────────────────────

interface PaceResult {
  label: string;
  roundCount: number;
  requiredAvg: number | null;
  projectedRating: number;
  feasible: boolean;
}

function simulateRequiredRating(
  existingRounds: { eventName: string; date: string; roundRating: number }[],
  targetRating: number,
  newRoundCount: number,
  refDate: string,
  t: Translations
): PaceResult {
  const labels: Record<number, string> = {
    5: t.paceFast,
    10: t.paceMedium,
    20: t.paceSteady,
  };

  let lo = 500;
  let hi = 1200;
  let best: number | null = null;

  for (let iter = 0; iter < 50; iter++) {
    const mid = Math.round((lo + hi) / 2);
    const simRounds = [
      ...existingRounds.map((r) => ({ ...r, isNew: false })),
      ...Array.from({ length: newRoundCount }, (_, i) => ({
        eventName: t.simRoundName(i + 1),
        date: refDate,
        roundRating: mid,
        isNew: true,
      })),
    ];
    const result = calculateRating(simRounds, { referenceDate: refDate });
    if (result.calculatedRating >= targetRating) {
      best = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  if (best === null || best > 1150) {
    const simAtMax = [
      ...existingRounds.map((r) => ({ ...r, isNew: false })),
      ...Array.from({ length: newRoundCount }, (_, i) => ({
        eventName: t.simRoundName(i + 1),
        date: refDate,
        roundRating: 1150,
        isNew: true,
      })),
    ];
    const maxResult = calculateRating(simAtMax, { referenceDate: refDate });
    return {
      label: labels[newRoundCount] ?? t.paceRoundsLabel(newRoundCount),
      roundCount: newRoundCount,
      requiredAvg: null,
      projectedRating: maxResult.calculatedRating,
      feasible: false,
    };
  }

  return {
    label: labels[newRoundCount] ?? t.paceRoundsLabel(newRoundCount),
    roundCount: newRoundCount,
    requiredAvg: best,
    projectedRating: targetRating,
    feasible: true,
  };
}

function GoalSection({ playerData }: { playerData: PlayerData }) {
  const t = useT();
  const [targetRating, setTargetRating] = useState("");
  const [results, setResults] = useState<PaceResult[] | null>(null);
  const [currentRating, setCurrentRating] = useState<number | null>(null);

  function handleCalculate() {
    const target = parseInt(targetRating, 10);
    if (isNaN(target) || target < 0) return;
    const refDate = getNextRatingUpdate();
    const existingRounds = playerData.rounds
      .filter((r) => r.evaluated && r.included)
      .map((r) => ({ eventName: r.eventName, date: r.date, roundRating: r.roundRating }));
    const current = calculateRating(
      existingRounds.map((r) => ({ ...r, isNew: false })),
      { referenceDate: refDate }
    );
    setCurrentRating(current.calculatedRating);
    const paces = [5, 10, 20].map((n) =>
      simulateRequiredRating(existingRounds, target, n, refDate, t)
    );
    setResults(paces);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label
            htmlFor="target-rating"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            {t.targetRatingLabel}
          </label>
          <input
            id="target-rating"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={targetRating}
            onChange={(e) => setTargetRating(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            placeholder={
              playerData.officialRating
                ? `${t.examplePrefix} ${playerData.officialRating + 20}`
                : `${t.examplePrefix} 950`
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
          />
        </div>
        <button
          onClick={handleCalculate}
          className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors min-h-[44px]"
        >
          {t.calculateGoalButton}
        </button>
      </div>

      {results && currentRating !== null && (
        <div className="space-y-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-zinc-500">{t.currentProjected}</dt>
                <dd className="text-xl font-subheading text-zinc-200">{currentRating}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">{t.target}</dt>
                <dd className="text-xl font-subheading text-white">{targetRating}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {results.map((pace) => {
              const diff =
                pace.requiredAvg !== null ? pace.requiredAvg - currentRating : null;
              const tier = getDifficultyTier(diff, pace.feasible);
              const borderColor =
                tier === "easy"
                  ? "border-emerald-800/60"
                  : tier === "hard"
                    ? "border-amber-800/50"
                    : "border-red-900/40";

              return (
                <div
                  key={pace.roundCount}
                  className={`rounded-lg border bg-zinc-900 overflow-hidden ${borderColor}`}
                >
                  <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-subheading text-white">{pace.label}</h3>
                      <p className="text-xs text-zinc-500">
                        {pace.roundCount} {t.newRoundsUnit}
                      </p>
                    </div>
                    <DifficultyBadge tier={tier} />
                  </div>
                  <div className="p-4 space-y-3">
                    {pace.feasible ? (
                      <>
                        <div>
                          <dt className="text-xs text-zinc-500">{t.avgNeeded}</dt>
                          <dd className="text-2xl font-subheading text-white font-mono">
                            {pace.requiredAvg}
                          </dd>
                        </div>
                        {pace.requiredAvg !== null && (
                          <RatingBar
                            current={currentRating}
                            required={pace.requiredAvg}
                            target={parseInt(targetRating, 10)}
                          />
                        )}
                        <div className="pt-1">
                          <dt className="text-xs text-zinc-500">{t.diffFromCurrent}</dt>
                          <dd className="text-sm font-mono text-zinc-400">
                            {diff !== null && diff > 0 ? `+${diff}` : diff} {t.perRound}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-zinc-500">{t.notReachable}</p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {t.maxProjected} {pace.projectedRating}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[400px] sm:min-w-0 px-4 sm:px-0">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
                      <th className="px-3 py-2 font-medium text-zinc-400">{t.colPace}</th>
                      <th className="px-3 py-2 font-medium text-zinc-400">{t.colRounds}</th>
                      <th className="px-3 py-2 font-medium text-zinc-400">{t.colAvgNeeded}</th>
                      <th className="px-3 py-2 font-medium text-zinc-400">{t.colVsCurrent}</th>
                      <th className="px-3 py-2 font-medium text-zinc-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((pace) => {
                      const diff =
                        pace.requiredAvg !== null ? pace.requiredAvg - currentRating : null;
                      const tier = getDifficultyTier(diff, pace.feasible);
                      return (
                        <tr
                          key={pace.roundCount}
                          className="border-b border-zinc-800/50 last:border-0"
                        >
                          <td className="px-3 py-2.5 font-medium text-zinc-300">
                            {pace.label}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-zinc-400">
                            {pace.roundCount}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-white font-semibold">
                            {pace.feasible ? pace.requiredAvg : "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-zinc-400">
                            {diff !== null
                              ? diff > 0
                                ? `+${diff}`
                                : `${diff}`
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <DifficultyBadge tier={tier} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DangerZone ───────────────────────────────────────────────────────────────

function DangerZone({
  playerData,
  result,
  ratingDate,
}: {
  playerData: PlayerData;
  result: CalculationResult;
  ratingDate: string;
}) {
  const t = useT();

  const existingRounds = playerData.rounds
    .filter((r) => r.evaluated && r.included)
    .map((r) => ({ eventName: r.eventName, date: r.date, roundRating: r.roundRating }));

  const threshold = findDangerThreshold(
    existingRounds,
    result.calculatedRating,
    ratingDate,
    t
  );

  const lastRoundRating = result.rounds.find(
    (r) => r.inWindow && !r.isOutlier
  )?.roundRating;
  const distanceFromDanger = lastRoundRating != null ? lastRoundRating - threshold : null;

  const chipRed = threshold - 20;
  const chipYellow = threshold;
  const chipGreen = threshold + 20;

  return (
    <div className="rounded-lg border border-amber-900/40 bg-zinc-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-amber-950/30 flex items-center gap-2">
        <span className="text-amber-400 text-lg">&#9888;</span>
        <h3 className="text-sm font-subheading text-amber-200">{t.dangerZoneTitle}</h3>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-zinc-300">
          {t.dangerZoneShootUnder(threshold)}
        </p>

        <div className="flex items-center gap-3 justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center justify-center rounded-lg bg-red-900/50 border border-red-800/60 px-3 py-2 font-mono text-base font-bold text-red-300 min-w-[64px]">
              {chipRed}
            </span>
            <span className="text-[10px] text-red-400/70">{t.dangerZoneDrop}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center justify-center rounded-lg bg-amber-900/50 border border-amber-700/60 px-3 py-2 font-mono text-base font-bold text-amber-300 min-w-[64px]">
              {chipYellow}
            </span>
            <span className="text-[10px] text-amber-400/70">{t.dangerZoneBorderline}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center justify-center rounded-lg bg-emerald-900/50 border border-emerald-700/60 px-3 py-2 font-mono text-base font-bold text-emerald-300 min-w-[64px]">
              {chipGreen}
            </span>
            <span className="text-[10px] text-emerald-400/70">{t.dangerZoneSafe}</span>
          </div>
        </div>

        {distanceFromDanger != null && (
          <p className={`text-center text-sm font-medium ${
            distanceFromDanger <= 0
              ? "text-red-400"
              : distanceFromDanger <= 20
                ? "text-amber-400"
                : "text-zinc-400"
          }`}>
            {distanceFromDanger <= 0
              ? t.dangerZoneInDanger
              : t.dangerZoneDistanceSafe(distanceFromDanger)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Consistency Score ────────────────────────────────────────────────────────

interface ConsistencyData {
  score: number;
  best: number;
  worst: number;
  spread: number;
  mean: number;
  stdDev: number;
  ratings: number[];
}

function computeConsistency(rounds: CalculatedRound[]): ConsistencyData | null {
  const included = rounds.filter((r) => r.inWindow && !r.isOutlier);
  if (included.length < 3) return null;
  const ratings = included.map((r) => r.roundRating);
  const mean = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  const squaredDiffs = ratings.map((v) => (v - mean) ** 2);
  const stdDev = Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / ratings.length);
  const score = Math.round(Math.max(0, Math.min(100, 100 - stdDev * 2.5)));
  return {
    score,
    best: Math.max(...ratings),
    worst: Math.min(...ratings),
    spread: Math.max(...ratings) - Math.min(...ratings),
    mean: Math.round(mean),
    stdDev: Math.round(stdDev * 10) / 10,
    ratings: included.slice(0, 20).map((r) => r.roundRating),
  };
}

function getConsistencyMessage(score: number, t: Translations): string {
  if (score >= 85) return t.consistencyMsgVeryConsistent;
  if (score >= 70) return t.consistencyMsgSolid;
  if (score >= 50) return t.consistencyMsgSomeInconsistency;
  return t.consistencyMsgHighVariance;
}

function getConsistencyColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-sky-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function getConsistencyBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-sky-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function ConsistencyCard({ result }: { result: CalculationResult }) {
  const t = useT();
  const data = computeConsistency(result.rounds);
  if (!data) return null;

  const message = getConsistencyMessage(data.score, t);
  const scoreColor = getConsistencyColor(data.score);
  const barColor = getConsistencyBarColor(data.score);

  const chartRatings = data.ratings;
  const chartMin = Math.min(...chartRatings) - 10;
  const chartMax = Math.max(...chartRatings) + 10;
  const chartRange = chartMax - chartMin || 1;

  const svgW = 320;
  const svgH = 80;
  const barW = Math.max(4, Math.min(14, (svgW - 20) / chartRatings.length - 2));
  const totalBarsW = chartRatings.length * (barW + 2);
  const offsetX = (svgW - totalBarsW) / 2;

  const meanY = svgH - ((data.mean - chartMin) / chartRange) * svgH;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-subheading text-white">{t.consistencyTitle}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-subheading ${scoreColor}`}>{data.score}</span>
          <span className="text-xs text-zinc-500">/100</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{message}</span>
            <span className="text-zinc-500 font-mono">{data.score}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${data.score}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <dt className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.consistencyBest}</dt>
            <dd className="text-lg font-subheading text-emerald-400 font-mono">{data.best}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.consistencyWorst}</dt>
            <dd className="text-lg font-subheading text-red-400 font-mono">{data.worst}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.consistencySpread}</dt>
            <dd className="text-lg font-subheading text-zinc-300 font-mono">{data.spread}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.consistencyAvg}</dt>
            <dd className="text-lg font-subheading text-zinc-300 font-mono">{data.mean}</dd>
          </div>
        </div>

        {chartRatings.length >= 3 && (
          <div className="flex justify-center">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full max-w-[320px] h-auto"
              preserveAspectRatio="xMidYMid meet"
            >
              <line
                x1={0}
                y1={meanY}
                x2={svgW}
                y2={meanY}
                stroke="currentColor"
                className="text-zinc-600"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              {chartRatings.map((rating, i) => {
                const barH = ((rating - chartMin) / chartRange) * (svgH - 4);
                const x = offsetX + i * (barW + 2);
                const y = svgH - barH;
                const isAboveMean = rating >= data.mean;
                const fill = isAboveMean ? "#34d399" : rating < data.mean - data.stdDev ? "#f87171" : "#fbbf24";

                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(barH, 2)}
                    rx={2}
                    fill={fill}
                    opacity={0.8}
                  />
                );
              })}
              <text
                x={svgW - 2}
                y={meanY - 3}
                textAnchor="end"
                className="fill-zinc-500"
                fontSize="9"
              >
                {data.mean}
              </text>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────

type DifficultyTier = "easy" | "hard" | "unreachable";

function getDifficultyTier(diff: number | null, feasible: boolean): DifficultyTier {
  if (!feasible || diff === null) return "unreachable";
  if (diff >= 130) return "unreachable";
  if (diff >= 70) return "hard";
  return "easy";
}

function DifficultyBadge({ tier }: { tier: DifficultyTier }) {
  const t = useT();
  if (tier === "easy") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-900/60 px-2 py-0.5 text-xs font-medium text-emerald-300">
        {t.badgeAchievable}
      </span>
    );
  }
  if (tier === "hard") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-900/50 px-2 py-0.5 text-xs font-medium text-amber-300">
        {t.badgeDifficult}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-400">
      {t.badgeUnreachable}
    </span>
  );
}

// ─── RatingBar ────────────────────────────────────────────────────────────────

function RatingBar({
  current,
  required,
  target,
}: {
  current: number;
  required: number;
  target: number;
}) {
  const min = Math.min(current, required, target) - 30;
  const max = Math.max(current, required, target) + 30;
  const range = max - min;
  const currentPct = ((current - min) / range) * 100;
  const requiredPct = ((required - min) / range) * 100;

  return (
    <div className="pt-2">
      <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="absolute h-full bg-zinc-500 rounded-full"
          style={{
            left: `${Math.min(currentPct, requiredPct)}%`,
            width: `${Math.abs(requiredPct - currentPct)}%`,
          }}
        />
      </div>
      <div className="relative mt-1 text-[10px] text-zinc-600">
        <span className="absolute" style={{ left: `${currentPct}%`, transform: "translateX(-50%)" }}>
          {current}
        </span>
        <span className="absolute font-medium text-zinc-400" style={{ left: `${requiredPct}%`, transform: "translateX(-50%)" }}>
          {required}
        </span>
      </div>
    </div>
  );
}

// ─── ManualMode ───────────────────────────────────────────────────────────────

function ManualMode() {
  const t = useT();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  function handleCalculate() {
    const lines = input.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const ratings = lines.map((l) => parseInt(l, 10)).filter((n) => !isNaN(n));
    if (ratings.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const rounds = ratings.map((r, i) => ({
      eventName: t.manualRoundName(i + 1),
      date: today,
      roundRating: r,
    }));
    setResult(calculateRating(rounds));
  }

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="manual-rounds"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          {t.manualInputLabel}
        </label>
        <textarea
          id="manual-rounds"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder={"945\n963\n909\n926\n884\n884\n930\n968\n922\n879"}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
        />
      </div>
      <button
        onClick={handleCalculate}
        className="w-full sm:w-auto rounded-lg bg-white text-zinc-900 px-6 py-3 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors min-h-[48px]"
      >
        {t.calculateButton}
      </button>
      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">{t.calculatedRatingLabel}</dt>
                <dd className="text-2xl font-subheading text-white">{result.calculatedRating}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">{t.roundsUsedLabel}</dt>
                <dd className="text-2xl font-subheading text-white">{result.roundsUsed}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">{t.windowLabel}</dt>
                <dd className="text-2xl font-subheading text-white">
                  {result.windowMonths} {t.months}
                </dd>
              </div>
            </dl>
          </div>
          <ManualRoundsTable rounds={result.rounds} />
        </div>
      )}
    </div>
  );
}

// ─── PlayerInfo ───────────────────────────────────────────────────────────────

function PlayerInfo({ data }: { data: PlayerData }) {
  const t = useT();
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-4">
        {data.profileImageUrl ? (
          <img
            src={data.profileImageUrl}
            alt={data.playerName}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-zinc-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex-shrink-0 border-2 border-zinc-700 flex items-center justify-center text-zinc-500 text-xl font-bold">
            {data.playerName.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <a
              href={`https://www.pdga.com/player/${data.pdgaNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-subheading text-white hover:text-zinc-300 hover:underline transition-colors"
            >
              {data.playerName}
            </a>
            <span className="text-sm text-zinc-500">#{data.pdgaNumber}</span>
          </div>
          {data.officialRating && (
            <p className="mt-0.5 text-sm text-zinc-400">
              {t.officialRating}:{" "}
              <span className="font-semibold text-zinc-200">{data.officialRating}</span>
            </p>
          )}
          <p className="text-sm text-zinc-500">
            {data.rounds.length} {t.roundsFound}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ResultSummary ────────────────────────────────────────────────────────────

function ResultSummary({
  result,
  playerData,
}: {
  result: CalculationResult;
  playerData: PlayerData;
}) {
  const t = useT();
  const diff =
    playerData.officialRating != null
      ? result.calculatedRating - playerData.officialRating
      : null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500">{t.official}</dt>
          <dd className="text-xl sm:text-2xl font-subheading text-zinc-200">
            {playerData.officialRating ?? "N/A"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{t.calculated}</dt>
          <dd className="text-xl sm:text-2xl font-subheading text-white">
            {result.calculatedRating}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{t.difference}</dt>
          <dd
            className={`text-xl sm:text-2xl font-subheading ${
              diff != null && diff > 0
                ? "text-zinc-100"
                : diff != null && diff < 0
                  ? "text-zinc-400"
                  : "text-zinc-300"
            }`}
          >
            {diff != null ? (diff > 0 ? `+${diff}` : diff) : "N/A"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{t.rounds}</dt>
          <dd className="text-xl sm:text-2xl font-subheading text-zinc-200">
            {result.roundsUsed}
            <span className="text-sm font-normal text-zinc-600">
              {" "}/ {result.totalRoundsConsidered}
            </span>
          </dd>
        </div>
      </dl>
      {result.windowMonths > 12 && (
        <p className="mt-3 text-xs text-zinc-500">
          {t.extendedWindow(result.windowMonths)}
        </p>
      )}
    </div>
  );
}

// ─── RoundsTable ──────────────────────────────────────────────────────────────

const ROUNDS_LIMIT = 40;

function RoundsTable({
  rounds,
  allRounds,
}: {
  rounds: CalculatedRound[] | null;
  allRounds: PlayerData["rounds"];
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  if (!rounds) {
    const visible = expanded ? allRounds : allRounds.slice(0, ROUNDS_LIMIT);
    const hasMore = allRounds.length > ROUNDS_LIMIT;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-subheading text-zinc-300">{t.roundDetails}</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[500px] sm:min-w-0 px-4 sm:px-0">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colTournament}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colDate}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colRating}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400 hidden sm:table-cell">{t.colTier}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400 hidden sm:table-cell">{t.colEval}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400 hidden sm:table-cell">{t.colIncl}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b border-zinc-800/50 last:border-0 ${
                        !r.evaluated ? "text-zinc-600 bg-zinc-950/30" : "text-zinc-300"
                      }`}
                    >
                      <td className="px-3 py-2">{truncName(r.eventName)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-2 font-mono">{r.roundRating}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">{r.tier}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">{r.evaluated ? t.yes : t.no}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">{r.included ? t.yes : t.no}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-center text-sm text-zinc-400 hover:text-zinc-200 py-2 transition-colors cursor-pointer"
          >
            {expanded
              ? t.showFewer
              : t.showAll(allRounds.length, allRounds.length - ROUNDS_LIMIT)}
          </button>
        )}
      </div>
    );
  }

  const visible = expanded ? rounds : rounds.slice(0, ROUNDS_LIMIT);
  const hasMore = rounds.length > ROUNDS_LIMIT;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-subheading text-zinc-300">{t.roundDetails}</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-950/40 border border-emerald-800/50" />
          {t.legendDoubleWeighted}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-950/20 border border-zinc-700" />
          {t.legendInWindow}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-950 border border-zinc-700" />
          {t.legendOutlier}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-sky-950/30 border border-zinc-700" />
          {t.legendNewRound}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-950/50 border border-zinc-700" />
          {t.legendOutsideWindow}
        </span>
      </div>
      <div className="space-y-2">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[400px] sm:min-w-0 px-4 sm:px-0">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colTournament}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colDate}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colRating}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colWeight}</th>
                    <th className="px-3 py-2 font-medium text-zinc-400">{t.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b border-zinc-800/50 last:border-0 ${rowColor(r)}`}
                    >
                      <td
                        className={`px-3 py-2.5 ${
                          r.isOutlier ? "line-through text-zinc-600" : "text-zinc-300"
                        }`}
                      >
                        {r.isNew && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5 align-middle" />
                        )}
                        {truncName(r.eventName)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500">{r.date}</td>
                      <td
                        className={`px-3 py-2.5 font-mono ${
                          r.isDoubleWeighted ? "font-bold text-white" : "text-zinc-300"
                        }`}
                      >
                        {r.roundRating}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-zinc-500">{r.weight}x</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge round={r} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-sm text-zinc-400 hover:text-zinc-200 py-2 transition-colors cursor-pointer"
        >
          {expanded
            ? t.showFewer
            : t.showAll(rounds.length, rounds.length - ROUNDS_LIMIT)}
        </button>
      )}
    </div>
  );
}

// ─── ManualRoundsTable ────────────────────────────────────────────────────────

function ManualRoundsTable({ rounds }: { rounds: CalculatedRound[] }) {
  const t = useT();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-800/50 border border-emerald-600/50" />
          {t.legendDoubleWeighted}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-800 border border-zinc-600" />
          {t.legendOutlier}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
              <th className="px-3 py-2 font-medium text-zinc-400">#</th>
              <th className="px-3 py-2 font-medium text-zinc-400">{t.colRating}</th>
              <th className="px-3 py-2 font-medium text-zinc-400">{t.colWeight}</th>
              <th className="px-3 py-2 font-medium text-zinc-400">{t.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-800/50 last:border-0 ${rowColor(r)}`}
              >
                <td className="px-3 py-2.5 text-zinc-600">{i + 1}</td>
                <td
                  className={`px-3 py-2.5 font-mono ${
                    r.isDoubleWeighted ? "font-bold text-white" : "text-zinc-300"
                  } ${r.isOutlier ? "line-through text-zinc-600" : ""}`}
                >
                  {r.roundRating}
                </td>
                <td className="px-3 py-2.5 font-mono text-zinc-500">{r.weight}x</td>
                <td className="px-3 py-2.5">
                  <StatusBadge round={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Row color & StatusBadge ──────────────────────────────────────────────────

function rowColor(r: CalculatedRound): string {
  if (r.isOutlier) return "bg-zinc-950";
  if (r.isNew && r.inWindow) return "bg-sky-950/30";
  if (r.isDoubleWeighted) return "bg-emerald-950/40";
  if (!r.inWindow) return "bg-zinc-950/50";
  if (r.inWindow) return "bg-emerald-950/20";
  return "bg-zinc-900";
}

function StatusBadge({ round }: { round: CalculatedRound }) {
  const t = useT();
  if (round.isOutlier) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-400">
        {t.badgeOutlier}
      </span>
    );
  }
  if (!round.inWindow) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600">
        {t.badgeOutside}
      </span>
    );
  }
  if (round.isNew) {
    const label = round.isDoubleWeighted ? t.badgeNew2x : t.badgeNew;
    return (
      <span className="inline-flex items-center rounded-full bg-sky-900/50 px-2 py-0.5 text-xs font-medium text-sky-300">
        {label}
      </span>
    );
  }
  if (round.isDoubleWeighted) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-300">
        {t.badgeIncluded} 2x
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-400/80">
      {t.badgeIncluded}
    </span>
  );
}

// ─── ErrorMessage ─────────────────────────────────────────────────────────────

function ErrorMessage({ message }: { message: string }) {
  const t = useT();
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-300">
        <span className="font-semibold text-white">{t.errorPrefix}</span> {message}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{t.errorHint}</p>
    </div>
  );
}

// ─── AdBanner ─────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

function AdBanner({ clientId, slotId }: { clientId: string; slotId: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded or blocked
    }
  }, []);

  return (
    <div className="w-full bg-zinc-900" style={{ minHeight: 50 }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
