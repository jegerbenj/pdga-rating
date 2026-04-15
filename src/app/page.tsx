"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  PlayerData,
  CalculationResult,
  CalculatedRound,
} from "@/lib/types";
import { calculateRating } from "@/lib/rating-calculator";

type Tab = "manual" | "fetch" | "goal";

interface NewRound {
  id: number;
  rating: string;
}

function createNewRound(nextId: React.MutableRefObject<number>): NewRound {
  return {
    id: nextId.current++,
    rating: "",
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("fetch");
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: "fetch", label: "PDGA Fetch" },
    { id: "goal", label: "Goal", disabled: !playerData },
    { id: "manual", label: "Manual" },
  ];

  return (
    <div className="flex flex-col min-h-full bg-zinc-950 text-zinc-100">
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <AdBanner
          clientId={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID ?? ""}
        />
      )}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            PDGA Rating Calculator
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Calculate ratings from rated rounds using PDGA rules
          </p>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-5">
        <div className="flex border-b border-zinc-800 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex-1 sm:flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-white text-white"
                  : tab.disabled
                    ? "border-transparent text-zinc-700 cursor-not-allowed"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "fetch" && (
          <FetchMode playerData={playerData} onPlayerData={setPlayerData} />
        )}
        {activeTab === "goal" && <GoalMode playerData={playerData} />}
        {activeTab === "manual" && <ManualMode />}
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-900 mt-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 flex flex-col items-center gap-2">
          <a
            href="https://www.hyzershop.no"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hover:underline"
          >
            hyzershop.no
          </a>
          <span className="text-xs text-zinc-600">
            Player data &copy; 2026 PDGA
          </span>
        </div>
      </footer>
    </div>
  );
}

function FetchMode({
  playerData,
  onPlayerData,
}: {
  playerData: PlayerData | null;
  onPlayerData: (data: PlayerData | null) => void;
}) {
  const [pdgaNumber, setPdgaNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [newRounds, setNewRounds] = useState<NewRound[]>([]);
  const [ratingDate, setRatingDate] = useState(getNextRatingUpdate());
  const nextIdRef = useRef(1);

  async function handleFetch() {
    const num = parseInt(pdgaNumber, 10);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid PDGA number.");
      return;
    }

    setLoading(true);
    setError(null);
    onPlayerData(null);
    setResult(null);

    try {
      const res = await fetch(`/api/pdga/${num}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch player data.");
        return;
      }
      onPlayerData(data as PlayerData);
    } catch {
      setError("Network error. Could not reach the server.");
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

  const handleUpdateRound = useCallback(
    (id: number, value: string) => {
      setNewRounds((prev) =>
        prev.map((r) => (r.id === id ? { ...r, rating: value } : r))
      );
    },
    []
  );

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
        eventName: "New round",
        date: ratingDate,
        roundRating: parseInt(r.rating, 10),
        isNew: true,
      }))
      .filter((r) => !isNaN(r.roundRating));

    const allRounds = [...existingRounds, ...parsedNewRounds];

    setResult(
      calculateRating(allRounds, {
        referenceDate: parsedNewRounds.length > 0 ? ratingDate : undefined,
      })
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
            PDGA Number
          </label>
          <input
            id="pdga-number"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pdgaNumber}
            onChange={(e) => setPdgaNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="e.g. 281989"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
          />
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-40 transition-colors min-h-[44px]"
        >
          {loading ? "Henter..." : "Hent runder"}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {playerData && (
        <div className="space-y-5">
          <PlayerInfo data={playerData} />

          <NewRoundsInput
            rounds={newRounds}
            ratingDate={ratingDate}
            onDateChange={setRatingDate}
            onAdd={handleAddRound}
            onRemove={handleRemoveRound}
            onUpdate={handleUpdateRound}
          />

          <button
            onClick={handleCalculate}
            className="w-full sm:w-auto rounded-lg bg-white text-zinc-900 px-6 py-3 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors min-h-[48px]"
          >
            Beregn rating
          </button>

          {result && <ResultSummary result={result} playerData={playerData} />}

          <RoundsTable
            rounds={result?.rounds ?? null}
            allRounds={playerData.rounds}
          />
        </div>
      )}
    </div>
  );
}

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
  return (
    <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-4 space-y-4">
      <div>
        <label
          htmlFor="rating-date"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Next rating update date{" "}
          <span className="font-normal text-zinc-500">(every 2nd Tuesday each month)</span>
        </label>
        <input
          id="rating-date"
          type="date"
          value={ratingDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
        />
        <p className="mt-1 text-xs text-zinc-600">
          The 365-day window is counted back from this date.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-medium text-zinc-300">
            Add new rounds
          </h3>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-700 text-zinc-100 px-3 py-2 text-sm font-medium hover:bg-zinc-600 active:bg-zinc-500 transition-colors min-h-[40px]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Add round</span>
          </button>
        </div>

        {rounds.length === 0 && (
          <p className="text-sm text-zinc-600">
            Add hypothetical rounds to see how they affect the rating.
          </p>
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
                placeholder="Rating"
                value={r.rating}
                onChange={(e) => onUpdate(r.id, e.target.value)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
              />
              <button
                onClick={() => onRemove(r.id)}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 active:bg-zinc-700 transition-colors"
                aria-label="Remove round"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
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
  refDate: string
): PaceResult {
  const labels: Record<number, string> = {
    5: "Fast",
    10: "Medium",
    20: "Steady",
  };

  let lo = 500;
  let hi = 1200;
  let best: number | null = null;

  for (let iter = 0; iter < 50; iter++) {
    const mid = Math.round((lo + hi) / 2);
    const simRounds = [
      ...existingRounds.map((r) => ({ ...r, isNew: false })),
      ...Array.from({ length: newRoundCount }, (_, i) => ({
        eventName: `Sim round ${i + 1}`,
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
        eventName: `Sim round ${i + 1}`,
        date: refDate,
        roundRating: 1150,
        isNew: true,
      })),
    ];
    const maxResult = calculateRating(simAtMax, { referenceDate: refDate });

    return {
      label: labels[newRoundCount] ?? `${newRoundCount} rounds`,
      roundCount: newRoundCount,
      requiredAvg: null,
      projectedRating: maxResult.calculatedRating,
      feasible: false,
    };
  }

  return {
    label: labels[newRoundCount] ?? `${newRoundCount} rounds`,
    roundCount: newRoundCount,
    requiredAvg: best,
    projectedRating: targetRating,
    feasible: true,
  };
}

function GoalMode({ playerData }: { playerData: PlayerData | null }) {
  const [targetRating, setTargetRating] = useState("");
  const [results, setResults] = useState<PaceResult[] | null>(null);
  const [currentRating, setCurrentRating] = useState<number | null>(null);

  if (!playerData) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-sm">Fetch a player first from the PDGA Fetch tab.</p>
      </div>
    );
  }

  function handleCalculate() {
    if (!playerData) return;
    const target = parseInt(targetRating, 10);
    if (isNaN(target) || target < 0) return;

    const refDate = getNextRatingUpdate();

    const existingRounds = playerData.rounds
      .filter((r) => r.evaluated && r.included)
      .map((r) => ({
        eventName: r.eventName,
        date: r.date,
        roundRating: r.roundRating,
      }));

    const current = calculateRating(
      existingRounds.map((r) => ({ ...r, isNew: false })),
      { referenceDate: refDate }
    );
    setCurrentRating(current.calculatedRating);

    const paces = [5, 10, 20].map((n) =>
      simulateRequiredRating(existingRounds, target, n, refDate)
    );
    setResults(paces);
  }

  return (
    <div className="space-y-5">
      <PlayerInfo data={playerData} />

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label
            htmlFor="target-rating"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Target rating
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
                ? `e.g. ${playerData.officialRating + 20}`
                : "e.g. 950"
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-600 px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
          />
        </div>
        <button
          onClick={handleCalculate}
          className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors min-h-[44px]"
        >
          Calculate
        </button>
      </div>

      {results && currentRating !== null && (
        <div className="space-y-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-zinc-500">Current (projected)</dt>
                <dd className="text-xl font-bold text-zinc-200">
                  {currentRating}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Target</dt>
                <dd className="text-xl font-bold text-white">
                  {targetRating}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {results.map((pace) => (
              <div
                key={pace.roundCount}
                className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
                  <h3 className="text-sm font-semibold text-white">
                    {pace.label}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {pace.roundCount} new rounds
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {pace.feasible ? (
                    <>
                      <div>
                        <dt className="text-xs text-zinc-500">Avg rating needed</dt>
                        <dd className="text-2xl font-bold text-white font-mono">
                          {pace.requiredAvg}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-zinc-500">Difference from current</dt>
                        <dd className="text-sm font-mono text-zinc-300">
                          {pace.requiredAvg !== null &&
                            (pace.requiredAvg > currentRating
                              ? `+${pace.requiredAvg - currentRating} per round`
                              : `${pace.requiredAvg - currentRating} per round`)}
                        </dd>
                      </div>
                      <RatingBar
                        current={currentRating}
                        required={pace.requiredAvg!}
                        target={parseInt(targetRating, 10)}
                      />
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-zinc-500">Not reachable</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        Max projected: {pace.projectedRating}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
                  <th className="px-3 py-2 font-medium text-zinc-400">Pace</th>
                  <th className="px-3 py-2 font-medium text-zinc-400">Rounds</th>
                  <th className="px-3 py-2 font-medium text-zinc-400">Avg needed</th>
                  <th className="px-3 py-2 font-medium text-zinc-400">vs Current</th>
                  <th className="px-3 py-2 font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((pace) => {
                  const diff =
                    pace.requiredAvg !== null
                      ? pace.requiredAvg - currentRating
                      : null;
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
                        {pace.feasible ? (
                          <span className="inline-flex items-center rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-200">
                            Reachable
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
                            Out of reach
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

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
          style={{ left: `${Math.min(currentPct, requiredPct)}%`, width: `${Math.abs(requiredPct - currentPct)}%` }}
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

function ManualMode() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  function handleCalculate() {
    const lines = input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const ratings = lines.map((l) => parseInt(l, 10)).filter((n) => !isNaN(n));

    if (ratings.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const rounds = ratings.map((r, i) => ({
      eventName: `Round ${i + 1}`,
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
          Round ratings (one per line, or comma-separated)
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
        Beregn rating
      </button>

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">Calculated Rating</dt>
                <dd className="text-2xl font-bold text-white">
                  {result.calculatedRating}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Rounds Used</dt>
                <dd className="text-2xl font-bold text-white">{result.roundsUsed}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Window</dt>
                <dd className="text-2xl font-bold text-white">
                  {result.windowMonths} mo
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

function PlayerInfo({ data }: { data: PlayerData }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-baseline gap-3 flex-wrap">
        <a
          href={`https://www.pdga.com/player/${data.pdgaNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-white hover:text-zinc-300 hover:underline transition-colors"
        >
          {data.playerName}
        </a>
        <span className="text-sm text-zinc-500">#{data.pdgaNumber}</span>
      </div>
      {data.officialRating && (
        <p className="mt-1 text-sm text-zinc-400">
          Official rating:{" "}
          <span className="font-semibold text-zinc-200">{data.officialRating}</span>
        </p>
      )}
      <p className="text-sm text-zinc-500">
        {data.rounds.length} rated rounds found
      </p>
    </div>
  );
}

function ResultSummary({
  result,
  playerData,
}: {
  result: CalculationResult;
  playerData: PlayerData;
}) {
  const diff =
    playerData.officialRating != null
      ? result.calculatedRating - playerData.officialRating
      : null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500">Official</dt>
          <dd className="text-xl sm:text-2xl font-bold text-zinc-200">
            {playerData.officialRating ?? "N/A"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Calculated</dt>
          <dd className="text-xl sm:text-2xl font-bold text-white">
            {result.calculatedRating}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Difference</dt>
          <dd
            className={`text-xl sm:text-2xl font-bold ${
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
          <dt className="text-xs text-zinc-500">Rounds</dt>
          <dd className="text-xl sm:text-2xl font-bold text-zinc-200">
            {result.roundsUsed}
            <span className="text-sm font-normal text-zinc-600">
              {" "}
              / {result.totalRoundsConsidered}
            </span>
          </dd>
        </div>
      </dl>
      {result.windowMonths > 12 && (
        <p className="mt-3 text-xs text-zinc-500">
          Extended window to {result.windowMonths} months (fewer than 8 rounds
          in 12 months)
        </p>
      )}
    </div>
  );
}

function RoundsTable({
  rounds,
  allRounds,
}: {
  rounds: CalculatedRound[] | null;
  allRounds: PlayerData["rounds"];
}) {
  if (!rounds) {
    return (
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
              <th className="px-3 py-2 font-medium text-zinc-400">Event</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Date</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Rating</th>
              <th className="px-3 py-2 font-medium text-zinc-400 hidden sm:table-cell">Tier</th>
              <th className="px-3 py-2 font-medium text-zinc-400 hidden sm:table-cell">Eval</th>
              <th className="px-3 py-2 font-medium text-zinc-400 hidden sm:table-cell">Incl</th>
            </tr>
          </thead>
          <tbody>
            {allRounds.map((r, i) => (
              <tr key={i} className="border-b border-zinc-800/50 last:border-0 text-zinc-300">
                <td className="px-3 py-2 max-w-[150px] sm:max-w-none truncate">{r.eventName}</td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-400">{r.date}</td>
                <td className="px-3 py-2 font-mono">{r.roundRating}</td>
                <td className="px-3 py-2 hidden sm:table-cell text-zinc-400">{r.tier}</td>
                <td className="px-3 py-2 hidden sm:table-cell text-zinc-400">{r.evaluated ? "Yes" : "No"}</td>
                <td className="px-3 py-2 hidden sm:table-cell text-zinc-400">{r.included ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400">Round Details</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-700 border border-zinc-500" />
          In window
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-600 border border-zinc-400" />
          Double weighted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-800 border border-zinc-600" />
          Outlier
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-900 border border-zinc-700" />
          New round
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-900 border border-zinc-800" />
          Outside window
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
              <th className="px-3 py-2 font-medium text-zinc-400">Event</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Date</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Rating</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Wt</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-800/50 last:border-0 ${rowColor(r)}`}
              >
                <td
                  className={`px-3 py-2.5 max-w-[120px] sm:max-w-none truncate ${
                    r.isOutlier ? "line-through text-zinc-600" : "text-zinc-300"
                  }`}
                >
                  {r.isNew && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 mr-1.5 align-middle" />
                  )}
                  {r.eventName}
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
  );
}

function ManualRoundsTable({ rounds }: { rounds: CalculatedRound[] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-600 border border-zinc-400" />
          Double weighted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-800 border border-zinc-600" />
          Outlier
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50 text-left">
              <th className="px-3 py-2 font-medium text-zinc-400">#</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Rating</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Wt</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Status</th>
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

function rowColor(r: CalculatedRound): string {
  if (r.isOutlier) return "bg-zinc-950";
  if (r.isNew && r.inWindow) return "bg-zinc-800/40";
  if (r.isDoubleWeighted) return "bg-zinc-800/60";
  if (!r.inWindow) return "bg-zinc-950/50";
  return "bg-zinc-900";
}

function StatusBadge({ round }: { round: CalculatedRound }) {
  if (round.isOutlier) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
        Outlier
      </span>
    );
  }
  if (!round.inWindow) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600">
        Outside
      </span>
    );
  }
  if (round.isNew) {
    const label = round.isDoubleWeighted ? "New 2x" : "New";
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-200">
        {label}
      </span>
    );
  }
  if (round.isDoubleWeighted) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-600 px-2 py-0.5 text-xs font-medium text-white">
        2x
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-300">
      Included
    </span>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-300">
        <span className="font-semibold text-white">Error:</span> {message}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Try checking the PDGA number, or use Manual mode to enter rounds
        directly.
      </p>
    </div>
  );
}

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
      // AdSense not loaded yet or blocked
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
