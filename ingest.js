// NASA EONET natural events (last 7 days, open and closed) → the app's eonet-events repo, one record per event id.
// One shot: fetch once, log each new or changed event, flush, exit. data/state.json keeps a hash per published
// event, so an unchanged event isn't published again; a changed one (new geometry, closed) replaces its record.
//   EONET_APP=https://….fangorn.network FANGORN_TOKEN=fgn_… node ingest.js
//   node ingest.js --dry          print what would be published (state untouched)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { logbook } from "@fangorn-network/logbook";

const REPO = "eonet-events";
const STATE = new URL("./data/state.json", import.meta.url).pathname;
const dry = process.argv.includes("--dry");

const url = new URL("https://eonet.gsfc.nasa.gov/api/v3/events");
url.searchParams.set("status", "all");
url.searchParams.set("days", process.env.EONET_DAYS ?? "7");
if (process.env.NASA_API_KEY) url.searchParams.set("api_key", process.env.NASA_API_KEY);

const res = await fetch(url, { headers: { "user-agent": "logbook" } });
if (!res.ok) throw new Error(`${url.origin}${url.pathname}: HTTP ${res.status}`);
const { events } = await res.json();

const seen = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const hash = (x) => createHash("sha256").update(JSON.stringify(x)).digest("base64url").slice(0, 16);
const changed = events.map((e) => [e, hash(e)]).filter(([e, h]) => seen[e.id] !== h);

if (dry) {
    for (const [e] of changed) console.log(JSON.stringify(e));
    console.error(`${changed.length} of ${events.length} events new or changed`);
    process.exit(0);
}

if (changed.length) {
    const lb = logbook({ app: process.env.EONET_APP, token: process.env.FANGORN_TOKEN, every: 0 });
    for (const [e] of changed) lb.log(REPO, e, { id: e.id, type: "event" });
    const out = await lb.close(); // throws on a failed publish, so the state below only records what landed
    for (const [e, h] of changed) seen[e.id] = h;
    mkdirSync(new URL("./data", import.meta.url).pathname, { recursive: true });
    writeFileSync(STATE, JSON.stringify(seen, null, 1) + "\n");
    console.log(`${new Date().toISOString()} published ${changed.length} of ${events.length} events ${JSON.stringify(out)}`);
} else {
    console.log(`${new Date().toISOString()} nothing new in ${events.length} events`);
}
