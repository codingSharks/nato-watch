import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AirplanesLiveResponse = {
  ac?: any[];
  msg?: string;
  now?: number;
  total?: number;
};

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
  is_military: boolean;
  source: "airplanes.live";
};

// In-memory cache
const cache = new Map<string, { ts: number; data: any; status: number }>();
const CACHE_TTL_MS = 1500;

function clampNumber(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function toFloat(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Military detection heuristics
const MILITARY_PREFIXES = [
  'RRR', 'RCH', 'DUKE', 'REACH', 'EVAC', 'JAKE', 'KING', 'TEAL', 'DARK',
  'DOOM', 'VIPER', 'HAWK', 'EAGLE', 'COBRA', 'MAGIC', 'NATO', 'GAF', 'BAF',
  'FAF', 'IAM', 'AMI', 'RFR', 'CTM', 'MMF', 'HRZ', 'PLF', 'SWF', 'NOR',
  'DAF', 'USAF', 'USN', 'USMC', 'ARMY', 'NAVY', 'MARS', 'GUARD', 'AF',
];

const MILITARY_TYPES = [
  'F16', 'F15', 'F18', 'F35', 'F22', 'A10', 'B52', 'B1', 'B2',
  'C17', 'C130', 'C5', 'KC135', 'KC10', 'KC46', 'E3', 'E8', 'P8', 'P3',
  'RC135', 'U2', 'RQ4', 'MQ9', 'MQ1', 'EUFI', 'TYPHOON', 'RAFALE', 'TORNADO',
  'GRIPEN', 'NH90', 'CH47', 'CH53', 'UH60', 'AH64', 'V22', 'HAWK', 'A400',
  'A330MRTT', 'A310MRTT', 'E7', 'GLOBALHAWK', 'BLACKHAWK', 'APACHE', 'CHINOOK',
];

function isMilitary(ac: any): boolean {
  const callsign = typeof ac.flight === 'string' ? ac.flight.trim().toUpperCase() : '';
  const type = typeof ac.t === 'string' ? ac.t.toUpperCase() : '';
  const desc = typeof ac.desc === 'string' ? ac.desc.toUpperCase() : '';
  const category = typeof ac.category === 'string' ? ac.category : '';
  
  // Check callsign prefixes
  if (callsign && MILITARY_PREFIXES.some(p => callsign.startsWith(p))) {
    return true;
  }
  
  // Check aircraft type
  if (type && MILITARY_TYPES.some(t => type.includes(t))) {
    return true;
  }
  
  // Check description
  if (desc && (desc.includes('MILITARY') || desc.includes('TANKER') || desc.includes('FIGHTER') || desc.includes('BOMBER'))) {
    return true;
  }
  
  // Category A5 = Large Heavy Military
  if (category === 'A5') {
    return true;
  }
  
  return false;
}

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
    is_military: isMilitary(ac),
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
    // Check if it's a rate limit text response
    if (text.includes("rate limited")) {
      json = { msg: "Rate limited by upstream", ac: [], rate_limited: true };
    } else {
      json = JSON.parse(text);
    }
  } catch {
    json = { msg: "Invalid JSON from upstream", ac: [] };
  }

  const entry = { ts: now, data: json, status };
  cache.set(cacheKey, entry);
  return entry;
}

/**
 * GET /api/airspace?lat=52.52&lon=13.405&r_nm=250
 * r_nm = nautical miles (max 250)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = toFloat(searchParams.get("lat")) ?? 52.5200;
  const lon = toFloat(searchParams.get("lon")) ?? 13.4050;
  const r_nm_raw = toFloat(searchParams.get("r_nm")) ?? 250;

  const r_nm = clampNumber(r_nm_raw, 1, 250);

  const upstreamUrl = `https://api.airplanes.live/v2/point/${lat}/${lon}/${r_nm}`;
  const cacheKey = `point:${lat.toFixed(4)}:${lon.toFixed(4)}:${r_nm}`;

  try {
    const { data, status } = await fetchWithCache(upstreamUrl, cacheKey);

    const payload = data as AirplanesLiveResponse;
    const ac = Array.isArray(payload.ac) ? payload.ac : [];
    const normalized = ac
      .map(normalizeAircraft)
      .filter((p) => typeof p.lat === "number" && typeof p.lon === "number");

    return NextResponse.json(
      {
        ok: status >= 200 && status < 300,
        source: "airplanes.live",
        radius_nm: r_nm,
        radius_km: Math.round(r_nm * 1.852),
        now: payload.now ?? Date.now(),
        total: payload.total ?? normalized.length,
        aircraft: normalized,
        military_count: normalized.filter(a => a.is_military).length,
        upstream_msg: payload.msg ?? null,
        rate_limit_note: "Upstream is rate-limited; this endpoint caches briefly.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch airspace data",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
