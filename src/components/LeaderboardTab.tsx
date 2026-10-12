"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type Lang = "no" | "en";

interface BoardPlayer {
  pdga: number;
  name: string;
  rating: number;
  gender: string;
  classification: string;
  division: string;
  country: string;
  state: string;
  events: number;
  worldRank: number;
  percentile: number;
  continent: string | null;
  countryRank?: number;
  divisionRank?: number;
  genderRank?: number;
  classRank?: number;
}

interface Facet {
  value: string;
  count: number;
}

interface BoardResponse {
  updatedAt: string;
  sourceYear: number;
  complete: boolean;
  totalPlayers: number;
  lowestRating: number | null;
  matchCount: number;
  page: number;
  pageSize: number;
  players: BoardPlayer[];
  countries: Facet[];
  divisions: Facet[];
  states: Facet[];
  highlight: { index: number; page: number; player: BoardPlayer } | null;
  missingIds: number[];
  error?: string;
}

interface LookupResponse {
  updatedAt: string;
  sourceYear: number;
  complete: boolean;
  totalPlayers: number;
  lowestRating: number | null;
  player: BoardPlayer | null;
  around: BoardPlayer[];
}

const copy = {
  no: {
    title: "Verdensrating",
    subtitle: "Plassering etter gjeldende PDGA-rating, med filter og en tavle for spillerne du følger.",
    world: "Verden",
    favorites: "Favoritter",
    search: "Søk navn eller PDGA-nummer",
    country: "Land",
    allCountries: "Alle land",
    continent: "Kontinent",
    allContinents: "Alle kontinenter",
    division: "Divisjon",
    allDivisions: "Alle divisjoner",
    state: "Stat / fylke",
    allStates: "Alle",
    classLabel: "Klasse",
    gender: "Kjønn",
    all: "Alle",
    pro: "Pro",
    am: "Am",
    male: "Menn",
    female: "Kvinner",
    events: "Turner.",
    anyEvents: "Alle",
    ratingFrom: "Rating fra",
    sort: "Sorter",
    sortRank: "Verdensplass",
    sortRating: "Rating",
    sortName: "Navn",
    sortCountry: "Land",
    sortEvents: "Turner.",
    sortDivision: "Divisjon",
    filters: "Filter",
    clear: "Nullstill filter",
    loading: "Henter tavlen…",
    empty: "Ingen spillere matcher filteret.",
    emptyFavorites: "Stjernemerk spillere i verdenslisten. De samles her med verdensplass.",
    addFavorite: "Legg til PDGA-nummer",
    add: "Legg til",
    notFound: "Fant ikke nummeret i den synkroniserte delen av 2026-feltet.",
    missing: "Ikke i 2026-feltet",
    worldRank: "i verden",
    top: "topp",
    you: "Deg",
    yourPlace: "Din plass",
    countryPlace: "i landet",
    divisionPlace: "i divisjonen",
    classPlace: "i klassen",
    around: "Rett rundt deg",
    jump: "Hopp til meg",
    favoriteSummary: "Dine spillere",
    average: "Snitt",
    best: "Beste plass",
    inside: "i topp",
    eventsShort: "turn.",
    prev: "Forrige",
    next: "Neste",
    page: "Side",
    of: "av",
    players: "spillere",
    partial: (rating: number) =>
      `Verdensplass er korrekt for alle som er ratet ${rating} eller høyere. Resten av feltet synkroniseres fortsatt.`,
    updated: "PDGA-spillerstatistikk",
    star: "Favoritt",
    unstar: "Fjern favoritt",
    showOnBoard: "Se på tavlen",
    syncing: "Verdensplass synkroniseres fortsatt for denne ratingen.",
  },
  en: {
    title: "World rating",
    subtitle: "Current PDGA rating places, with filters and a board of the players you follow.",
    world: "World",
    favorites: "Favorites",
    search: "Search name or PDGA number",
    country: "Country",
    allCountries: "All countries",
    continent: "Continent",
    allContinents: "All continents",
    division: "Division",
    allDivisions: "All divisions",
    state: "State / province",
    allStates: "All",
    classLabel: "Class",
    gender: "Gender",
    all: "All",
    pro: "Pro",
    am: "Am",
    male: "Men",
    female: "Women",
    events: "Events",
    anyEvents: "Any",
    ratingFrom: "Rating from",
    sort: "Sort",
    sortRank: "World place",
    sortRating: "Rating",
    sortName: "Name",
    sortCountry: "Country",
    sortEvents: "Events",
    sortDivision: "Division",
    filters: "Filters",
    clear: "Clear filters",
    loading: "Loading the board…",
    empty: "No players match these filters.",
    emptyFavorites: "Star players on the world board. They collect here with their world place.",
    addFavorite: "Add PDGA number",
    add: "Add",
    notFound: "That number is not in the synced part of the 2026 field.",
    missing: "Not in the 2026 field",
    worldRank: "in the world",
    top: "top",
    you: "You",
    yourPlace: "Your place",
    countryPlace: "in country",
    divisionPlace: "in division",
    classPlace: "in class",
    around: "Right around you",
    jump: "Jump to me",
    favoriteSummary: "Your players",
    average: "Average",
    best: "Best place",
    inside: "inside the top",
    eventsShort: "events",
    prev: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    players: "players",
    partial: (rating: number) =>
      `World places are exact for everyone rated ${rating} or higher. The rest of the field is still syncing.`,
    updated: "PDGA player statistics",
    star: "Favorite",
    unstar: "Remove favorite",
    showOnBoard: "Show on the board",
    syncing: "World place is still syncing for this rating.",
  },
} as const;

const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "Latin America/Caribbean",
  "North America",
  "Oceania",
];

const RATING_FLOORS = [1000, 975, 950, 925, 900, 850];

function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(lang === "no" ? "nb-NO" : "en-US").format(value);
}

function formatWhen(lang: Lang, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "no" ? "nb-NO" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function WorldRankChip({ lang, pdga }: { lang: Lang; pdga: number }) {
  const t = copy[lang];
  const [lookup, setLookup] = useState<LookupResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard?pdga=${pdga}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LookupResponse | null) => {
        if (!cancelled) setLookup(data);
      })
      .catch(() => {
        if (!cancelled) setLookup(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pdga]);

  if (!lookup?.player) {
    if (!lookup || lookup.complete) return null;
    return <p className="mt-1 text-sm text-zinc-500">{t.syncing}</p>;
  }

  const player = lookup.player;

  return (
    <p className="mt-1 text-sm text-zinc-300">
      <span className="font-semibold text-white">#{formatNumber(lang, player.worldRank)}</span>{" "}
      {t.worldRank}
      <span className="text-zinc-500">
        {" "}
        · {t.top} {player.percentile}%
      </span>
      {player.countryRank ? (
        <span className="text-zinc-500">
          {" "}
          · #{formatNumber(lang, player.countryRank)} {player.country}
        </span>
      ) : null}
    </p>
  );
}

export function LeaderboardTab({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [mode, setMode] = useState<"world" | "favorites">("world");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [country, setCountry] = useState("");
  const [continent, setContinent] = useState("");
  const [gender, setGender] = useState("");
  const [classification, setClassification] = useState("");
  const [division, setDivision] = useState("");
  const [state, setState] = useState("");
  const [minRating, setMinRating] = useState("");
  const [minEvents, setMinEvents] = useState("");
  const [sort, setSort] = useState("rank");
  const [page, setPage] = useState(1);
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteBoard, setFavoriteBoard] = useState<BoardResponse | null>(null);
  const [myPdga, setMyPdga] = useState<number | null>(null);
  const [me, setMe] = useState<LookupResponse | null>(null);
  const [addNumber, setAddNumber] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("pdgaFavorites");
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites) as unknown;
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((id) => typeof id === "number"));
        }
      } catch {
        setFavorites([]);
      }
    }
    const savedPdga = Number(localStorage.getItem("pdgaNumber"));
    if (Number.isInteger(savedPdga) && savedPdga > 0) setMyPdga(savedPdga);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, country, continent, gender, classification, division, state, minRating, minEvents, sort]);

  useEffect(() => {
    if (!myPdga) return;
    let cancelled = false;
    fetch(`/api/leaderboard?pdga=${myPdga}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LookupResponse | null) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, [myPdga]);

  useEffect(() => {
    if (mode !== "world") return;
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (country) params.set("country", country);
    if (continent) params.set("continent", continent);
    if (gender) params.set("gender", gender);
    if (classification) params.set("class", classification);
    if (division) params.set("division", division);
    if (state) params.set("state", state);
    if (minRating) params.set("min", minRating);
    if (minEvents) params.set("minEvents", minEvents);
    params.set("sort", sort);
    params.set("page", String(page));
    if (myPdga) params.set("highlight", String(myPdga));
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/leaderboard?${params.toString()}`)
      .then(async (res) => {
        const data = (await res.json()) as BoardResponse;
        if (!res.ok) throw new Error(data.error || t.loading);
        return data;
      })
      .then((data) => {
        if (!cancelled) setBoard(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    mode,
    debouncedQ,
    country,
    continent,
    gender,
    classification,
    division,
    state,
    minRating,
    minEvents,
    sort,
    page,
    myPdga,
    t.loading,
  ]);

  useEffect(() => {
    if (mode !== "favorites") return;
    if (favorites.length === 0) {
      setFavoriteBoard(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/leaderboard?ids=${favorites.join(",")}`)
      .then(async (res) => {
        const data = (await res.json()) as BoardResponse;
        if (!res.ok) throw new Error(data.error || t.loading);
        return data;
      })
      .then((data) => {
        if (!cancelled) setFavoriteBoard(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, favorites, t.loading]);

  function persistFavorites(next: number[]) {
    setFavorites(next);
    localStorage.setItem("pdgaFavorites", JSON.stringify(next));
  }

  function toggleFavorite(pdga: number) {
    persistFavorites(
      favorites.includes(pdga) ? favorites.filter((id) => id !== pdga) : [...favorites, pdga]
    );
  }

  async function addFavorite() {
    const pdga = Number(addNumber);
    setAddError(null);
    if (!Number.isInteger(pdga) || pdga <= 0) {
      setAddError(t.notFound);
      return;
    }
    const res = await fetch(`/api/leaderboard?pdga=${pdga}`);
    const data = (await res.json()) as LookupResponse;
    if (!data.player) {
      setAddError(t.notFound);
      return;
    }
    if (!favorites.includes(pdga)) persistFavorites([...favorites, pdga]);
    setAddNumber("");
  }

  function clearFilters() {
    setQ("");
    setDebouncedQ("");
    setCountry("");
    setContinent("");
    setGender("");
    setClassification("");
    setDivision("");
    setState("");
    setMinRating("");
    setMinEvents("");
    setSort("rank");
    setPage(1);
  }

  const filtersActive = Boolean(
    debouncedQ || country || continent || gender || classification || division || state || minRating || minEvents
  );
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const favoriteStats = useMemo(() => {
    const players = favoriteBoard?.players ?? [];
    if (players.length === 0) return null;
    const average = Math.round(players.reduce((sum, player) => sum + player.rating, 0) / players.length);
    const best = Math.min(...players.map((player) => player.worldRank));
    const insideThousand = players.filter((player) => player.worldRank <= 1000).length;
    return { average, best, insideThousand, count: players.length };
  }, [favoriteBoard]);

  const activeBoard = mode === "favorites" ? favoriteBoard : board;
  const list = mode === "favorites" ? favoriteBoard?.players ?? [] : board?.players ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-subheading text-white text-lg">{t.title}</h2>
        <p className="text-sm text-zinc-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-900 border border-zinc-800 p-1">
        {(["world", "favorites"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${
              mode === item ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {item === "world" ? t.world : t.favorites}
            {item === "favorites" && favorites.length > 0 ? ` · ${favorites.length}` : ""}
          </button>
        ))}
      </div>

      {activeBoard && !activeBoard.complete && activeBoard.lowestRating != null && (
        <p className="text-xs text-amber-300/90 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2">
          {t.partial(activeBoard.lowestRating)}
        </p>
      )}

      {mode === "world" && me?.player && (
        <section className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{t.yourPlace}</p>
              <a
                href={`https://www.pdga.com/player/${me.player.pdga}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-subheading text-white hover:underline"
              >
                {me.player.name}
              </a>
              <p className="text-xs text-zinc-500">#{me.player.pdga}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-subheading text-white leading-none">
                #{formatNumber(lang, me.player.worldRank)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {t.top} {me.player.percentile}% · {me.player.rating}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <PlaceStat label={`${t.countryPlace}`} value={me.player.countryRank} detail={me.player.country} lang={lang} />
            <PlaceStat label={t.divisionPlace} value={me.player.divisionRank} detail={me.player.division} lang={lang} />
            <PlaceStat label={t.classPlace} value={me.player.classRank} detail={me.player.classification} lang={lang} />
          </dl>
          {board?.highlight && board.highlight.page !== page && (
            <button
              type="button"
              onClick={() => setPage(board.highlight!.page)}
              className="text-sm text-zinc-300 underline underline-offset-2 cursor-pointer"
            >
              {t.jump}
            </button>
          )}
          {me.around.length > 1 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">{t.around}</p>
              <div className="space-y-1">
                {me.around.map((player) => (
                  <div
                    key={player.pdga}
                    className={`flex items-center justify-between text-sm rounded-md px-2 py-1 ${
                      player.pdga === me.player?.pdga ? "bg-white/10 text-white" : "text-zinc-400"
                    }`}
                  >
                    <span>#{formatNumber(lang, player.worldRank)} {player.name}</span>
                    <span className="font-mono">{player.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {mode === "favorites" && (
        <section className="space-y-3">
          {favoriteStats && (
            <div className="grid grid-cols-3 gap-2">
              <PlaceStat label={t.favoriteSummary} value={favoriteStats.count} detail={t.players} lang={lang} plain />
              <PlaceStat label={t.average} value={favoriteStats.average} detail={t.sortRating} lang={lang} plain />
              <PlaceStat label={t.best} value={favoriteStats.best} detail={t.worldRank} lang={lang} />
            </div>
          )}
          {favoriteStats && favoriteStats.insideThousand > 0 && (
            <p className="text-sm text-zinc-400">
              {favoriteStats.insideThousand} {t.inside} 1 000
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={addNumber}
              onChange={(event) => setAddNumber(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void addFavorite();
              }}
              inputMode="numeric"
              placeholder={t.addFavorite}
              aria-label={t.addFavorite}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 placeholder-zinc-600"
            />
            <button
              type="button"
              onClick={() => void addFavorite()}
              className="rounded-lg bg-white text-zinc-900 px-4 text-sm font-semibold cursor-pointer"
            >
              {t.add}
            </button>
          </div>
          {addError && <p className="text-sm text-red-400">{addError}</p>}
          {favoriteBoard?.missingIds?.map((id) => (
            <p key={id} className="text-xs text-zinc-500">
              #{id} · {t.missing}
            </p>
          ))}
        </section>
      )}

      {mode === "world" && (
        <div className="space-y-3">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 placeholder-zinc-600"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={minRating === ""} label={t.all} onClick={() => setMinRating("")} />
            {RATING_FLOORS.map((floor) => (
              <FilterChip
                key={floor}
                active={minRating === String(floor)}
                label={`${floor}+`}
                onClick={() => setMinRating(String(floor))}
              />
            ))}
          </div>
          <details className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2" open>
            <summary className="cursor-pointer text-sm text-zinc-300">{t.filters}</summary>
            <div className="grid gap-3 pt-3 sm:grid-cols-2">
              <SelectField label={t.country} value={country} onChange={(value) => { setCountry(value); setState(""); }}>
                <option value="">{t.allCountries}</option>
                {(board?.countries ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} ({formatNumber(lang, option.count)})
                  </option>
                ))}
              </SelectField>
              <SelectField label={t.continent} value={continent} onChange={setContinent}>
                <option value="">{t.allContinents}</option>
                {CONTINENTS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </SelectField>
              <SelectField label={t.division} value={division} onChange={setDivision}>
                <option value="">{t.allDivisions}</option>
                {(board?.divisions ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} ({formatNumber(lang, option.count)})
                  </option>
                ))}
              </SelectField>
              <SelectField label={t.sort} value={sort} onChange={setSort}>
                <option value="rank">{t.sortRank}</option>
                <option value="rating">{t.sortRating}</option>
                <option value="name">{t.sortName}</option>
                <option value="country">{t.sortCountry}</option>
                <option value="events">{t.sortEvents}</option>
                <option value="division">{t.sortDivision}</option>
              </SelectField>
              {country && (board?.states.length ?? 0) > 0 && (
                <SelectField label={t.state} value={state} onChange={setState}>
                  <option value="">{t.allStates}</option>
                  {board?.states.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} ({formatNumber(lang, option.count)})
                    </option>
                  ))}
                </SelectField>
              )}
              <SelectField label={t.events} value={minEvents} onChange={setMinEvents}>
                <option value="">{t.anyEvents}</option>
                <option value="5">5+</option>
                <option value="10">10+</option>
                <option value="20">20+</option>
              </SelectField>
              <div className="sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500 w-14">{t.classLabel}</span>
                  <FilterChip active={classification === ""} label={t.all} onClick={() => setClassification("")} />
                  <FilterChip active={classification === "Pro"} label={t.pro} onClick={() => setClassification("Pro")} />
                  <FilterChip active={classification === "Am"} label={t.am} onClick={() => setClassification("Am")} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500 w-14">{t.gender}</span>
                  <FilterChip active={gender === ""} label={t.all} onClick={() => setGender("")} />
                  <FilterChip active={gender === "Male"} label={t.male} onClick={() => setGender("Male")} />
                  <FilterChip active={gender === "Female"} label={t.female} onClick={() => setGender("Female")} />
                </div>
              </div>
            </div>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="mt-3 text-sm text-zinc-400 underline cursor-pointer">
                {t.clear}
              </button>
            )}
          </details>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-zinc-500">{t.loading}</p>}

      {!loading && mode === "favorites" && favorites.length === 0 && (
        <p className="text-sm text-zinc-400 rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center">
          {t.emptyFavorites}
        </p>
      )}
      {!loading && list.length === 0 && (mode === "world" || favorites.length > 0) && !error && (
        <p className="text-sm text-zinc-400 text-center py-8">{t.empty}</p>
      )}

      <ol className="space-y-2">
        {list.map((player, index) => {
          const listPlace = mode === "favorites"
            ? index + 1
            : ((board?.page ?? 1) - 1) * (board?.pageSize ?? 40) + index + 1;
          const showWorldAsPrimary = mode === "world" && !filtersActive && sort === "rank";
          const primary = showWorldAsPrimary ? player.worldRank : listPlace;
          const medal = primary === 1 ? "border-amber-400/70" : primary === 2 ? "border-zinc-300/70" : primary === 3 ? "border-orange-700/80" : "border-zinc-800";
          const mine = player.pdga === myPdga;
          return (
            <li
              key={player.pdga}
              className={`rounded-lg border bg-zinc-900 px-3 py-3 ${medal} ${mine ? "ring-1 ring-white/40" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-16 shrink-0 pt-0.5">
                  <p className="font-mono text-sm text-white">#{formatNumber(lang, primary)}</p>
                  {!showWorldAsPrimary && (
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      #{formatNumber(lang, player.worldRank)} {t.world}
                    </p>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <a
                      href={`https://www.pdga.com/player/${player.pdga}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium text-white hover:underline"
                    >
                      {player.name}
                    </a>
                    {mine && <span className="text-[10px] uppercase tracking-wide text-zinc-400">{t.you}</span>}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    #{player.pdga} · {player.country}
                    {player.state ? `, ${player.state}` : ""} · {player.division}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {player.classification} · {player.gender === "Female" ? (lang === "no" ? "Kvinne" : "Female") : (lang === "no" ? "Mann" : "Male")} · {player.events} {t.eventsShort}
                    {" · "}
                    {t.top} {player.percentile}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-subheading text-white leading-none">{player.rating}</p>
                  <button
                    type="button"
                    aria-pressed={favoriteSet.has(player.pdga)}
                    aria-label={favoriteSet.has(player.pdga) ? t.unstar : t.star}
                    onClick={() => toggleFavorite(player.pdga)}
                    className={`mt-1 text-lg leading-none cursor-pointer ${
                      favoriteSet.has(player.pdga) ? "text-amber-300" : "text-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {favoriteSet.has(player.pdga) ? "★" : "☆"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {mode === "world" && board && board.matchCount > board.pageSize && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={board.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 disabled:opacity-30 cursor-pointer"
          >
            {t.prev}
          </button>
          <p className="text-xs text-zinc-500 text-center">
            {t.page} {formatNumber(lang, board.page)} {t.of}{" "}
            {formatNumber(lang, Math.ceil(board.matchCount / board.pageSize))}
            <span className="block">{formatNumber(lang, board.matchCount)} {t.players}</span>
          </p>
          <button
            type="button"
            disabled={board.page >= Math.ceil(board.matchCount / board.pageSize)}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 disabled:opacity-30 cursor-pointer"
          >
            {t.next}
          </button>
        </div>
      )}

      {activeBoard && (
        <p className="text-[11px] text-zinc-600 text-center">
          {t.updated} {activeBoard.sourceYear}
          {activeBoard.updatedAt ? ` · ${formatWhen(lang, activeBoard.updatedAt)}` : ""}
          {" · "}
          {formatNumber(lang, activeBoard.totalPlayers)} {t.players}
          {" · "}
          <a href="https://www.pdga.com/players/stats" className="underline" target="_blank" rel="noopener noreferrer">
            pdga.com
          </a>
        </p>
      )}
    </div>
  );
}

function PlaceStat({
  label,
  value,
  detail,
  lang,
  plain = false,
}: {
  label: string;
  value?: number;
  detail?: string;
  lang: Lang;
  plain?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-950/60 px-2 py-2">
      <dt className="text-[10px] text-zinc-500 truncate">{label}</dt>
      <dd className="font-subheading text-white">{value != null ? `${plain ? "" : "#"}${formatNumber(lang, value)}` : "—"}</dd>
      {detail && <p className="text-[10px] text-zinc-500 truncate">{detail}</p>}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs cursor-pointer ${
        active ? "border-white bg-white text-zinc-900" : "border-zinc-700 text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs text-zinc-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
      >
        {children}
      </select>
    </label>
  );
}
