import { Region } from '@/types/aircraft';

export const REGIONS: Region[] = [
  {
    name: 'World Overview',
    key: 'WORLD',
    center: [20, 0],
    zoom: 2,
    bounds: [[-90, -180], [90, 180]]
  },
  {
    name: 'EE/RU Border',
    key: 'EE_RU_BORDER',
    center: [58, 27],
    zoom: 6,
    bounds: [[55, 20], [61, 35]]
  },
  {
    name: 'Around Russia',
    key: 'AROUND_RU',
    center: [62.5, 100],
    zoom: 3,
    bounds: [[45, 20], [80, 180]]
  },
  {
    name: 'Black Sea',
    key: 'BLACKSEA',
    center: [45, 32.5],
    zoom: 6,
    bounds: [[40, 20], [50, 45]]
  },
  {
    name: 'Baltic Sea',
    key: 'BALTIC',
    center: [57.5, 22.5],
    zoom: 5,
    bounds: [[50, 10], [65, 35]]
  }
];

export const REGION_BOUNDS: Record<string, number[]> = {
  WORLD: [-180, -90, 180, 90],
  EE_RU_BORDER: [20, 55, 35, 61],
  AROUND_RU: [20, 45, 180, 80],
  BLACKSEA: [20, 40, 45, 50],
  BALTIC: [10, 50, 35, 65],
  // Hotspots
  UKRAINE_RU: [28, 44, 42, 53],
  BLACK_SEA: [27, 40, 42, 47],
  IRAN_GULF: [44, 22, 60, 32],
  TAIWAN: [115, 20, 125, 28],
  SOUTH_CHINA_SEA: [105, 4, 122, 22],
  GREENLAND: [-75, 59, -10, 84],
  ICELAND_GIUK: [-35, 58, -5, 70],
  VENEZUELA: [-75, 2, -58, 14],
  RED_SEA: [35, 10, 50, 20],
  NORTH_KOREA: [123, 36, 131, 43],
  SYRIA_IRAQ: [34, 30, 48, 40]
};