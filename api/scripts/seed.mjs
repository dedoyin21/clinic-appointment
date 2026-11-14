// Generates Tuesday/Thursday slots for two providers and loads them via POST /reset.
// Usage (Git Bash): URL=https://your-app.onrender.com KEY=your_key node scripts/seed.mjs

const URL_BASE = process.env.URL;
const KEY = process.env.KEY;
if (!URL_BASE || !KEY) {
  console.error("Set URL and KEY first.");
  process.exit(1);
}

const providers = [
  { name: "Dr Ade", code: "ade" },
  { name: "Dr Bola", code: "bola" },
];

// Times are UTC (Lagos is UTC+1, so 09:00Z shows as 10:00 in Lagos).
// The clinic runs Tue/Thu from 10:00 AM–4:00 PM WAT.
const times = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
];

const START = new Date("2026-11-16T00:00:00Z");
const END = new Date("2026-12-31T00:00:00Z"); // last day included

const addMinutes = (iso, m) =>
  new Date(new Date(iso).getTime() + m * 60000).toISOString().replace(".000Z", "Z");

const slots = [];
for (let d = new Date(START); d <= END; d.setUTCDate(d.getUTCDate() + 1)) {
  const day = d.getUTCDay();
  if (day !== 2 && day !== 4) continue; // only Tuesdays (2) and Thursdays (4)
  const date = d.toISOString().slice(0, 10);
  for (const p of providers) {
    for (const t of times) {
      const start = `${date}T${t}:00Z`;
      slots.push({
        id: `${date}-${p.code}-${t.replace(":", "")}`,
        provider: p.name,
        start,
        end: addMinutes(start, 30),
      });
    }
  }
}

const res = await fetch(`${URL_BASE}/reset`, {
  method: "POST",
  headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ slots }),
});
console.log(`Sent ${slots.length} slots -> ${res.status}`, await res.text());
