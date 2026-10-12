import * as cheerio from "cheerio";
import type { PlayerData, RoundData, RatingsHistoryEntry } from "./types";

const BASE_URL = "https://www.pdga.com/player";

function parseDate(dateStr: string): string {
  const cleaned = dateStr.trim();

  const rangeMatch = cleaned.match(
    /(\d{1,2})-\w+\s+to\s+(\d{1,2})-(\w+)-(\d{4})/
  );
  if (rangeMatch) {
    const [, , day, month, year] = rangeMatch;
    return normalizeDate(day, month, year);
  }

  const singleMatch = cleaned.match(/(\d{1,2})-(\w+)-(\d{4})/);
  if (singleMatch) {
    const [, day, month, year] = singleMatch;
    return normalizeDate(day, month, year);
  }

  return cleaned;
}

function normalizeDate(day: string, month: string, year: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const m = months[month] ?? "01";
  return `${year}-${m}-${day.padStart(2, "0")}`;
}

function extractPlayerName(html: string): string {
  const $ = cheerio.load(html);
  const h1 = $("h1").first().text().trim();
  const match = h1.match(/^(.+?)\s*#\d+/);
  return match ? match[1].trim() : h1;
}

function extractProfileImage(html: string): string | null {
  const $ = cheerio.load(html);
  const img = $('img[typeof="foaf:Image"]').first();
  return img.length > 0 ? img.attr("src") || null : null;
}

function parseDetailsTable(html: string): RoundData[] {
  const $ = cheerio.load(html);
  const rounds: RoundData[] = [];

  // Columns: Tournament | Tier | Date | Division | Round# | Score | Rating | Evaluated | Included
  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 9) return;

    const eventName = $(cells[0]).text().trim();
    const tier = $(cells[1]).text().trim();
    const dateRaw = $(cells[2]).text().trim();
    const division = $(cells[3]).text().trim();
    const scoreRaw = $(cells[5]).text().trim();
    const ratingRaw = $(cells[6]).text().trim();
    const evaluatedRaw = $(cells[7]).text().trim();
    const includedRaw = $(cells[8]).text().trim();

    const roundRating = parseInt(ratingRaw, 10);
    if (isNaN(roundRating)) return;

    const score = parseInt(scoreRaw, 10);
    const date = parseDate(dateRaw);

    rounds.push({
      eventName,
      date,
      roundRating,
      included: includedRaw.toLowerCase() === "yes",
      evaluated: evaluatedRaw.toLowerCase() === "yes",
      score: isNaN(score) ? null : score,
      tier,
      division,
    });
  });

  return rounds;
}

function parseRatingsHistory(html: string): RatingsHistoryEntry[] {
  const $ = cheerio.load(html);
  const entries: RatingsHistoryEntry[] = [];

  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const dateRaw = $(cells[0]).text().trim();
    const ratingRaw = $(cells[1]).text().trim();
    const roundsUsedRaw = $(cells[2]).text().trim();

    const rating = parseInt(ratingRaw, 10);
    const roundsUsed = parseInt(roundsUsedRaw, 10);
    if (isNaN(rating)) return;

    entries.push({
      date: parseDate(dateRaw),
      rating,
      roundsUsed: isNaN(roundsUsed) ? 0 : roundsUsed,
    });
  });

  return entries;
}

const PAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function isBlocked(status: number, html: string): boolean {
  return (
    status === 403 ||
    status === 429 ||
    html.includes("Just a moment") ||
    html.includes("challenge-platform") ||
    html.includes("cf-mitigated")
  );
}

async function fetchPdgaHtml(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  try {
    const direct = await fetch(url, {
      headers: PAGE_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const directHtml = await direct.text();
    if (direct.ok && !isBlocked(direct.status, directHtml)) {
      return { ok: true, status: direct.status, html: directHtml };
    }
    const bridged = await fetchThroughBrowser(url);
    if (bridged) return { ok: true, status: 200, html: bridged };
    return { ok: false, status: direct.status, html: directHtml };
  } catch {
    const bridged = await fetchThroughBrowser(url);
    if (bridged) return { ok: true, status: 200, html: bridged };
    return { ok: false, status: 0, html: "" };
  }
}

async function fetchThroughBrowser(url: string): Promise<string | null> {
  try {
    const healthRes = await fetch("http://127.0.0.1:8787/health", {
      signal: AbortSignal.timeout(400),
    });
    if (!healthRes.ok) return null;
    const health = (await healthRes.json()) as { lastSeen?: number };
    if (!health.lastSeen || Date.now() - health.lastSeen > 45000) return null;

    const path = new URL(url).pathname;
    const res = await fetch("http://127.0.0.1:8787/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: number; html?: string };
    if (data.status !== 200 || !data.html || isBlocked(data.status, data.html)) return null;
    return data.html;
  } catch {
    return null;
  }
}

export async function scrapePlayer(pdgaNumber: number): Promise<PlayerData> {
  let details = await fetchPdgaHtml(`${BASE_URL}/${pdgaNumber}/details`);
  if (!details.ok) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    details = await fetchPdgaHtml(`${BASE_URL}/${pdgaNumber}/details`);
  }

  if (!details.ok) {
    if (isBlocked(details.status, details.html)) {
      throw new Error(
        "PDGA blocked this lookup. Their site is asking for a browser check, so the server could not read the player page."
      );
    }
    throw new Error(
      `Failed to fetch player details (HTTP ${details.status}). Check that the PDGA number is correct.`
    );
  }

  const history = await fetchPdgaHtml(`${BASE_URL}/${pdgaNumber}/history`);
  const detailsHtml = details.html;
  const historyHtml = history.ok ? history.html : "";

  const playerName = extractPlayerName(detailsHtml);
  if (!playerName) {
    throw new Error("Could not parse player name from PDGA page.");
  }

  const profileImageUrl = extractProfileImage(detailsHtml);
  const rounds = parseDetailsTable(detailsHtml);
  const ratingsHistory = parseRatingsHistory(historyHtml);

  const officialRating =
    ratingsHistory.length > 0 ? ratingsHistory[0].rating : null;

  return {
    playerName,
    pdgaNumber,
    officialRating,
    profileImageUrl,
    rounds,
    ratingsHistory,
  };
}
