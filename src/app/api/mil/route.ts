import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NormalizedAircraft = {
  id: string;
  hex: string;
  callsign: string | null;
  reg: string | null;
  type: string | null;
  desc: string | null;
  lat: number | null;
  lon: number | null;
  alt_baro: number | "ground" | null;
  gs: number | null;
  track: number | null;
  squawk: string | null;
  category: string | null;
  seen_s: number | null;
  is_military: true;
  source: "airplanes.live";
};

// In-memory cache - shared with other routes
const cache = new Map<string, { ts: number; data: any; status: number }>();
const CACHE_TTL_MS = 3000; // 3 seconds for /mil endpoint to stay under rate limit

function normalizeAircraft(ac: any): NormalizedAircraft {
  const lat =
    typeof ac.lat === "number"
      ? ac.lat
      : typeof ac.lastPosition?.lat === "number"
      ? ac.lastPosition.lat
      : null;

  const lon =
    typeof ac.lon === "number"
      ? ac.lon
      : typeof ac.lastPosition?.lon === "number"
      ? ac.lastPosition.lon
      : null;

  const alt =
    typeof ac.alt_baro === "number" || ac.alt_baro === "ground"
      ? ac.alt_baro
      : null;

  const seen_s =
    typeof ac.seen === "number"
      ? ac.seen
      : typeof ac.lastPosition?.seen_pos === "number"
      ? ac.lastPosition.seen_pos
      : null;

  const hex = typeof ac.hex === "string" ? ac.hex.trim() : "";
  const id = hex || crypto.randomUUID();

  const callsign =
    typeof ac.flight === "string" ? ac.flight.trim() || null : null;

  return {
    id,
    hex: hex || id,
    callsign,
    reg: typeof ac.r === "string" ? ac.r.trim() || null : null,
    type: typeof ac.t === "string" ? ac.t.trim() || null : null,
    desc: typeof ac.desc === "string" ? ac.desc.trim() || null : null,
    lat,
    lon,
    alt_baro: alt,
    gs: typeof ac.gs === "number" ? ac.gs : null,
    track: typeof ac.track === "number" ? ac.track : null,
    squawk: typeof ac.squawk === "string" ? ac.squawk.trim() || null : null,
    category: typeof ac.category === "string" ? ac.category : null,
    seen_s,
    is_military: true, // All from /mil endpoint are military
    source: "airplanes.live",
  };
}

async function fetchWithCache(url: string, cacheKey: string) {
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.ts < CACHE_TTL_MS) {
    return hit;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "user-agent": "nato-watch/1.0 (non-commercial radar)",
    },
    cache: "no-store",
  });

  const status = res.status;
  let json: any = null;
  
  try {
    const text = await res.text();
    if (text.includes("rate limited")) {
      json = { msg: "Rate limited by upstream", ac: [], rate_limited: true };
    } else {
      json = JSON.parse(text);
    }
  } catch {
    json = { msg: "Invalid response from upstream", ac: [] };
  }

  const entry = { ts: now, data: json, status };
  cache.set(cacheKey, entry);
  return entry;
}

/**
 * GET /api/mil
 * Returns all military aircraft from airplanes.live /mil endpoint
 */
export async function GET() {
  const upstreamUrl = "https://api.airplanes.live/v2/mil";
  const cacheKey = "mil:all";

  try {
    const { data, status } = await fetchWithCache(upstreamUrl, cacheKey);

    const ac = Array.isArray(data.ac) ? data.ac : [];
    const normalized = ac
      .map(normalizeAircraft)
      .filter((p) => typeof p.lat === "number" && typeof p.lon === "number");

    return NextResponse.json(
      {
        ok: status >= 200 && status < 300 && !data.rate_limited,
        source: "airplanes.live",
        endpoint: "/mil",
        now: data.now ?? Date.now(),
        total: normalized.length,
        aircraft: normalized,
        upstream_msg: data.msg ?? null,
        rate_limited: data.rate_limited ?? false,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch military aircraft data",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
