"use client";

import { useState, useCallback, useRef } from "react";
import type {
  PlayerData,
  CalculationResult,
  CalculatedRound,
} from "@/lib/types";
import { calculateRating } from "@/lib/rating-calculator";

type Tab = "manual" | "fetch";

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

  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            PDGA Rating Calculator
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Calculate ratings from rated rounds using PDGA rules
          </p>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-5">
        <div className="flex border-b border-zinc-200 mb-5">
          <button
            onClick={() => setActiveTab("fetch")}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "fetch"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            PDGA Fetch
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "manual"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Manual
          </button>
        </div>

        {activeTab === "fetch" ? <FetchMode /> : <ManualMode />}
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 text-center text-xs text-zinc-400">
          Player data &copy; 2026 PDGA
        </div>
      </footer>
    </div>
  );
}

function FetchMode() {
  const [pdgaNumber, setPdgaNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
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
    setPlayerData(null);
    setResult(null);

    try {
      const res = await fetch(`/api/pdga/${num}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch player data.");
        return;
      }
      setPlayerData(data as PlayerData);
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
            className="block text-sm font-medium text-zinc-700 mb-1.5"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors min-h-[44px]"
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
            className="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors min-h-[48px]"
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
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-4 space-y-4">
      <div>
        <label
          htmlFor="rating-date"
          className="block text-sm font-medium text-zinc-700 mb-1.5"
        >
          Next rating update date
        </label>
        <input
          id="rating-date"
          type="date"
          value={ratingDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-zinc-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-zinc-400">
          The 365-day window is counted back from this date.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-medium text-zinc-700">
            Add new rounds
          </h3>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[40px]"
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
          <p className="text-sm text-zinc-400">
            Add hypothetical rounds to see how they affect the rating.
          </p>
        )}

        <div className="space-y-2">
          {rounds.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-6 text-center text-xs text-zinc-400 flex-shrink-0">
                {i + 1}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Rating"
                value={r.rating}
                onChange={(e) => onUpdate(r.id, e.target.value)}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => onRemove(r.id)}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 active:bg-red-100 transition-colors"
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

function ManualMode() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  function handleCalculate() {
    const lines = input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const ratings = lines.map((l) => parseInt(l, 10)).filter((n) => !isNaN(n));

    if (ratings.length === 0) {
      return;
    }

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
          className="block text-sm font-medium text-zinc-700 mb-1.5"
        >
          Round ratings (one per line, or comma-separated)
        </label>
        <textarea
          id="manual-rounds"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder={"945\n963\n909\n926\n884\n884\n930\n968\n922\n879"}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        onClick={handleCalculate}
        className="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors min-h-[48px]"
      >
        Beregn rating
      </button>

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">Calculated Rating</dt>
                <dd className="text-2xl font-bold text-emerald-600">
                  {result.calculatedRating}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Rounds Used</dt>
                <dd className="text-2xl font-bold">{result.roundsUsed}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Window</dt>
                <dd className="text-2xl font-bold">
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
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-baseline gap-3 flex-wrap">
        <a
          href={`https://www.pdga.com/player/${data.pdgaNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-blue-600 hover:underline"
        >
          {data.playerName}
        </a>
        <span className="text-sm text-zinc-400">#{data.pdgaNumber}</span>
      </div>
      {data.officialRating && (
        <p className="mt-1 text-sm text-zinc-600">
          Official rating:{" "}
          <span className="font-semibold">{data.officialRating}</span>
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
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500">Official</dt>
          <dd className="text-xl sm:text-2xl font-bold">
            {playerData.officialRating ?? "N/A"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Calculated</dt>
          <dd className="text-xl sm:text-2xl font-bold text-emerald-600">
            {result.calculatedRating}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Difference</dt>
          <dd
            className={`text-xl sm:text-2xl font-bold ${diff != null && diff > 0 ? "text-emerald-600" : diff != null && diff < 0 ? "text-red-500" : ""}`}
          >
            {diff != null ? (diff > 0 ? `+${diff}` : diff) : "N/A"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Rounds</dt>
          <dd className="text-xl sm:text-2xl font-bold">
            {result.roundsUsed}
            <span className="text-sm font-normal text-zinc-400">
              {" "}
              / {result.totalRoundsConsidered}
            </span>
          </dd>
        </div>
      </dl>
      {result.windowMonths > 12 && (
        <p className="mt-3 text-xs text-amber-600">
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
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
              <th className="px-3 py-2 font-medium text-zinc-600">Event</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Date</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Rating</th>
              <th className="px-3 py-2 font-medium text-zinc-600 hidden sm:table-cell">Tier</th>
              <th className="px-3 py-2 font-medium text-zinc-600 hidden sm:table-cell">Eval</th>
              <th className="px-3 py-2 font-medium text-zinc-600 hidden sm:table-cell">Incl</th>
            </tr>
          </thead>
          <tbody>
            {allRounds.map((r, i) => (
              <tr key={i} className="border-b border-zinc-50 last:border-0">
                <td className="px-3 py-2 max-w-[150px] sm:max-w-none truncate">{r.eventName}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-2 font-mono">{r.roundRating}</td>
                <td className="px-3 py-2 hidden sm:table-cell">{r.tier}</td>
                <td className="px-3 py-2 hidden sm:table-cell">{r.evaluated ? "Yes" : "No"}</td>
                <td className="px-3 py-2 hidden sm:table-cell">{r.included ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-700">Round Details</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" />
          In window
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-100 border border-blue-300" />
          Double weighted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          Outlier
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-purple-100 border border-purple-300" />
          New round
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-100 border border-zinc-300" />
          Outside window
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
              <th className="px-3 py-2 font-medium text-zinc-600">Event</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Date</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Rating</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Wt</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-50 last:border-0 ${rowColor(r)}`}
              >
                <td
                  className={`px-3 py-2.5 max-w-[120px] sm:max-w-none truncate ${r.isOutlier ? "line-through text-zinc-400" : ""}`}
                >
                  {r.isNew && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 align-middle" />
                  )}
                  {r.eventName}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{r.date}</td>
                <td
                  className={`px-3 py-2.5 font-mono ${r.isDoubleWeighted ? "font-bold" : ""}`}
                >
                  {r.roundRating}
                </td>
                <td className="px-3 py-2.5 font-mono">{r.weight}x</td>
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
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-100 border border-blue-300" />
          Double weighted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          Outlier
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
              <th className="px-3 py-2 font-medium text-zinc-600">#</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Rating</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Wt</th>
              <th className="px-3 py-2 font-medium text-zinc-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-50 last:border-0 ${rowColor(r)}`}
              >
                <td className="px-3 py-2.5 text-zinc-400">{i + 1}</td>
                <td
                  className={`px-3 py-2.5 font-mono ${r.isDoubleWeighted ? "font-bold" : ""} ${r.isOutlier ? "line-through text-zinc-400" : ""}`}
                >
                  {r.roundRating}
                </td>
                <td className="px-3 py-2.5 font-mono">{r.weight}x</td>
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
  if (r.isOutlier) return "bg-red-50";
  if (r.isNew && r.inWindow) return "bg-purple-50";
  if (r.isDoubleWeighted) return "bg-blue-50";
  if (!r.inWindow) return "bg-zinc-50";
  return "bg-emerald-50/50";
}

function StatusBadge({ round }: { round: CalculatedRound }) {
  if (round.isOutlier) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Outlier
      </span>
    );
  }
  if (!round.inWindow) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
        Outside
      </span>
    );
  }
  if (round.isNew) {
    const label = round.isDoubleWeighted ? "New 2x" : "New";
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        {label}
      </span>
    );
  }
  if (round.isDoubleWeighted) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        2x
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Included
    </span>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-700">
        <span className="font-semibold">Error:</span> {message}
      </p>
      <p className="mt-1 text-xs text-red-500">
        Try checking the PDGA number, or use Manual mode to enter rounds
        directly.
      </p>
    </div>
  );
}
