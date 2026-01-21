import { NextRequest, NextResponse } from 'next/server';
import { REGION_BOUNDS } from '@/lib/regions';
import { isLoitering } from '@/lib/aircraft-utils';

// Cache for 30 seconds
export const runtime = 'edge';
export const revalidate = 30;

interface ADSBExchangeAircraft {
  hex: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number;
  gs?: number;
  track?: number;
  baro_rate?: number;
  mil?: boolean;
}

interface OpenSkyState {
  0: string;  // icao24
  1: string;  // callsign
  2: string;  // origin_country
  3: number;  // time_position
  4: number;  // last_contact
  5: number;  // longitude
  6: number;  // latitude
  7: number;  // baro_altitude
  8: boolean; // on_ground
  9: number;  // velocity
  10: number; // true_track
  11: number; // vertical_rate
  12: number[]; // sensors
  13: number; // geo_altitude
  14: string; // squawk
  15: boolean; // spi
  16: number; // position_source
}

async function fetchADSBExchange(bbox: number[]) {
  const apiKey = process.env.ADSBX_KEY;
  if (!apiKey) {
    console.error('ADS-B Exchange API KEY fehlt!');
    return { error: 'ADSBX_KEY missing' };
  }
  try {
    const response = await fetch(
      `https://adsbexchange-com1.p.rapidapi.com/v2/lat/${bbox[1]}/lon/${bbox[0]}/dist/1000/`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
        },
        next: { revalidate: 30 }
      }
    );
    if (!response.ok) {
      console.error('ADS-B Exchange API HTTP Error:', response.status);
      return { error: `ADSBX HTTP ${response.status}` };
    }
    const data = await response.json();
    if (data?.ac) {
      return data.ac.map((aircraft: ADSBExchangeAircraft) => ({
        icao: aircraft.hex,
        callsign: aircraft.flight?.trim() || undefined,
        latitude: aircraft.lat,
        longitude: aircraft.lon,
        altitude: aircraft.alt_baro,
        ground_speed: aircraft.gs,
        track: aircraft.track,
        vertical_rate: aircraft.baro_rate,
        is_military: aircraft.mil || false,
        source: 'ADS-B Exchange',
        timestamp: new Date().toISOString()
      })).filter((a: any) => a.latitude && a.longitude);
    }
    return { error: 'ADSBX: No aircraft data' };
  } catch (error) {
    console.error('ADS-B Exchange API error:', error);
    return { error: 'ADSBX Exception: ' + (error?.message || String(error)) };
  }
}

async function fetchOpenSky(bbox: number[]) {
  try {
    const auth = process.env.OSKY_USER && process.env.OSKY_PASS 
      ? btoa(`${process.env.OSKY_USER}:${process.env.OSKY_PASS}`)
      : undefined;
      
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (auth) {
      headers['Authorization'] = `Basic ${auth}`;
    }
    
    const url = new URL('https://opensky-network.org/api/states/all');
    url.searchParams.set('lamin', bbox[1].toString());
    url.searchParams.set('lomin', bbox[0].toString());
    url.searchParams.set('lamax', bbox[3].toString());
    url.searchParams.set('lomax', bbox[2].toString());
    
    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: 30 }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (data?.states) {
      return data.states.map((state: OpenSkyState) => ({
        icao: state[0],
        callsign: state[1]?.trim() || undefined,
        latitude: state[6],
        longitude: state[5],
        altitude: state[7] ? Math.round(state[7] * 3.28084) : undefined,
        ground_speed: state[9] ? Math.round(state[9] * 1.94384) : undefined,
        track: state[10],
        vertical_rate: state[11] ? Math.round(state[11] * 196.85) : undefined,
        is_military: false,
        source: 'OpenSky Network',
        timestamp: new Date().toISOString()
      })).filter((a: any) => a.latitude && a.longitude);
    }
    return [];
  } catch (error) {
    console.error('OpenSky API error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'WORLD';
    const source = searchParams.get('source') || 'auto';
    const filter = searchParams.get('filter') || 'all';
    const customBbox = searchParams.get('bbox');
    
    let bbox: number[];
    
    // Verwende custom bbox wenn vorhanden, sonst aus REGION_BOUNDS
    if (customBbox) {
      bbox = customBbox.split(',').map(Number);
    } else if (REGION_BOUNDS[region as keyof typeof REGION_BOUNDS]) {
      bbox = REGION_BOUNDS[region as keyof typeof REGION_BOUNDS];
    } else {
      // Fallback: World bounds
      bbox = [-180, -90, 180, 90];
    }
    
    let aircraft: any[] = [];
    
    // Try ADS-B Exchange first, fallback to OpenSky
    let adsbxResult: any = null;
    if (source === 'auto' || source === 'adsbx') {
      adsbxResult = await fetchADSBExchange(bbox);
      if (Array.isArray(adsbxResult)) {
        aircraft = adsbxResult;
      } else if (adsbxResult && adsbxResult.error) {
        // Fehler-Objekt von ADSBX
        return NextResponse.json({ error: adsbxResult.error, aircraft: [], meta: { region, total: 0, loitering: 0, timestamp: new Date().toISOString() } }, { status: 500 });
      }
    }
    if (!aircraft || aircraft.length === 0) {
      aircraft = await fetchOpenSky(bbox);
    }
    
    // Add loitering detection
    aircraft.forEach(ac => {
      ac.loitering = isLoitering(ac);
    });
    
    // Apply NATO filtering
    if (filter === 'nato') {
      const { isNATOCallsign } = await import('@/lib/aircraft-utils');
      aircraft = aircraft.filter(a => 
        isNATOCallsign(a.callsign) || a.is_military
      );
    }
    
    const totalCount = aircraft.length;
    const loiteringCount = aircraft.filter(a => a.loitering).length;
    
    return NextResponse.json({
      aircraft,
      meta: {
        region,
        total: totalCount,
        loitering: loiteringCount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}