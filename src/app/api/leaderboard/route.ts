import { NextResponse } from "next/server";
import { loadLeaderboard, lookupPlayer, queryLeaderboard, type LeaderboardSort } from "@/lib/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTS = new Set<LeaderboardSort>(["rank", "rating", "name", "country", "events", "division"]);

function numberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  try {
    loadLeaderboard();
  } catch {
    return NextResponse.json(
      { error: "Leaderboard snapshot is not ready yet." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pdga = numberParam(searchParams.get("pdga"));
  if (pdga && pdga > 0 && !searchParams.has("page") && !searchParams.has("ids")) {
    return NextResponse.json(lookupPlayer(Math.round(pdga)));
  }

  const ids = searchParams.get("ids");
  const sortParam = searchParams.get("sort");
  const sort = sortParam && SORTS.has(sortParam as LeaderboardSort) ? (sortParam as LeaderboardSort) : undefined;
  const dir = searchParams.get("dir") === "desc" ? "desc" : searchParams.get("dir") === "asc" ? "asc" : undefined;

  const result = queryLeaderboard({
    q: searchParams.get("q") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    continent: searchParams.get("continent") ?? undefined,
    gender: searchParams.get("gender") ?? undefined,
    classification: searchParams.get("class") ?? undefined,
    division: searchParams.get("division") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    minRating: numberParam(searchParams.get("min")),
    maxRating: numberParam(searchParams.get("max")),
    minEvents: numberParam(searchParams.get("minEvents")),
    sort,
    dir,
    page: numberParam(searchParams.get("page")),
    pageSize: numberParam(searchParams.get("pageSize")),
    highlight: numberParam(searchParams.get("highlight")),
    ids: ids
      ? ids
          .split(",")
          .map((part) => Number(part))
          .filter((id) => Number.isInteger(id) && id > 0)
          .slice(0, 100)
      : undefined,
  });

  return NextResponse.json(result);
}
