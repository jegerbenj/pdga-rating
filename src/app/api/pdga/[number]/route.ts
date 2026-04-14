import { NextResponse } from "next/server";
import { fetchPlayerData } from "@/lib/fetcher";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const pdgaNumber = parseInt(number, 10);

  if (isNaN(pdgaNumber) || pdgaNumber <= 0) {
    return NextResponse.json(
      { error: "Invalid PDGA number. Please provide a positive integer." },
      { status: 400 }
    );
  }

  try {
    const data = await fetchPlayerData(pdgaNumber);
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch player data.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
