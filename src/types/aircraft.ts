export interface Aircraft {
  icao: string;
  callsign?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  ground_speed?: number;
  track?: number;
  vertical_rate?: number;
  is_military?: boolean;
  source: string;
  timestamp: string;
  loitering?: boolean;
}

export interface AircraftResponse {
  aircraft: Aircraft[];
  meta: {
    region: string;
    total: number;
    loitering: number;
    timestamp: string;
  };
}

export interface Region {
  name: string;
  key: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
}

export interface MapFilters {
  showMilitary: boolean;
  showCivilian: boolean;
  showLoitering: boolean;
  showTrails: boolean;
  showHeatmap: boolean;
  showClusters: boolean;
  minAltitude: number;
  maxAltitude: number;
  searchQuery: string;
}

export interface HistoricalData {
  timestamp: string;
  aircraft: Aircraft[];
}

export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface FunctionColors {
  military: string;
  civilian: string;
  loitering: string;
  highAltitude: string;
  nato: string;
  trail: string;
  heatmap: string;
  cluster: string;
}