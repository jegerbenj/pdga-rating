import type { PlayerData } from "./types";
import { scrapePlayer } from "./scraper";

export interface PdgaFetcher {
  fetchPlayer(pdgaNumber: number): Promise<PlayerData>;
}

class PdgaApiFetcher implements PdgaFetcher {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async fetchPlayer(pdgaNumber: number): Promise<PlayerData> {
    // Placeholder: PDGA API integration requires active developer credentials.
    // When the Developer Program reopens, implement OAuth + REST calls here.
    // For now, fall through to scraper.
    throw new Error(
      `PDGA API integration not yet implemented (key: ${this.apiKey.slice(0, 4)}...). Falling back to scraper.`
    );
    void this.apiSecret;
  }
}

class PdgaScraperFetcher implements PdgaFetcher {
  async fetchPlayer(pdgaNumber: number): Promise<PlayerData> {
    return scrapePlayer(pdgaNumber);
  }
}

export function createFetcher(): PdgaFetcher {
  const apiKey = process.env.PDGA_API_KEY;
  const apiSecret = process.env.PDGA_API_SECRET;

  if (apiKey && apiSecret) {
    return new PdgaApiFetcher(apiKey, apiSecret);
  }

  return new PdgaScraperFetcher();
}

export async function fetchPlayerData(
  pdgaNumber: number
): Promise<PlayerData> {
  const fetcher = createFetcher();

  try {
    return await fetcher.fetchPlayer(pdgaNumber);
  } catch {
    // If API fetcher fails, fall back to scraper
    const scraper = new PdgaScraperFetcher();
    return scraper.fetchPlayer(pdgaNumber);
  }
}
