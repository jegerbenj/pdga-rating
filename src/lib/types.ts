export interface RoundData {
  eventName: string;
  date: string;
  roundRating: number;
  included: boolean;
  evaluated: boolean;
  score: number | null;
  tier: string;
  division: string;
}

export interface RatingsHistoryEntry {
  date: string;
  rating: number;
  roundsUsed: number;
}

export interface PlayerData {
  playerName: string;
  pdgaNumber: number;
  officialRating: number | null;
  rounds: RoundData[];
  ratingsHistory: RatingsHistoryEntry[];
}

export interface CalculatedRound {
  eventName: string;
  date: string;
  roundRating: number;
  inWindow: boolean;
  isOutlier: boolean;
  isDoubleWeighted: boolean;
  isNew: boolean;
  weight: number;
}

export interface CalculationResult {
  calculatedRating: number;
  roundsUsed: number;
  totalRoundsConsidered: number;
  rounds: CalculatedRound[];
  windowMonths: number;
}
