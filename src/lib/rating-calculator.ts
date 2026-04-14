import type { CalculatedRound, CalculationResult } from "./types";

interface RoundInput {
  eventName: string;
  date: string;
  roundRating: number;
  isNew?: boolean;
}

interface CalculateOptions {
  referenceDate?: string;
}

function daysDiff(a: Date, b: Date): number {
  return Math.floor(
    (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function monthsDiff(a: Date, b: Date): number {
  return (
    (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth())
  );
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / values.length);
}

export function calculateRating(
  rounds: RoundInput[],
  options?: CalculateOptions
): CalculationResult {
  if (rounds.length === 0) {
    return {
      calculatedRating: 0,
      roundsUsed: 0,
      totalRoundsConsidered: 0,
      rounds: [],
      windowMonths: 12,
    };
  }

  const sorted = [...rounds].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const refDate = options?.referenceDate
    ? new Date(options.referenceDate)
    : new Date(sorted[0].date);

  const useFixedDays = !!options?.referenceDate;

  // Step 1: gather rounds within 12 months (or 365 days if fixed reference)
  let windowMonths = 12;

  const isInWindow = (r: RoundInput, months: number) => {
    const rd = new Date(r.date);
    if (useFixedDays) {
      const maxDays = months === 12 ? 365 : 730;
      return daysDiff(refDate, rd) <= maxDays && daysDiff(refDate, rd) >= 0;
    }
    return monthsDiff(refDate, rd) < months;
  };

  let inWindowRounds = sorted.filter((r) => isInWindow(r, 12));

  // Step 2: if fewer than 8, extend to 24 months
  if (inWindowRounds.length < 8) {
    windowMonths = 24;
    inWindowRounds = sorted.filter((r) => isInWindow(r, 24));
  }

  const inWindowKeys = new Set(
    inWindowRounds.map((r) => `${r.date}|${r.roundRating}|${r.eventName}`)
  );

  // Step 3: outlier removal (>= 7 rounds)
  const ratings = inWindowRounds.map((r) => r.roundRating);
  const mean = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  const sd = standardDeviation(ratings);

  const outlierKeys = new Set<string>();
  if (inWindowRounds.length >= 7) {
    const outlierThresholdSd = mean - 2.5 * sd;
    const outlierThreshold100 = mean - 100;
    const threshold = Math.max(outlierThresholdSd, outlierThreshold100);

    for (const r of inWindowRounds) {
      if (r.roundRating < threshold) {
        outlierKeys.add(`${r.date}|${r.roundRating}|${r.eventName}`);
      }
    }
  }

  const includedRounds = inWindowRounds.filter(
    (r) => !outlierKeys.has(`${r.date}|${r.roundRating}|${r.eventName}`)
  );

  // Step 4: double-weighting (>= 9 included rounds)
  const doubleWeightCount =
    includedRounds.length >= 9
      ? Math.ceil(includedRounds.length * 0.25)
      : 0;

  const doubleWeightKeys = new Set<string>();
  for (let i = 0; i < doubleWeightCount; i++) {
    doubleWeightKeys.add(
      `${includedRounds[i].date}|${includedRounds[i].roundRating}|${includedRounds[i].eventName}`
    );
  }

  // Step 5: calculate weighted average
  let weightedSum = 0;
  let totalWeight = 0;

  for (const r of includedRounds) {
    const key = `${r.date}|${r.roundRating}|${r.eventName}`;
    const w = doubleWeightKeys.has(key) ? 2 : 1;
    weightedSum += r.roundRating * w;
    totalWeight += w;
  }

  const calculatedRating =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const annotatedRounds: CalculatedRound[] = sorted.map((r) => {
    const key = `${r.date}|${r.roundRating}|${r.eventName}`;
    const inWindow = inWindowKeys.has(key);
    const isOutlier = outlierKeys.has(key);
    const isDoubleWeighted = doubleWeightKeys.has(key);
    const weight = !inWindow || isOutlier ? 0 : isDoubleWeighted ? 2 : 1;

    return {
      eventName: r.eventName,
      date: r.date,
      roundRating: r.roundRating,
      inWindow,
      isOutlier,
      isDoubleWeighted,
      isNew: r.isNew ?? false,
      weight,
    };
  });

  return {
    calculatedRating,
    roundsUsed: includedRounds.length,
    totalRoundsConsidered: sorted.length,
    rounds: annotatedRounds,
    windowMonths,
  };
}
