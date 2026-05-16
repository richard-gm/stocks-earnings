// npx tsx scripts/inspect-occ.ts
// Prints the first 20 lines of an OCC daily open interest CSV
// so we can confirm the exact column names before writing the parser.

async function main() {
  const date = "04/22/2026"; // recent weekday — change if needed
  const url = `https://marketdata.theocc.com/daily-open-interest?reportDate=${date}&action=download&format=csv`;

  console.log("Fetching:", url);
  const res = await fetch(url);
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  const lines = text.split("\n");
  console.log(`\nTotal lines: ${lines.length}\n`);
  console.log("=== First 20 lines ===");
  lines.slice(0, 20).forEach((l, i) => console.log(`${String(i).padStart(2)}: ${l}`));

  // Also show lines near a well-known ticker to see the data format
  const googlIdx = lines.findIndex((l) => l.includes("GOOG") || l.includes("AAPL"));
  if (googlIdx > 0) {
    console.log(`\n=== Lines around first GOOG/AAPL match (index ${googlIdx}) ===`);
    lines.slice(Math.max(0, googlIdx - 1), googlIdx + 5).forEach((l, i) =>
      console.log(`${String(googlIdx - 1 + i).padStart(2)}: ${l}`)
    );
  }
}

main().catch(console.error);
