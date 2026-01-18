"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

export type AirspaceAircraft = {
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

export type AirspaceResponse = {
  ok: boolean;
  source: string;
  radius_nm?: number;
  radius_km?: number;
  now: number;
  total: number;
  aircraft: AirspaceAircraft[];
  military_count?: number;
  upstream_msg: string | null;
  rate_limited?: boolean;
};

export type AirspaceStatus =
  | "idle"
  | "loading"
  | "quiet"
  | "tracking"
  | "degraded"
  | "offline";

/**
 * Hook to fetch airspace data from airplanes.live
 * 
 * @param opts.mode - "mil" for military only (worldwide), "point" for radius search
 * @param opts.lat - Latitude for point search (default: Berlin 52.52)
 * @param opts.lon - Longitude for point search (default: Berlin 13.405)
 * @param opts.radiusNm - Radius in nautical miles (max 250, default: 250)
 * @param opts.pollMs - Polling interval (default: 2500ms to stay under rate limit)
 * @param opts.enabled - Enable/disable polling
 */
export function useAirspace(opts?: {
  mode?: "mil" | "point";
  lat?: number;
  lon?: number;
  radiusNm?: number;
  pollMs?: number;
  enabled?: boolean;
}) {
  const mode = opts?.mode ?? "mil"; // Default to military endpoint
  const lat = opts?.lat ?? 52.52;
  const lon = opts?.lon ?? 13.405;
  const radiusNm = opts?.radiusNm ?? 250;
  const pollMs = opts?.pollMs ?? 2500; // 2.5s to stay safely under 1req/sec
  const enabled = opts?.enabled ?? true;

  const [data, setData] = useState<AirspaceResponse | null>(null);
  const [status, setStatus] = useState<AirspaceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const timerRef = useRef<number | null>(null);
  const abortedRef = useRef(false);

  const query = useMemo(() => {
    if (mode === "mil") {
      return `/api/mil`;
    }
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      r_nm: String(radiusNm),
    });
    return `/api/airspace?${params.toString()}`;
  }, [mode, lat, lon, radiusNm]);

  const tick = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setError(null);
      setStatus((s) => (s === "idle" ? "loading" : s));

      const res = await fetch(query, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as AirspaceResponse;
      setData(json);
      setLastUpdate(new Date().toISOString().slice(11, 19) + " UTC");

      if (!json.ok || json.rate_limited) {
        setStatus("degraded");
        setError(json.rate_limited ? "Rate limited - waiting..." : null);
        return;
      }

      const count = Array.isArray(json.aircraft) ? json.aircraft.length : 0;
      setStatus(count > 0 ? "tracking" : "quiet");
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setStatus("offline");
    }
  }, [query, enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    abortedRef.current = false;

    // Immediate first fetch
    tick();

    // Polling
    timerRef.current = window.setInterval(() => {
      if (!abortedRef.current) tick();
    }, pollMs);

    return () => {
      abortedRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [tick, pollMs, enabled]);

  return {
    data,
    status,
    error,
    lastUpdate,
    refetch: tick,
  };
}
