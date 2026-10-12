import { readFileSync, statSync } from "fs";
import path from "path";
import { gunzipSync } from "zlib";
import { continentOf, type Continent } from "./continents";

export interface LeaderboardPlayer {
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
  continent: Continent | null;
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface LeaderboardIndex {
  updatedAt: string;
  sourceYear: number;
  complete: boolean;
  pages: number;
  expectedPages: number;
  lowestRating: number | null;
  players: LeaderboardPlayer[];
  byPdga: Map<number, LeaderboardPlayer>;
  countries: FacetOption[];
  divisions: FacetOption[];
  statesByCountry: Map<string, FacetOption[]>;
}

export type LeaderboardSort = "rank" | "rating" | "name" | "country" | "events" | "division";

export interface LeaderboardFilters {
  q?: string;
  country?: string;
  continent?: string;
  gender?: string;
  classification?: string;
  division?: string;
  state?: string;
  minRating?: number;
  maxRating?: number;
  minEvents?: number;
  sort?: LeaderboardSort;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  ids?: number[];
  pdga?: number;
  highlight?: number;
}

type PackedPlayer = [
  number,
  string,
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  number,
];

interface SnapshotFile {
  updatedAt: string;
  sourceYear: number;
  complete: boolean;
  pages: number;
  expectedPages: number;
  lowestRating: number | null;
  players: PackedPlayer[];
}

let cached: LeaderboardIndex | null = null;
let cachedMtime = 0;

function countOptions(values: string[]): FacetOption[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function loadLeaderboard(): LeaderboardIndex {
  const file = path.join(process.cwd(), "data", "leaderboard.json.gz");
  const mtime = statSync(file).mtimeMs;
  if (cached && cachedMtime === mtime) return cached;
  const snapshot = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8")) as SnapshotFile;
  const players: LeaderboardPlayer[] = snapshot.players.map((row) => ({
    pdga: row[0],
    name: row[1],
    rating: row[2],
    gender: row[3],
    classification: row[4],
    division: row[5],
    country: row[6],
    state: row[7],
    events: row[8],
    worldRank: row[9],
    continent: continentOf(row[6]),
  }));
  const byPdga = new Map(players.map((player) => [player.pdga, player]));
  const statesByCountry = new Map<string, string[]>();
  for (const player of players) {
    if (!player.state) continue;
    const list = statesByCountry.get(player.country) ?? [];
    list.push(player.state);
    statesByCountry.set(player.country, list);
  }
  cachedMtime = mtime;
  cached = {
    updatedAt: snapshot.updatedAt,
    sourceYear: snapshot.sourceYear,
    complete: snapshot.complete,
    pages: snapshot.pages,
    expectedPages: snapshot.expectedPages,
    lowestRating: snapshot.lowestRating,
    players,
    byPdga,
    countries: countOptions(players.map((player) => player.country)),
    divisions: countOptions(players.map((player) => player.division)),
    statesByCountry: new Map(
      [...statesByCountry.entries()].map(([country, states]) => [country, countOptions(states)])
    ),
  };
  return cached;
}

export function topPercent(worldRank: number, total: number): number {
  if (total <= 0) return 100;
  return Math.max(0.1, Math.round((worldRank / total) * 1000) / 10);
}

function groupRank(players: LeaderboardPlayer[], matches: (player: LeaderboardPlayer) => boolean, rating: number): number {
  let better = 0;
  for (const player of players) {
    if (matches(player) && player.rating > rating) better += 1;
  }
  return better + 1;
}

export interface RankedPlayer extends LeaderboardPlayer {
  percentile: number;
  countryRank?: number;
  divisionRank?: number;
  genderRank?: number;
  classRank?: number;
}

function withPercentile(player: LeaderboardPlayer, total: number): RankedPlayer {
  return { ...player, percentile: topPercent(player.worldRank, total) };
}

function withCuts(index: LeaderboardIndex, player: LeaderboardPlayer): RankedPlayer {
  return {
    ...withPercentile(player, index.players.length),
    countryRank: groupRank(index.players, (candidate) => candidate.country === player.country, player.rating),
    divisionRank: groupRank(index.players, (candidate) => candidate.division === player.division, player.rating),
    genderRank: groupRank(index.players, (candidate) => candidate.gender === player.gender, player.rating),
    classRank: groupRank(
      index.players,
      (candidate) => candidate.classification === player.classification,
      player.rating
    ),
  };
}

function defaultDir(sort: LeaderboardSort): "asc" | "desc" {
  if (sort === "name" || sort === "country" || sort === "division" || sort === "rank") return "asc";
  return "desc";
}

function comparePlayers(sort: LeaderboardSort, dir: "asc" | "desc") {
  const sign = dir === "asc" ? 1 : -1;
  return (a: LeaderboardPlayer, b: LeaderboardPlayer) => {
    let diff = 0;
    if (sort === "name") diff = a.name.localeCompare(b.name);
    else if (sort === "country") diff = a.country.localeCompare(b.country) || a.worldRank - b.worldRank;
    else if (sort === "division") diff = a.division.localeCompare(b.division) || a.worldRank - b.worldRank;
    else if (sort === "events") diff = a.events - b.events;
    else if (sort === "rating") diff = a.rating - b.rating;
    else diff = a.worldRank - b.worldRank;
    if (diff === 0) diff = a.worldRank - b.worldRank;
    return diff * sign;
  };
}

function matchesFilters(player: LeaderboardPlayer, filters: LeaderboardFilters, query: string): boolean {
  if (filters.country && player.country !== filters.country) return false;
  if (filters.continent && player.continent !== filters.continent) return false;
  if (filters.gender && player.gender !== filters.gender) return false;
  if (filters.classification && player.classification !== filters.classification) return false;
  if (filters.division && player.division !== filters.division) return false;
  if (filters.state && player.state !== filters.state) return false;
  if (filters.minRating != null && player.rating < filters.minRating) return false;
  if (filters.maxRating != null && player.rating > filters.maxRating) return false;
  if (filters.minEvents != null && player.events < filters.minEvents) return false;
  if (!query) return true;
  if (String(player.pdga).includes(query)) return true;
  return player.name.toLowerCase().includes(query);
}

export interface LeaderboardPage {
  updatedAt: string;
  sourceYear: number;
  complete: boolean;
  totalPlayers: number;
  lowestRating: number | null;
  matchCount: number;
  page: number;
  pageSize: number;
  players: RankedPlayer[];
  countries: FacetOption[];
  divisions: FacetOption[];
  states: FacetOption[];
  highlight: { index: number; page: number; player: RankedPlayer } | null;
  missingIds: number[];
}

export function queryLeaderboard(filters: LeaderboardFilters): LeaderboardPage {
  const index = loadLeaderboard();
  const total = index.players.length;
  const sort = filters.sort ?? "rank";
  const dir = filters.dir ?? defaultDir(sort);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 100));
  const query = filters.q?.trim().toLowerCase() ?? "";

  if (filters.ids) {
    const missingIds: number[] = [];
    const selected: LeaderboardPlayer[] = [];
    for (const id of filters.ids) {
      const player = index.byPdga.get(id);
      if (player) selected.push(player);
      else missingIds.push(id);
    }
    selected.sort(comparePlayers("rank", "asc"));
    return {
      updatedAt: index.updatedAt,
      sourceYear: index.sourceYear,
      complete: index.complete,
      totalPlayers: total,
      lowestRating: index.lowestRating,
      matchCount: selected.length,
      page: 1,
      pageSize: selected.length,
      players: selected.map((player) => withCuts(index, player)),
      countries: index.countries,
      divisions: index.divisions,
      states: [],
      highlight: null,
      missingIds,
    };
  }

  const filtered = index.players.filter((player) => matchesFilters(player, filters, query));
  if (sort !== "rank" || dir !== "asc") filtered.sort(comparePlayers(sort, dir));

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, filters.page ?? 1));
  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  let highlight: LeaderboardPage["highlight"] = null;
  if (filters.highlight) {
    const highlightIndex = filtered.findIndex((player) => player.pdga === filters.highlight);
    if (highlightIndex >= 0) {
      const highlightPage = Math.floor(highlightIndex / pageSize) + 1;
      highlight = {
        index: highlightIndex,
        page: highlightPage,
        player: withPercentile(filtered[highlightIndex], total),
      };
    }
  }

  return {
    updatedAt: index.updatedAt,
    sourceYear: index.sourceYear,
    complete: index.complete,
    totalPlayers: total,
    lowestRating: index.lowestRating,
    matchCount: filtered.length,
    page,
    pageSize,
    players: slice.map((player) => withPercentile(player, total)),
    countries: index.countries,
    divisions: index.divisions,
    states: filters.country ? index.statesByCountry.get(filters.country) ?? [] : [],
    highlight,
    missingIds: [],
  };
}

export function lookupPlayer(pdga: number): {
  updatedAt: string;
  sourceYear: number;
  complete: boolean;
  totalPlayers: number;
  lowestRating: number | null;
  player: RankedPlayer | null;
  around: RankedPlayer[];
} {
  const index = loadLeaderboard();
  const player = index.byPdga.get(pdga) ?? null;
  const around: RankedPlayer[] = [];
  if (player) {
    const indexInWorld = index.players.findIndex((candidate) => candidate.pdga === player.pdga);
    const start = Math.max(0, indexInWorld - 2);
    const end = Math.min(index.players.length, indexInWorld + 3);
    for (const neighbor of index.players.slice(start, end)) {
      around.push(withPercentile(neighbor, index.players.length));
    }
  }
  return {
    updatedAt: index.updatedAt,
    sourceYear: index.sourceYear,
    complete: index.complete,
    totalPlayers: index.players.length,
    lowestRating: index.lowestRating,
    player: player ? withCuts(index, player) : null,
    around,
  };
}
