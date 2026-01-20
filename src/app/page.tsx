'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAirspace, type AirspaceAircraft, type AirspaceStatus } from './hooks/useAirspace';

// Inline keyframes for animations
const animationStyles = `
  @keyframes radarSweep {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes scannerMove {
    0% { left: -30%; }
    100% { left: 100%; }
  }
  @keyframes fadeInOut {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes subtlePulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  @keyframes slowFade {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
`;

// Theme definitions
interface Theme {
  name: string;
  primary: string;
  primaryDim: string;
  secondary: string;
  danger: string;
  warning: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  border: string;
  borderDim: string;
  glow: string;
  glowDanger: string;
}

const THEMES: Record<string, Theme> = {
  military: {
    name: 'MILITARY',
    primary: '#00ff41',
    primaryDim: '#00aa2a',
    secondary: '#00ff41',
    danger: '#ff3333',
    warning: '#ffcc00',
    background: '#0a0f0a',
    backgroundAlt: '#0d1a0d',
    surface: 'rgba(0,20,0,0.8)',
    border: '#1a3a1a',
    borderDim: '#0d1a0d',
    glow: 'rgba(0,255,65,0.3)',
    glowDanger: 'rgba(255,51,51,0.3)',
  },
  cyber: {
    name: 'CYBER',
    primary: '#00f0ff',
    primaryDim: '#0099aa',
    secondary: '#ff00ff',
    danger: '#ff0066',
    warning: '#ffaa00',
    background: '#0a0a12',
    backgroundAlt: '#0d0d1a',
    surface: 'rgba(10,10,25,0.9)',
    border: '#1a1a3a',
    borderDim: '#0d0d1a',
    glow: 'rgba(0,240,255,0.3)',
    glowDanger: 'rgba(255,0,102,0.3)',
  },
};

// UI Strings - English
const UI_EN = {
  // Primary statuses
  AIRSPACE_QUIET: 'AIRSPACE QUIET',
  CONTACT_DETECTED: 'CONTACT DETECTED',
  TRACKING_ACTIVE: 'TRACKING ACTIVE',
  SIGNAL_DEGRADED: 'SIGNAL DEGRADED',
  RADAR_ONLINE: 'RADAR ONLINE',
  RADAR_OFFLINE: 'RADAR OFFLINE',
  // Rotating sublines
  SUB_LISTENING: 'Listening for transponders…',
  SUB_SWEEPING: 'Sweeping airspace…',
  SUB_SYNCING: 'Syncing ADS-B data…',
  SUB_RECONNECTING: 'Reconnecting…',
  SUB_SWITCHING: 'Switching source…',
  // Labels
  LABEL_OPENSKY: 'OpenSky',
  LABEL_ADSB: 'ADS-B',
  LABEL_SYSTEMS: 'Radar systems',
  LABEL_LAST_SCAN: 'Last scan',
  LABEL_CONTACTS: 'Contacts',
  // Values
  VALUE_ONLINE: 'online',
  VALUE_WAITING: 'waiting',
  VALUE_LIVE: 'live',
  VALUE_DEGRADED: 'degraded',
  VALUE_OFFLINE: 'offline',
  // Contacts
  CONTACTS_NONE: 'No military aircraft detected',
  CONTACTS_SOME: (n: number) => `${n} military aircraft tracked globally`,
  // Buttons
  BTN_RETRY: 'RETRY NOW',
  BTN_ALERT_ARM: 'ALERT ON CONTACT',
  BTN_ALERT_ARMED: 'ALERT ARMED',
  BTN_ALERT_DISARM: 'DISARM',
  // Alert helper
  ALERT_HELP_IDLE: 'Notify me when a new contact appears.',
  ALERT_HELP_ARMED: 'Armed. Waiting for first contact.',
  // YOUR SIGNAL
  SIGNAL_TITLE: 'YOUR SIGNAL',
  SIGNAL_SUBTITLE: 'Live readout. Nothing is stored.',
  SIGNAL_NETWORK: 'NETWORK',
  SIGNAL_CLIENT: 'CLIENT',
  SIGNAL_SESSION: 'SESSION',
  SIGNAL_IP: 'IP',
  SIGNAL_LOC: 'LOCATION',
  SIGNAL_BROWSER: 'BROWSER',
  SIGNAL_OS: 'OS',
  SIGNAL_VIEW: 'VIEWPORT',
  SIGNAL_TZ: 'TIMEZONE',
  SIGNAL_LANG: 'LANGUAGE',
  SIGNAL_SIG: 'SESSION SIG',
  SIGNAL_TTL: 'Volatile (resets on refresh)',
  // Privacy
  PRIVACY_NOTE: 'IP masked. Location coarse (city-level). No tracking. No storage.',
};

// UI Strings - Deutsch
const UI_DE = {
  AIRSPACE_QUIET: 'LUFTRAUM RUHIG',
  CONTACT_DETECTED: 'KONTAKT ERKANNT',
  TRACKING_ACTIVE: 'TRACKING AKTIV',
  SIGNAL_DEGRADED: 'SIGNAL GESTÖRT',
  RADAR_ONLINE: 'RADAR ONLINE',
  RADAR_OFFLINE: 'RADAR OFFLINE',
  SUB_LISTENING: 'Hört auf Transponder…',
  SUB_SWEEPING: 'Durchsucht Luftraum…',
  SUB_SYNCING: 'Synchronisiert ADS-B…',
  SUB_RECONNECTING: 'Verbindet neu…',
  SUB_SWITCHING: 'Wechselt Quelle…',
  LABEL_OPENSKY: 'OpenSky',
  LABEL_ADSB: 'ADS-B',
  LABEL_SYSTEMS: 'Radar-Systeme',
  LABEL_LAST_SCAN: 'Letzter Scan',
  LABEL_CONTACTS: 'Kontakte',
  VALUE_ONLINE: 'online',
  VALUE_WAITING: 'wartet',
  VALUE_LIVE: 'live',
  VALUE_DEGRADED: 'eingeschränkt',
  VALUE_OFFLINE: 'offline',
  CONTACTS_NONE: 'Keine Militärflugzeuge erkannt',
  CONTACTS_SOME: (n: number) => `${n} Militärflugzeuge weltweit erfasst`,
  BTN_RETRY: 'JETZT NEU VERSUCHEN',
  BTN_ALERT_ARM: 'ALARM BEI KONTAKT',
  BTN_ALERT_ARMED: 'ALARM AKTIV',
  BTN_ALERT_DISARM: 'DEAKTIVIEREN',
  ALERT_HELP_IDLE: 'Benachrichtigt bei neuem Kontakt.',
  ALERT_HELP_ARMED: 'Aktiv. Wartet auf ersten Kontakt.',
  SIGNAL_TITLE: 'DEIN SIGNAL',
  SIGNAL_SUBTITLE: 'Live-Anzeige. Nichts wird gespeichert.',
  SIGNAL_NETWORK: 'NETZ',
  SIGNAL_CLIENT: 'CLIENT',
  SIGNAL_SESSION: 'SESSION',
  SIGNAL_IP: 'IP',
  SIGNAL_LOC: 'ORT',
  SIGNAL_BROWSER: 'BROWSER',
  SIGNAL_OS: 'OS',
  SIGNAL_VIEW: 'ANZEIGE',
  SIGNAL_TZ: 'ZEITZONE',
  SIGNAL_LANG: 'SPRACHE',
  SIGNAL_SIG: 'SESSION-SIG',
  SIGNAL_TTL: 'Flüchtig (Reset beim Refresh)',
  PRIVACY_NOTE: 'IP maskiert. Standort nur grob (Stadt-Level). Kein Tracking. Keine Speicherung.',
};

// Rotating status messages for quiet state
const LISTENING_MESSAGES_EN = [
  UI_EN.SUB_LISTENING,
  UI_EN.SUB_SWEEPING,
  UI_EN.SUB_SYNCING,
];

const LISTENING_MESSAGES_DE = [
  UI_DE.SUB_LISTENING,
  UI_DE.SUB_SWEEPING,
  UI_DE.SUB_SYNCING,
];

const SCAN_RADIUS_KM = 500;

// Generate session signature (random, non-identifying)
const generateSessionSig = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Mask IP address
const maskIP = (ip: string) => {
  if (!ip) return '•••.•••.•••.•••';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.•••.•••`;
  }
  // IPv6
  return ip.slice(0, 8) + '••••••••';
};

// Parse basic browser/OS info from UA
const parseUA = (ua: string) => {
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
  
  return { browser, os };
};

// Aircraft interface - compatible with both old and new API
interface Aircraft {
  id: string;
  hex: string;
  latitude: number;
  longitude: number;
  track?: number | null;
  is_military?: boolean;
  callsign?: string | null;
  altitude?: number | null;
  ground_speed?: number | null;
  type?: string | null;
  reg?: string | null;
}

interface MapRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  bbox: [number, number, number, number];
  status?: 'critical' | 'high' | 'elevated';
}

const WORLD: MapRegion = { id: 'world', name: 'GLOBAL SURVEILLANCE', lat: 20, lng: 0, zoom: 2, bbox: [-180, -60, 180, 80] };

const REGIONS: MapRegion[] = [
  { id: 'europe', name: 'SECTOR: EUROPA', lat: 52, lng: 10, zoom: 4, bbox: [-15, 35, 45, 72] },
  { id: 'northamerica', name: 'SECTOR: NORDAMERIKA', lat: 45, lng: -100, zoom: 3, bbox: [-170, 15, -50, 75] },
  { id: 'asia', name: 'SECTOR: ASIEN-PAZIFIK', lat: 35, lng: 105, zoom: 3, bbox: [60, 5, 150, 55] },
  { id: 'russia', name: 'SECTOR: RUSSLAND', lat: 62, lng: 100, zoom: 3, bbox: [30, 45, 180, 75] },
];

const HOTSPOTS: MapRegion[] = [
  { id: 'ukraine', name: 'UKRAINE FRONT', lat: 49, lng: 32, zoom: 6, bbox: [22, 44, 42, 53], status: 'critical' },
  { id: 'baltic', name: 'BALTIC OPS', lat: 57, lng: 24, zoom: 5, bbox: [10, 53, 32, 62], status: 'high' },
  { id: 'blacksea', name: 'BLACK SEA', lat: 43, lng: 35, zoom: 6, bbox: [27, 40, 42, 47], status: 'high' },
  { id: 'taiwan', name: 'TAIWAN STRAIT', lat: 24, lng: 121, zoom: 6, bbox: [115, 20, 130, 28], status: 'elevated' },
  { id: 'gulf', name: 'PERSIAN GULF', lat: 27, lng: 52, zoom: 5, bbox: [44, 22, 62, 32], status: 'elevated' },
  { id: 'redsea', name: 'RED SEA OPS', lat: 18, lng: 40, zoom: 5, bbox: [32, 10, 50, 25], status: 'high' },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#ff3333', label: 'KRITISCH' },
  high: { color: '#ff6600', label: 'HOCH' },
  elevated: { color: '#ffcc00', label: 'ERHÖHT' },
};

function MapCard({ region, aircraft, height, onClick, isMain, theme }: { region: MapRegion; aircraft: Aircraft[]; height: string; onClick?: () => void; isMain?: boolean; theme: Theme }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const initRef = useRef(false);

  const [west, south, east, north] = region.bbox;
  const filtered = aircraft.filter(a =>
    a.latitude >= south && a.latitude <= north &&
    a.longitude >= west && a.longitude <= east
  );
  const milCount = filtered.filter(a => a.is_military).length;

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [region.lat, region.lng],
        zoom: region.zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Theme-based tiles (military: dark, cyber: dark blue)
      L.tileLayer(
        theme.name === 'CYBER'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 18,
        }
      ).addTo(map);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    };

    loadMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, [region.id, region.lat, region.lng, region.zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      filtered.forEach(ac => {
        const isMil = ac.is_military;
        // Theme colors
        const color = isMil ? theme.danger : theme.primary;
        const size = isMil ? 16 : 10;
        const label = ac.callsign || ac.type || ac.reg || '';
        const showLabel = isMil && label;
        const icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${ac.track || 0}deg);filter:drop-shadow(0 0 4px ${color})">
              <path d="M12 2L8 10H4L2 14H8L10 22H14L16 14H22L20 10H16L12 2Z" fill="${color}"/>
            </svg>
            ${showLabel ? `<span style="
              position:absolute;
              top:${size + 2}px;
              left:50%;
              transform:translateX(-50%);
              font-size:9px;
              font-weight:600;
              color:${color};
              text-shadow:0 0 4px rgba(0,0,0,0.9), 0 0 2px #000;
              white-space:nowrap;
              pointer-events:none;
              letter-spacing:0.5px;
            ">${label}</span>` : ''}
          </div>`,
          iconSize: [size, showLabel ? size + 14 : size],
          iconAnchor: [size / 2, size / 2],
        });
        L.marker([ac.latitude, ac.longitude], { icon }).addTo(map);
      });
    };

    updateMarkers();
  }, [filtered]);

  const statusConf = region.status ? STATUS_CONFIG[region.status] : null;
  const isClickable = !!onClick && !isMain;

  return (
    <div 
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg, #0d1a0d 0%, #0a0f0a 100%)',
        borderRadius: '4px',
        overflow: 'hidden',
        border: isMain ? '2px solid #00ff41' : '1px solid #1a3a1a',
        boxShadow: region.status === 'critical' 
          ? '0 0 20px rgba(255,51,51,0.3)' 
          : isMain 
            ? '0 0 30px rgba(0,255,65,0.3)' 
            : '0 0 10px rgba(0,255,65,0.1)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        transform: isClickable ? 'scale(1)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.borderColor = '#00ff41';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = '#1a3a1a';
        }
      }}
    >
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #1a3a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,20,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusConf && (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusConf.color,
              boxShadow: `0 0 8px ${statusConf.color}`,
              animation: region.status === 'critical' ? 'pulse 1s infinite' : 'none',
            }} />
          )}
          <span style={{ 
            fontWeight: 600, 
            fontSize: isMain ? '14px' : '11px', 
            color: '#00ff41',
            letterSpacing: '1px',
          }}>{region.name}</span>
          {isClickable && (
            <span style={{ fontSize: '10px', color: '#00aa2a', opacity: 0.7 }}>
              [CLICK TO FOCUS]
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: '#00aa2a' }}>{filtered.length} TGT</span>
          {milCount > 0 && (
            <span style={{ 
              color: '#ff3333', 
              fontWeight: 600,
              textShadow: '0 0 8px rgba(255,51,51,0.5)',
            }}>
              ⚠ {milCount} MIL
            </span>
          )}
        </div>
      </div>
      
      {/* Map */}
      <div style={{ position: 'relative' }}>
        <div ref={containerRef} style={{ height, width: '100%', background: '#0a0f0a' }} />
        {/* Corner decorations */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 12, height: 12, borderLeft: '2px solid #00ff41', borderTop: '2px solid #00ff41', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderRight: '2px solid #00ff41', borderTop: '2px solid #00ff41', opacity: 0.5 }} />
        <div style={{ position: 'absolute', bottom: 4, left: 4, width: 12, height: 12, borderLeft: '2px solid #00ff41', borderBottom: '2px solid #00ff41', opacity: 0.5 }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRight: '2px solid #00ff41', borderBottom: '2px solid #00ff41', opacity: 0.5 }} />
      </div>
    </div>
  );
}

function LiveFeed({ aircraft, theme }: { aircraft: Aircraft[]; theme: Theme }) {
  const military = aircraft.filter(a => a.is_military).slice(0, 8);
  
  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: '4px',
      padding: '12px',
      fontSize: '11px',
    }}>
      <div style={{ 
        color: theme.danger, 
        fontWeight: 600, 
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ animation: 'blink 1s infinite' }}>●</span>
        MILITARY TRAFFIC FEED
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {military.length === 0 ? (
          <div style={{ color: theme.primaryDim }}>NO MILITARY CONTACTS</div>
        ) : (
          military.map((ac, i) => (
            <div key={ac.id || ac.hex || i} style={{ 
              color: theme.primary, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: `1px solid ${theme.borderDim}`,
              gap: '8px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                  {ac.callsign || ac.hex || ac.id}
                </span>
                {(ac.type || ac.reg) && (
                  <span style={{ fontSize: '9px', color: theme.primaryDim, opacity: 0.8 }}>
                    {[ac.type, ac.reg].filter(Boolean).join(' • ')}
                  </span>
                )}
              </div>
              <span style={{ color: theme.primaryDim, fontSize: '10px', whiteSpace: 'nowrap' }}>
                {ac.altitude ? `FL${Math.round(ac.altitude/100)}` : '---'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [time, setTime] = useState('');
  const [focusedRegion, setFocusedRegion] = useState<MapRegion>(WORLD);
  const [filter, setFilter] = useState<'all' | 'military' | 'civilian'>('all');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [listeningMsgIndex, setListeningMsgIndex] = useState(0);
  const [lang, setLang] = useState<'en' | 'de'>('en');
  const [theme, setTheme] = useState<'military' | 'cyber'>('military');
  const [showSignal, setShowSignal] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionSig] = useState(() => generateSessionSig());
  const [clientInfo, setClientInfo] = useState<{
    ip: string;
    location: string;
    browser: string;
    os: string;
    viewport: string;
    timezone: string;
    language: string;
  } | null>(null);
  const hasPlayedSound = useRef(false);
  const initialLoadDone = useRef(false);
  
  const UI = lang === 'de' ? UI_DE : UI_EN;
  const LISTENING_MESSAGES = lang === 'de' ? LISTENING_MESSAGES_DE : LISTENING_MESSAGES_EN;
  const T = THEMES[theme]; // Current theme colors

  // Use the Airplanes.live /mil endpoint - returns ALL military aircraft worldwide
  const { data: airspaceData, status: airspaceStatus, error: airspaceError, lastUpdate, refetch } = useAirspace({
    mode: 'mil', // Use military-only endpoint for global coverage
    pollMs: 2500, // 2.5s polling to stay safely under rate limit
    enabled: isClient,
  });

  // Convert airspace data to Aircraft format for compatibility
  const aircraft: Aircraft[] = (airspaceData?.aircraft || []).map(ac => ({
    id: ac.id,
    hex: ac.hex,
    latitude: ac.lat ?? 0,
    longitude: ac.lon ?? 0,
    track: ac.track,
    is_military: ac.is_military,
    callsign: ac.callsign,
    altitude: typeof ac.alt_baro === 'number' ? ac.alt_baro : null,
    ground_speed: ac.gs,
    type: ac.type,
    reg: ac.reg,
  })).filter(ac => ac.latitude !== 0 && ac.longitude !== 0);

  const lastScanTime = lastUpdate || '--:--:-- UTC';
  // For /mil endpoint, there's no radius - we're tracking globally
  const radiusKm = airspaceData?.radius_km ?? 0; // 0 means global

  // Fetch client info for YOUR SIGNAL module
  useEffect(() => {
    if (!isClient) return;
    
    const ua = navigator.userAgent;
    const { browser, os } = parseUA(ua);
    
    setClientInfo({
      ip: '', // Will be fetched from API
      location: 'Detecting…',
      browser,
      os,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    });
    
    // Fetch IP info (using free API, no storage)
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        setClientInfo(prev => prev ? {
          ...prev,
          ip: data.ip || '',
          location: data.city && data.country_name 
            ? `${data.city}, ${data.country_name}` 
            : 'Unknown',
        } : null);
      })
      .catch(() => {
        setClientInfo(prev => prev ? {
          ...prev,
          ip: '',
          location: 'Unavailable',
        } : null);
      });
  }, [isClient]);

  // Sound notification function
  const playOnlineSound = () => {
    if (!soundEnabled || hasPlayedSound.current) return;
    hasPlayedSound.current = true;
    
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First beep - higher pitch
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.value = 880;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);
      
      // Second beep - even higher
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc2.start(audioCtx.currentTime + 0.18);
      osc2.stop(audioCtx.currentTime + 0.35);
      
      // Third beep - success tone
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.frequency.value = 1320;
      osc3.type = 'sine';
      gain3.gain.setValueAtTime(0.4, audioCtx.currentTime + 0.38);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
      osc3.start(audioCtx.currentTime + 0.38);
      osc3.stop(audioCtx.currentTime + 0.7);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  useEffect(() => {
    setIsClient(true);
    const updateTime = () => setTime(new Date().toLocaleTimeString('de-DE', { hour12: false }));
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  // Rotate listening messages every 1.7s (calm cadence)
  useEffect(() => {
    const interval = setInterval(() => {
      setListeningMsgIndex(prev => (prev + 1) % LISTENING_MESSAGES.length);
    }, 1700);
    return () => clearInterval(interval);
  }, [LISTENING_MESSAGES.length]);

  // Handle loading state and sound notifications based on airspace status
  useEffect(() => {
    if (airspaceStatus === 'loading' && !initialLoadDone.current) {
      // Keep loading for initial load
      return;
    }
    
    if (airspaceStatus === 'tracking' || airspaceStatus === 'quiet') {
      // Show loading screen for at least 2s on first load
      if (!initialLoadDone.current) {
        const timer = setTimeout(() => {
          setLoading(false);
          initialLoadDone.current = true;
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setLoading(false);
      }
      
      // Play sound when contacts appear
      if (airspaceStatus === 'tracking' && soundEnabled && !hasPlayedSound.current) {
        playOnlineSound();
      }
    }
    
    if (airspaceStatus === 'offline' || airspaceStatus === 'degraded') {
      if (initialLoadDone.current) {
        // Only show error state after initial load
        setLoading(false);
      }
    }
  }, [airspaceStatus, soundEnabled]);

  // Apply filter
  const filteredAircraft = aircraft.filter(a => {
    if (filter === 'military') return a.is_military;
    if (filter === 'civilian') return !a.is_military;
    return true;
  });

  const totalMil = aircraft.filter(a => a.is_military).length;
  const totalCiv = aircraft.length - totalMil;

  // Loading screen with enhanced scanner
  if (!isClient || loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
        <div style={{
          minHeight: '100vh',
          background: '#0a0f0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Share Tech Mono', monospace",
          color: '#00ff41',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Grid background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />

        {/* Scanner bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '30%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,65,0.15) 50%, transparent 100%)',
            animation: 'scannerMove 2s linear infinite',
          }} />
        </div>

        {/* Main content */}
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          {/* Large Radar circle */}
          <div style={{
            width: '200px',
            height: '200px',
            margin: '0 auto 30px',
            position: 'relative',
            border: '2px solid #00ff41',
            borderRadius: '50%',
            boxShadow: '0 0 40px rgba(0,255,65,0.4), inset 0 0 40px rgba(0,255,65,0.1)',
          }}>
            {/* Concentric circles */}
            <div style={{ position: 'absolute', top: '25%', left: '25%', right: '25%', bottom: '25%', border: '1px solid #00ff4130', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '50%', height: '50%', border: '1px solid #00ff4130', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '25%', height: '25%', border: '1px solid #00ff4130', borderRadius: '50%' }} />
            
            {/* Cross lines */}
            <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1px', background: '#00ff4130' }} />
            <div style={{ position: 'absolute', left: '50%', top: '5%', bottom: '5%', width: '1px', background: '#00ff4130' }} />
            {/* Diagonal lines */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '90%', height: '1px', background: '#00ff4120', transform: 'translate(-50%, -50%) rotate(45deg)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '90%', height: '1px', background: '#00ff4120', transform: 'translate(-50%, -50%) rotate(-45deg)' }} />
            
            {/* Rotating sweep with glow trail */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '50%',
              height: '50%',
              transformOrigin: '0 0',
              animation: 'radarSweep 3s linear infinite',
            }}>
              {/* The sweep/needle - THICK AND BRIGHT */}
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #00ff41 0%, #00ff41 40%, rgba(0,255,65,0.6) 70%, transparent 100%)',
                boxShadow: '0 0 20px #00ff41, 0 0 40px #00ff41, 0 0 60px rgba(0,255,65,0.5)',
                borderRadius: '2px',
              }} />
              {/* Glow trail behind needle - wider trail */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'conic-gradient(from -90deg, transparent 0deg, rgba(0,255,65,0.3) 0deg, rgba(0,255,65,0.15) 20deg, transparent 45deg)',
                transformOrigin: '0 0',
              }} />
            </div>
            
            {/* Blinking detected dots */}
            <div style={{ position: 'absolute', top: '20%', left: '60%', width: '6px', height: '6px', background: '#00ff41', borderRadius: '50%', boxShadow: '0 0 10px #00ff41', animation: 'fadeInOut 1.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', top: '35%', left: '75%', width: '4px', height: '4px', background: '#ff3333', borderRadius: '50%', boxShadow: '0 0 8px #ff3333', animation: 'fadeInOut 2s ease-in-out infinite 0.5s' }} />
            <div style={{ position: 'absolute', top: '65%', left: '30%', width: '5px', height: '5px', background: '#00ff41', borderRadius: '50%', boxShadow: '0 0 10px #00ff41', animation: 'fadeInOut 1.8s ease-in-out infinite 0.3s' }} />
            <div style={{ position: 'absolute', top: '45%', left: '20%', width: '6px', height: '6px', background: '#ff3333', borderRadius: '50%', boxShadow: '0 0 10px #ff3333', animation: 'fadeInOut 1.3s ease-in-out infinite 0.7s' }} />
            <div style={{ position: 'absolute', top: '75%', left: '55%', width: '4px', height: '4px', background: '#00ff41', borderRadius: '50%', boxShadow: '0 0 8px #00ff41', animation: 'fadeInOut 2.2s ease-in-out infinite 0.2s' }} />
            <div style={{ position: 'absolute', top: '30%', left: '40%', width: '5px', height: '5px', background: '#ffcc00', borderRadius: '50%', boxShadow: '0 0 10px #ffcc00', animation: 'fadeInOut 1.6s ease-in-out infinite 0.9s' }} />
            
            {/* Center dot */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              background: '#00ff41',
              borderRadius: '50%',
              boxShadow: '0 0 15px #00ff41',
            }} />
          </div>

          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            letterSpacing: '8px',
            marginBottom: '12px',
            textShadow: '0 0 30px rgba(0,255,65,0.6)',
          }}>
            ◆ NATO WATCH
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#00aa2a',
            letterSpacing: '4px',
            marginBottom: '30px',
          }}>
            MILITARY AIRCRAFT SURVEILLANCE
          </div>

          {/* Status messages */}
          <div style={{
            width: '350px',
            margin: '0 auto',
            padding: '16px',
            background: 'rgba(0,20,0,0.6)',
            border: '1px solid #1a3a1a',
            borderRadius: '4px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
              <span style={{ color: '#00aa2a' }}>▸ CONNECTING TO OPENSKY NETWORK</span>
              <span style={{ animation: 'blink 0.5s infinite' }}>●</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
              <span style={{ color: '#00aa2a' }}>▸ INITIALIZING RADAR SYSTEMS</span>
              <span style={{ color: '#00ff41' }}>✓</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
              <span style={{ color: '#00aa2a' }}>▸ SCANNING AIRSPACE</span>
              <span style={{ animation: 'blink 0.8s infinite' }}>●</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#00aa2a' }}>▸ LOADING GLOBAL DATA</span>
              <span style={{ animation: 'blink 1s infinite' }}>●</span>
            </div>
            
            {/* Progress bar */}
            <div style={{
              marginTop: '16px',
              height: '3px',
              background: '#1a3a1a',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: '40%',
                background: 'linear-gradient(90deg, transparent, #00ff41, #00ff41, transparent)',
                animation: 'scannerMove 1.5s ease-in-out infinite',
              }} />
            </div>
          </div>

          {/* Live stats preview */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            marginTop: '24px',
            fontSize: '11px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00aa2a', letterSpacing: '1px' }}>REGIONS</div>
              <div style={{ fontSize: '18px', marginTop: '4px' }}>6</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00aa2a', letterSpacing: '1px' }}>HOTSPOTS</div>
              <div style={{ fontSize: '18px', marginTop: '4px', color: '#ff3333' }}>6</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00aa2a', letterSpacing: '1px' }}>STATUS</div>
              <div style={{ fontSize: '18px', marginTop: '4px', color: '#00ff41' }}>LIVE</div>
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <div style={{ position: 'absolute', top: 20, left: 20, width: 50, height: 50, borderLeft: '2px solid #00ff41', borderTop: '2px solid #00ff41', opacity: 0.6 }} />
        <div style={{ position: 'absolute', top: 20, right: 20, width: 50, height: 50, borderRight: '2px solid #00ff41', borderTop: '2px solid #00ff41', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, width: 50, height: 50, borderLeft: '2px solid #00ff41', borderBottom: '2px solid #00ff41', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: 20, right: 20, width: 50, height: 50, borderRight: '2px solid #00ff41', borderBottom: '2px solid #00ff41', opacity: 0.6 }} />
        
        {/* Additional corner tech details */}
        <div style={{ position: 'absolute', top: 30, left: 80, fontSize: '9px', color: '#00aa2a', letterSpacing: '2px' }}>SYS.INIT</div>
        <div style={{ position: 'absolute', top: 30, right: 80, fontSize: '9px', color: '#00aa2a', letterSpacing: '2px' }}>v2.0.1</div>
        <div style={{ position: 'absolute', bottom: 30, left: 80, fontSize: '9px', color: '#00aa2a', letterSpacing: '2px' }}>LAT: ---.---</div>
        <div style={{ position: 'absolute', bottom: 30, right: 80, fontSize: '9px', color: '#00aa2a', letterSpacing: '2px' }}>LON: ---.---</div>
        </div>
      </>
    );
  }

  // Calm, professional "Airspace Quiet" state with YOUR SIGNAL module
  if (aircraft.length === 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
        
        {/* Disclaimer Modal */}
        {showDisclaimer && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}>
            <div style={{
              background: '#0a0f0a',
              border: '1px solid #1a3a1a',
              borderRadius: '4px',
              padding: '24px',
              maxWidth: '500px',
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              <div style={{ color: '#00ff41', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '2px' }}>
                {lang === 'de' ? 'HINWEIS / HAFTUNGSAUSSCHLUSS' : 'DISCLAIMER'}
              </div>
              <div style={{ color: '#00aa2a', fontSize: '11px', lineHeight: '1.6', marginBottom: '20px' }}>
                {lang === 'de' 
                  ? 'Die hier angezeigten Werte sind eine momentane technische Live-Anzeige (z. B. grob abgeleitete Netz-/Standortinfos sowie Browser-/Geräteinfos). Wir speichern diese Daten nicht aktiv und erstellen keine Profile. Die Anzeige kann unvollständig, fehlerhaft oder irreführend sein (z. B. durch VPN/Proxy, Mobilfunk, Provider-Routing oder Browser-Einstellungen). Die Nutzung erfolgt auf eigenes Risiko. Wir übernehmen keine Haftung für Schäden oder Nachteile, die direkt oder indirekt aus der Anzeige, Interpretation oder Nutzung der dargestellten Informationen entstehen.'
                  : 'The values displayed here are a momentary technical live readout (e.g., roughly derived network/location info and browser/device info). We do not actively store this data or create profiles. The display may be incomplete, erroneous, or misleading (e.g., due to VPN/proxy, mobile networks, provider routing, or browser settings). Use at your own risk. We assume no liability for any damages or disadvantages arising directly or indirectly from the display, interpretation, or use of the information shown.'
                }
              </div>
              <div style={{ color: '#00aa2a', fontSize: '9px', opacity: 0.7, marginBottom: '20px' }}>
                {lang === 'de' 
                  ? 'Live-Anzeige. Keine Garantien. Nutzung auf eigene Gefahr.'
                  : 'Live readout only. No guarantees. Use at your own risk.'
                }
              </div>
              <button
                onClick={() => setShowDisclaimer(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #00ff41',
                  color: '#00ff41',
                  padding: '8px 24px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  fontFamily: 'inherit',
                  letterSpacing: '1px',
                }}
              >
                {lang === 'de' ? 'VERSTANDEN' : 'UNDERSTOOD'}
              </button>
            </div>
          </div>
        )}

        <div style={{
          minHeight: '100vh',
          background: T.background,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Share Tech Mono', monospace",
          color: T.primary,
          position: 'relative',
          overflow: 'hidden',
          padding: '20px',
        }}>
          {/* Subtle grid background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(${T.primary}05 1px, transparent 1px),
              linear-gradient(90deg, ${T.primary}05 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />

          {/* Very subtle scanner effect - 6-8s, low opacity */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            opacity: 0.06,
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '25%',
              background: `linear-gradient(90deg, transparent 0%, ${T.primary}80 50%, transparent 100%)`,
              animation: 'scannerMove 8s linear infinite',
            }} />
          </div>

          {/* TEST: Label direkt neben der Uhr oben rechts */}
          <div style={{
            position: 'absolute',
            top: 20,
            right: 120,
            zIndex: 9999,
            background: '#ff00ff',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '12px',
            padding: '8px 18px',
            fontSize: '22px',
            fontWeight: 'bold',
            boxShadow: '0 0 12px #ff00ff99',
          }}>
            TEST-OBEN-RECHTS
          </div>

          {/* Settings Modal */}
          {showSettings && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              <div style={{
                background: T.backgroundAlt,
                border: `1px solid ${T.border}`,
                borderRadius: '8px',
                padding: '32px 28px 24px 28px',
                minWidth: '320px',
                boxShadow: `0 0 40px ${T.primary}33`,
                color: T.primary,
                position: 'relative',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '18px', letterSpacing: '2px', textAlign: 'center' }}>
                  {lang === 'de' ? 'Einstellungen' : 'Settings'}
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '13px', color: T.primaryDim, marginRight: '10px' }}>{lang === 'de' ? 'Theme:' : 'Theme:'}</label>
                  <select
                    value={theme}
                    onChange={e => setTheme(e.target.value as 'military' | 'cyber')}
                    style={{
                      background: T.background,
                      color: T.primary,
                      border: `1px solid ${T.primary}`,
                      borderRadius: '2px',
                      padding: '4px 12px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      marginLeft: '4px',
                    }}
                  >
                    <option value="military">MILITARY</option>
                    <option value="cyber">CYBER</option>
                  </select>
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '13px', color: T.primaryDim, marginRight: '10px' }}>{lang === 'de' ? 'Sprache:' : 'Language:'}</label>
                  <select
                    value={lang}
                    onChange={e => setLang(e.target.value as 'en' | 'de')}
                    style={{
                      background: T.background,
                      color: T.primary,
                      border: `1px solid ${T.primary}`,
                      borderRadius: '2px',
                      padding: '4px 12px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      marginLeft: '4px',
                    }}
                  >
                    <option value="en">ENGLISH</option>
                    <option value="de">DEUTSCH</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.primary}`,
                    color: T.primary,
                    padding: '8px 24px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    fontFamily: 'inherit',
                    letterSpacing: '1px',
                    marginTop: '10px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  {lang === 'de' ? 'Schließen' : 'Close'}
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', zIndex: 10, maxWidth: '420px', width: '100%' }}>
            
            {/* ========== PRIMARY STATUS BLOCK ========== */}
            
            {/* Calm radar - theme colored, slow sweep (6s) */}
            <div style={{
              width: '140px',
              height: '140px',
              margin: '0 auto 30px',
              position: 'relative',
              border: `1px solid ${T.primary}30`,
              borderRadius: '50%',
              boxShadow: `0 0 25px ${T.primary}15, inset 0 0 15px ${T.primary}08`,
            }}>
              {/* Concentric circles */}
              <div style={{ position: 'absolute', top: '25%', left: '25%', right: '25%', bottom: '25%', border: `1px solid ${T.primary}10`, borderRadius: '50%' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '50%', height: '50%', border: `1px solid ${T.primary}10`, borderRadius: '50%' }} />
              
              {/* Cross lines */}
              <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1px', background: `${T.primary}0a` }} />
              <div style={{ position: 'absolute', left: '50%', top: '5%', bottom: '5%', width: '1px', background: `${T.primary}0a` }} />
              
              {/* Slow rotating sweep - 6s */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '50%',
                height: '50%',
                transformOrigin: '0 0',
                animation: 'radarSweep 6s linear infinite',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: `linear-gradient(90deg, ${T.primary} 0%, ${T.primary}4d 40%, transparent 100%)`,
                  boxShadow: `0 0 6px ${T.primary}66`,
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: `conic-gradient(from -90deg, transparent 0deg, ${T.primary}10 0deg, transparent 25deg)`,
                  transformOrigin: '0 0',
                }} />
              </div>
              
              {/* Center dot */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '5px',
                height: '5px',
                background: T.primary,
                borderRadius: '50%',
                boxShadow: `0 0 6px ${T.primary}`,
              }} />
            </div>

            {/* Primary Status - static, dominant */}
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              letterSpacing: '5px',
              marginBottom: '8px',
              color: T.primary,
              textShadow: `0 0 12px ${T.primary}40`,
            }}>
              {UI.AIRSPACE_QUIET}
            </div>
            
            {/* Rotating subline - fade transition 1.7s cycle */}
            <div style={{
              fontSize: '11px',
              color: T.primaryDim,
              letterSpacing: '1px',
              marginBottom: '24px',
              minHeight: '16px',
              opacity: 0.8,
              transition: 'opacity 0.25s ease',
            }}>
              {LISTENING_MESSAGES[listeningMsgIndex]}
            </div>

            {/* Secondary status stack - compact */}
            <div style={{
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto',
              padding: '12px 16px',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: '2px',
              fontSize: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: T.primaryDim }}>airplanes.live</span>
                <span style={{ color: airspaceStatus === 'offline' ? T.danger : airspaceStatus === 'degraded' ? T.warning : T.primary }}>
                  {airspaceStatus === 'offline' ? UI.VALUE_OFFLINE : airspaceStatus === 'degraded' ? UI.VALUE_DEGRADED : UI.VALUE_LIVE}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: T.primaryDim }}>{UI.LABEL_ADSB}</span>
                <span style={{ color: T.primary }}>{UI.VALUE_LIVE}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: T.primaryDim }}>{UI.LABEL_SYSTEMS}</span>
                <span style={{ color: T.primary }}>{UI.VALUE_ONLINE}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', opacity: 0.7 }}>
                <span style={{ color: T.primaryDim }}>{UI.LABEL_LAST_SCAN}</span>
                <span style={{ color: T.primaryDim }}>{lastScanTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                <span style={{ color: T.primaryDim }}>{UI.LABEL_CONTACTS}</span>
                <span style={{ color: T.primaryDim }}>{UI.CONTACTS_NONE}</span>
              </div>
            </div>

            {/* ========== CONTROLS ========== */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '20px',
              flexWrap: 'wrap',
            }}>
              {/* Retry button */}
              <button
                onClick={() => {
                  hasPlayedSound.current = false;
                  refetch();
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #1a3a1a',
                  color: '#00aa2a',
                  padding: '7px 14px',
                  fontSize: '9px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  fontFamily: 'inherit',
                  letterSpacing: '1px',
                }}
              >
                {UI.BTN_RETRY}
              </button>

              {/* Alert button */}
              <button
                onClick={() => {
                  const newState = !soundEnabled;
                  setSoundEnabled(newState);
                  hasPlayedSound.current = false;
                  // Single pulse on activation only
                  if (newState) {
                    try {
                      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = audioCtx.createOscillator();
                      const gain = audioCtx.createGain();
                      osc.connect(gain);
                      gain.connect(audioCtx.destination);
                      osc.frequency.value = 660;
                      osc.type = 'sine';
                      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                      osc.start(audioCtx.currentTime);
                      osc.stop(audioCtx.currentTime + 0.1);
                    } catch (e) {}
                  }
                }}
                style={{
                  background: soundEnabled ? 'rgba(0,255,65,0.12)' : 'transparent',
                  border: `1px solid ${soundEnabled ? '#00ff41' : '#1a3a1a'}`,
                  color: soundEnabled ? '#00ff41' : '#00aa2a',
                  padding: '7px 14px',
                  fontSize: '9px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  fontFamily: 'inherit',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {soundEnabled ? UI.BTN_ALERT_ARMED : UI.BTN_ALERT_ARM}
              </button>
            </div>

            {/* Alert helper text */}
            <div style={{
              fontSize: '9px',
              color: '#00aa2a',
              marginTop: '10px',
              opacity: 0.6,
            }}>
              {soundEnabled ? UI.ALERT_HELP_ARMED : UI.ALERT_HELP_IDLE}
            </div>

            {/* ========== YOUR SIGNAL MODULE ========== */}
            {showSignal && clientInfo && (
              <div style={{
                marginTop: '32px',
                width: '100%',
                maxWidth: '340px',
                margin: '32px auto 0',
                background: 'rgba(0,12,0,0.6)',
                border: '1px solid #1a3a1a',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                {/* Module header */}
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #1a3a1a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,20,0,0.4)',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#00ff41', letterSpacing: '2px', fontWeight: 'bold' }}>
                      {UI.SIGNAL_TITLE}
                    </div>
                    <div style={{ fontSize: '8px', color: '#00aa2a', marginTop: '2px', opacity: 0.7 }}>
                      {UI.SIGNAL_SUBTITLE}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSignal(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00aa2a',
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '0 4px',
                      opacity: 0.6,
                    }}
                  >×</button>
                </div>

                <div style={{ padding: '12px 14px', fontSize: '9px' }}>
                  {/* NETWORK section */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#00ff41', fontSize: '8px', letterSpacing: '2px', marginBottom: '6px', opacity: 0.8 }}>
                      {UI.SIGNAL_NETWORK}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_IP}</span>
                      <span style={{ color: '#00ff41', fontFamily: 'monospace' }}>{maskIP(clientInfo.ip)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_LOC}</span>
                      <span style={{ color: '#00ff41' }}>{clientInfo.location}</span>
                    </div>
                  </div>

                  {/* CLIENT section */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#00ff41', fontSize: '8px', letterSpacing: '2px', marginBottom: '6px', opacity: 0.8 }}>
                      {UI.SIGNAL_CLIENT}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_BROWSER}</span>
                      <span style={{ color: '#00ff41' }}>{clientInfo.browser}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_OS}</span>
                      <span style={{ color: '#00ff41' }}>{clientInfo.os}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_VIEW}</span>
                      <span style={{ color: '#00ff41' }}>{clientInfo.viewport}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_TZ}</span>
                      <span style={{ color: '#00ff41' }}>{clientInfo.timezone}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_LANG}</span>
                      <span style={{ color: '#00ff41' }}>{clientInfo.language}</span>
                    </div>
                  </div>

                  {/* SESSION section */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: '#00ff41', fontSize: '8px', letterSpacing: '2px', marginBottom: '6px', opacity: 0.8 }}>
                      {UI.SIGNAL_SESSION}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#00aa2a' }}>{UI.SIGNAL_SIG}</span>
                      <span style={{ color: '#00ff41', fontFamily: 'monospace' }}>{sessionSig}</span>
                    </div>
                    <div style={{ fontSize: '8px', color: '#00aa2a', opacity: 0.5, textAlign: 'right' }}>
                      {UI.SIGNAL_TTL}
                    </div>
                  </div>

                  {/* Privacy note */}
                  <div style={{ 
                    fontSize: '8px', 
                    color: '#00aa2a', 
                    opacity: 0.5, 
                    paddingTop: '8px', 
                    borderTop: '1px solid #1a3a1a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span>{UI.PRIVACY_NOTE}</span>
                    <button
                      onClick={() => setShowDisclaimer(true)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #1a3a1a',
                        color: '#00aa2a',
                        padding: '2px 6px',
                        fontSize: '7px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        fontFamily: 'inherit',
                        marginLeft: '8px',
                      }}
                    >?</button>
                  </div>
                </div>
              </div>
            )}

            {/* Show signal toggle if hidden */}
            {!showSignal && (
              <button
                onClick={() => setShowSignal(true)}
                style={{
                  marginTop: '24px',
                  background: 'transparent',
                  border: '1px solid #1a3a1a',
                  color: '#00aa2a',
                  padding: '6px 12px',
                  fontSize: '8px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  fontFamily: 'inherit',
                  letterSpacing: '1px',
                  opacity: 0.6,
                }}
              >
                {lang === 'de' ? 'SIGNAL ANZEIGEN' : 'SHOW SIGNAL'}
              </button>
            )}
          </div>

          {/* Minimal corner decorations */}
          <div style={{ position: 'absolute', top: 20, left: 20, width: 25, height: 25, borderLeft: `1px solid ${T.primary}20`, borderTop: `1px solid ${T.primary}20` }} />
          <div style={{ position: 'absolute', bottom: 20, left: 20, width: 25, height: 25, borderLeft: `1px solid ${T.primary}20`, borderBottom: `1px solid ${T.primary}20` }} />
          <div style={{ position: 'absolute', bottom: 20, right: 20, width: 25, height: 25, borderRight: `1px solid ${T.primary}20`, borderBottom: `1px solid ${T.primary}20` }} />
          
          {/* Bottom status bar */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            color: T.primaryDim,
            letterSpacing: '2px',
            opacity: 0.4,
          }}>
            {UI.RADAR_ONLINE}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div style={{
        minHeight: '100vh',
        background: T.background,
        color: T.primary,
        padding: '16px',
        fontFamily: "'Share Tech Mono', monospace",
      }}>
        {/* TEST-BANNER für Deployment-Check */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
          background: '#ff00ff',
          color: '#fff',
          fontWeight: 'bold',
          padding: '6px 18px',
          fontSize: '16px',
          letterSpacing: '2px',
          borderBottomRightRadius: '12px',
          boxShadow: '0 2px 8px #0008',
        }}>
          TEST-DEPLOYMENT
        </div>
        {/* Header */}
        <header style={{ 
          marginBottom: '20px',
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  fontSize: '24px', 
                fontWeight: 'bold',
                letterSpacing: '4px',
                textShadow: `0 0 20px ${T.glow}`,
              }}>
                ◆ NATO WATCH
              </div>
              <span style={{ 
                background: T.danger, 
                color: '#000', 
                padding: '2px 8px', 
                fontSize: '10px',
                fontWeight: 'bold',
                animation: 'pulse 2s infinite',
              }}>LIVE</span>
              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: soundEnabled ? `${T.primary}33` : 'transparent',
                  border: `1px solid ${soundEnabled ? T.primary : T.border}`,
                  color: soundEnabled ? T.primary : T.primaryDim,
                  padding: '2px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={soundEnabled ? 'Sound ausschalten' : 'Sound einschalten'}
              >
                {soundEnabled ? '🔊' : '🔇'} AUDIO
              </button>
              {/* Theme toggle immer sichtbar */}
              <button
                onClick={() => setTheme(theme === 'military' ? 'cyber' : 'military')}
                style={{
                  background: theme === 'cyber' ? 'rgba(0,240,255,0.15)' : 'rgba(0,255,65,0.15)',
                  border: `1px solid ${T.primary}`,
                  color: T.primary,
                  padding: '2px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  fontFamily: 'inherit',
                  letterSpacing: '1px',
                  marginLeft: '8px',
                }}
              >
                {T.name}
              </button>
            </div>
            <p style={{ color: T.primaryDim, marginTop: '4px', fontSize: '12px', letterSpacing: '2px' }}>
              MILITARY AIRCRAFT SURVEILLANCE SYSTEM
            </p>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: T.primary, textShadow: `0 0 10px ${T.glow}` }}>
                {time}
              </div>
              {/* Settings button (Zahnrad) */}
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  background: 'rgba(0,0,0,0.15)',
                  border: `1px solid ${T.primary}`,
                  color: T.primary,
                  padding: '6px 10px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  fontFamily: 'inherit',
                  boxShadow: `0 0 8px ${T.primary}33`,
                  transition: 'background 0.2s',
                }}
                title={lang === 'de' ? 'Einstellungen' : 'Settings'}
              >
                <span role="img" aria-label="settings">⚙️</span>
              </button>
            </div>
            <div style={{ fontSize: '11px', color: T.primaryDim, marginTop: '4px' }}>
              ZULU: {new Date().toISOString().slice(11, 19)}Z
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(0,20,0,0.5)',
          border: '1px solid #1a3a1a',
          borderRadius: '4px',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#00aa2a', letterSpacing: '1px' }}>SHOWING</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{loading ? '---' : filteredAircraft.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#00aa2a', letterSpacing: '1px' }}>MILITARY</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff3333', textShadow: '0 0 10px rgba(255,51,51,0.5)' }}>
              {loading ? '---' : totalMil}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#00aa2a', letterSpacing: '1px' }}>CIVILIAN</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{loading ? '---' : totalCiv}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px' }}>
            <div style={{ fontSize: '10px', color: '#00aa2a', letterSpacing: '1px', marginRight: '8px' }}>FILTER:</div>
            <button
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? 'rgba(0,255,65,0.3)' : 'transparent',
                border: filter === 'all' ? '1px solid #00ff41' : '1px solid #1a3a1a',
                color: '#00ff41',
                padding: '4px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '2px',
                fontFamily: 'inherit',
              }}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('military')}
              style={{
                background: filter === 'military' ? 'rgba(255,51,51,0.3)' : 'transparent',
                border: filter === 'military' ? '1px solid #ff3333' : '1px solid #1a3a1a',
                color: '#ff3333',
                padding: '4px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '2px',
                fontFamily: 'inherit',
              }}
            >
              ⚠ MIL ONLY
            </button>
            <button
              onClick={() => setFilter('civilian')}
              style={{
                background: filter === 'civilian' ? 'rgba(0,170,42,0.3)' : 'transparent',
                border: filter === 'civilian' ? '1px solid #00aa2a' : '1px solid #1a3a1a',
                color: '#00aa2a',
                padding: '4px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '2px',
                fontFamily: 'inherit',
              }}
            >
              CIV ONLY
            </button>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#00aa2a', letterSpacing: '1px' }}>LAST UPDATE</div>
            <div style={{ fontSize: '14px' }}>{lastUpdate || '---'}</div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
        <div>
          {/* Main Focused Map */}
          <section style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#00aa2a', 
              marginBottom: '8px', 
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span>▸ FOCUSED VIEW: {focusedRegion.name}</span>
              {focusedRegion.id !== 'world' && (
                <button
                  onClick={() => setFocusedRegion(WORLD)}
                  style={{
                    background: 'rgba(0,255,65,0.1)',
                    border: '1px solid #00ff41',
                    color: '#00ff41',
                    padding: '2px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  ← BACK TO GLOBAL
                </button>
              )}
            </div>
            <MapCard 
              key={focusedRegion.id + filter} 
              region={focusedRegion} 
              aircraft={filteredAircraft} 
              height="320px" 
              isMain={true}
              theme={T}
            />
          </section>

          {/* Regions */}
          <section style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#00aa2a', marginBottom: '8px', letterSpacing: '2px' }}>
              ▸ REGIONAL SECTORS — Click to focus
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {REGIONS.map(r => (
                <MapCard 
                  key={r.id + filter} 
                  region={r} 
                  aircraft={filteredAircraft} 
                  height="160px"
                  onClick={() => setFocusedRegion(r)}
                  theme={T}
                />
              ))}
            </div>
          </section>

          {/* Hotspots */}
          <section>
            <div style={{ fontSize: '12px', color: '#ff3333', marginBottom: '8px', letterSpacing: '2px' }}>
              ▸ ACTIVE HOTSPOTS — Click to focus
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {HOTSPOTS.map(h => (
                <MapCard 
                  key={h.id + filter} 
                  region={h} 
                  aircraft={filteredAircraft} 
                  height="140px"
                  onClick={() => setFocusedRegion(h)}
                  theme={T}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <LiveFeed aircraft={aircraft} theme={T} />
          
          {/* Quick Access Panel */}
          <div style={{
            background: 'rgba(0,20,0,0.8)',
            border: '1px solid #1a3a1a',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '11px',
          }}>
            <div style={{ color: '#00ff41', fontWeight: 600, marginBottom: '8px' }}>
              QUICK ACCESS
            </div>
            <button
              onClick={() => setFocusedRegion(WORLD)}
              style={{
                width: '100%',
                background: focusedRegion.id === 'world' ? 'rgba(0,255,65,0.2)' : 'transparent',
                border: '1px solid #1a3a1a',
                color: '#00ff41',
                padding: '6px',
                marginBottom: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '10px',
              }}
            >
              🌍 GLOBAL VIEW
            </button>
            {HOTSPOTS.map(h => (
              <button
                key={h.id}
                onClick={() => setFocusedRegion(h)}
                style={{
                  width: '100%',
                  background: focusedRegion.id === h.id ? 'rgba(0,255,65,0.2)' : 'transparent',
                  border: '1px solid #1a3a1a',
                  color: STATUS_CONFIG[h.status!].color,
                  padding: '6px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{h.name}</span>
                <span>{STATUS_CONFIG[h.status!].label}</span>
              </button>
            ))}
          </div>
          
          {/* Status Panel */}
          <div style={{
            background: 'rgba(0,20,0,0.8)',
            border: '1px solid #1a3a1a',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '11px',
          }}>
            <div style={{ color: '#00ff41', fontWeight: 600, marginBottom: '8px' }}>
              THREAT LEVELS
            </div>
            {HOTSPOTS.map(h => (
              <div key={h.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: '1px solid #0d1a0d',
              }}>
                <span style={{ color: '#00aa2a' }}>{h.name}</span>
                <span style={{ 
                  color: STATUS_CONFIG[h.status!].color,
                  fontWeight: 600,
                }}>
                  {STATUS_CONFIG[h.status!].label}
                </span>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div style={{
            background: 'rgba(0,20,0,0.8)',
            border: '1px solid #1a3a1a',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '10px',
            color: '#00aa2a',
          }}>
            <div style={{ color: '#00ff41', fontWeight: 600, marginBottom: '8px', fontSize: '11px' }}>
              SYSTEM STATUS
            </div>
            <div>▸ DATA SOURCE: OPENSKY NETWORK</div>
            <div>▸ REFRESH RATE: 30 SEC</div>
            <div>▸ STATUS: <span style={{ color: '#00ff41' }}>OPERATIONAL</span></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        marginTop: '20px', 
        textAlign: 'center', 
        color: '#00aa2a', 
        fontSize: '10px',
        letterSpacing: '2px',
        borderTop: '1px solid #1a3a1a',
        paddingTop: '12px',
      }}>
        NATO WATCH v2.0 ◆ CLASSIFIED ◆ AUTHORIZED PERSONNEL ONLY
      </footer>
      </div>
    </>
  );
}
