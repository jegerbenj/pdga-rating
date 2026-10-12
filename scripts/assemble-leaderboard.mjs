import fs from "fs";
import path from "path";
import zlib from "zlib";

const root = path.resolve(import.meta.dirname, "..");
const pagesDir = path.join(root, "data", "pages");
const outFile = path.join(root, "data", "leaderboard.json.gz");
const expectedPages = 7122;

const files = fs.existsSync(pagesDir)
  ? fs.readdirSync(pagesDir).filter((name) => name.endsWith(".json")).sort()
  : [];

const present = new Set(files.map((name) => Number(name.replace(".json", ""))));
let contiguous = 0;
while (present.has(contiguous)) contiguous += 1;

const byPdga = new Map();
for (let page = 0; page < contiguous; page += 1) {
  const rows = JSON.parse(
    fs.readFileSync(path.join(pagesDir, String(page).padStart(5, "0") + ".json"), "utf8")
  );
  for (const row of rows) {
    const [pdga, name, rating, gender, classification, division, country, state, events] = row;
    if (!Number.isFinite(pdga) || !Number.isFinite(rating)) continue;
    const existing = byPdga.get(pdga);
    const candidate = {
      pdga,
      name,
      rating,
      gender,
      classification,
      division,
      country,
      state: state || "",
      events: Number.isFinite(events) ? events : 0,
    };
    if (!existing || candidate.events > existing.events) byPdga.set(pdga, candidate);
  }
}

const players = [...byPdga.values()].sort((a, b) => {
  if (b.rating !== a.rating) return b.rating - a.rating;
  if (b.events !== a.events) return b.events - a.events;
  return a.pdga - b.pdga;
});

let rank = 1;
const packed = players.map((player, index) => {
  if (index > 0 && player.rating < players[index - 1].rating) rank = index + 1;
  return [
    player.pdga,
    player.name,
    player.rating,
    player.gender,
    player.classification,
    player.division,
    player.country,
    player.state,
    player.events,
    rank,
  ];
});

const payload = {
  updatedAt: new Date().toISOString(),
  sourceYear: 2026,
  complete: contiguous >= expectedPages,
  pages: contiguous,
  expectedPages,
  playerCount: packed.length,
  lowestRating: packed.length ? packed[packed.length - 1][2] : null,
  players: packed,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, zlib.gzipSync(JSON.stringify(payload)));
console.log(
  JSON.stringify(
    {
      file: outFile,
      bytes: fs.statSync(outFile).size,
      players: payload.playerCount,
      pages: payload.pages,
      complete: payload.complete,
      lowestRating: payload.lowestRating,
    },
    null,
    2
  )
);
