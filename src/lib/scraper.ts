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

export async function scrapePlayer(pdgaNumber: number): Promise<PlayerData> {
  const [detailsRes, historyRes] = await Promise.all([
    fetch(`${BASE_URL}/${pdgaNumber}/details`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PDGARatingCalc/1.0; educational)",
      },
      next: { revalidate: 300 },
    }),
    fetch(`${BASE_URL}/${pdgaNumber}/history`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PDGARatingCalc/1.0; educational)",
      },
      next: { revalidate: 300 },
    }),
  ]);

  if (!detailsRes.ok) {
    throw new Error(
      `Failed to fetch player details (HTTP ${detailsRes.status}). Check that the PDGA number is correct.`
    );
  }

  const detailsHtml = await detailsRes.text();
  const historyHtml = historyRes.ok ? await historyRes.text() : "";

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
