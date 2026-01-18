import { Aircraft } from '@/types/aircraft';

// NATO military callsign patterns
const NATO_PATTERNS = [
  /^RCH\d+/i,     // Reach
  /^RRR\d+/i,     // Red Flag
  /^ASCOT\d+/i,   // Ascot
  /^QID\d+/i,     // Quid
  /^LAGR\d+/i,    // Lager
  /^NATO\d+/i,    // NATO
  /^MAGIC\d+/i,   // Magic
  /^FORTE\d+/i,   // Forte
  /^SHELL\d+/i,   // Shell
  /^MOOSE\d+/i,   // Moose
  /^CNV\d+/i,     // Convoy
  /^KING\d+/i,    // King
  /^ROMA\d+/i,    // Roma
  /^OLIVE\d+/i,   // Olive
  /^DUKE\d+/i,    // Duke
  /^VIPER\d+/i,   // Viper
  /^HAWK\d+/i,    // Hawk
];

export const isNATOCallsign = (callsign?: string): boolean => {
  if (!callsign) return false;
  return NATO_PATTERNS.some(pattern => pattern.test(callsign.trim()));
};

export const isLoitering = (aircraft: Aircraft): boolean => {
  const speed = aircraft.ground_speed || 0;
  return speed < 150 && speed > 0;
};

export const isMilitary = (aircraft: Aircraft): boolean => {
  return aircraft.is_military || isNATOCallsign(aircraft.callsign);
};

export const getAircraftColor = (aircraft: Aircraft): string => {
  if (aircraft.loitering) return '#f59e0b'; // amber-500
  if (isMilitary(aircraft)) return '#ef4444'; // red-500
  if (aircraft.altitude && aircraft.altitude > 35000) return '#3b82f6'; // blue-500
  return '#10b981'; // emerald-500
};

export const getAircraftColorWithCustom = (aircraft: Aircraft, functionColors: any): string => {
  if (aircraft.loitering) return functionColors.loitering;
  if (isMilitary(aircraft)) return functionColors.military;
  if (aircraft.altitude && aircraft.altitude > 35000) return functionColors.highAltitude;
  return functionColors.civilian;
};

export const formatAltitude = (altitude?: number): string => {
  if (!altitude) return 'N/A';
  return `${altitude.toLocaleString()} ft`;
};

export const formatSpeed = (speed?: number): string => {
  if (!speed) return 'N/A';
  return `${Math.round(speed)} kt`;
};

export const formatTrack = (track?: number): string => {
  if (track === undefined || track === null) return 'N/A';
  return `${Math.round(track)}°`;
};

export const formatVerticalRate = (rate?: number): string => {
  if (!rate) return 'N/A';
  const sign = rate > 0 ? '+' : '';
  return `${sign}${Math.round(rate)} ft/min`;
};

export const searchAircraft = (aircraft: Aircraft[], query: string): Aircraft[] => {
  if (!query.trim()) return aircraft;
  
  const searchTerm = query.toLowerCase().trim();
  return aircraft.filter(ac => 
    ac.icao.toLowerCase().includes(searchTerm) ||
    (ac.callsign && ac.callsign.toLowerCase().includes(searchTerm))
  );
};

export const filterAircraft = (aircraft: Aircraft[], filters: any): Aircraft[] => {
  return aircraft.filter(ac => {
    if (!filters.showMilitary && isMilitary(ac)) return false;
    if (!filters.showCivilian && !isMilitary(ac)) return false;
    if (!filters.showLoitering && ac.loitering) return false;
    
    if (ac.altitude) {
      if (ac.altitude < filters.minAltitude || ac.altitude > filters.maxAltitude) {
        return false;
      }
    }
    
    return true;
  });
};