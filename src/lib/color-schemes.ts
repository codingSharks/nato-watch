import { ColorScheme, FunctionColors } from '@/types/aircraft';

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Dark Blue',
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#60a5fa',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155'
  },
  {
    name: 'Military Green',
    primary: '#16a34a',
    secondary: '#15803d',
    accent: '#4ade80',
    background: '#0c1f0c',
    surface: '#1a2e1a',
    text: '#f0fdf4',
    textSecondary: '#86efac',
    border: '#22c55e'
  },
  {
    name: 'NATO Orange',
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#fb923c',
    background: '#1c0f08',
    surface: '#2d1b0f',
    text: '#fff7ed',
    textSecondary: '#fed7aa',
    border: '#f97316'
  },
  {
    name: 'Arctic Blue',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#38bdf8',
    background: '#0c1420',
    surface: '#1e293b',
    text: '#f0f9ff',
    textSecondary: '#7dd3fc',
    border: '#0369a1'
  },
  {
    name: 'Stealth Gray',
    primary: '#6b7280',
    secondary: '#4b5563',
    accent: '#9ca3af',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    border: '#374151'
  },
  {
    name: 'Red Alert',
    primary: '#dc2626',
    secondary: '#b91c1c',
    accent: '#f87171',
    background: '#1f0c0c',
    surface: '#2d1515',
    text: '#fef2f2',
    textSecondary: '#fca5a5',
    border: '#ef4444'
  }
];

export const DEFAULT_FUNCTION_COLORS: FunctionColors = {
  military: '#ef4444',    // red-500
  civilian: '#10b981',    // emerald-500
  loitering: '#f59e0b',   // amber-500
  highAltitude: '#3b82f6', // blue-500
  nato: '#8b5cf6',        // violet-500
  trail: '#06b6d4',       // cyan-500
  heatmap: '#ec4899',     // pink-500
  cluster: '#84cc16'      // lime-500
};

export const PRESET_FUNCTION_COLORS: { name: string; colors: FunctionColors }[] = [
  {
    name: 'Default',
    colors: DEFAULT_FUNCTION_COLORS
  },
  {
    name: 'Military Focus',
    colors: {
      military: '#dc2626',
      civilian: '#6b7280',
      loitering: '#f59e0b',
      highAltitude: '#3b82f6',
      nato: '#7c2d12',
      trail: '#991b1b',
      heatmap: '#b91c1c',
      cluster: '#ef4444'
    }
  },
  {
    name: 'High Contrast',
    colors: {
      military: '#ff0000',
      civilian: '#00ff00',
      loitering: '#ffff00',
      highAltitude: '#0000ff',
      nato: '#ff00ff',
      trail: '#00ffff',
      heatmap: '#ff8000',
      cluster: '#8000ff'
    }
  },
  {
    name: 'Pastel',
    colors: {
      military: '#fca5a5',
      civilian: '#86efac',
      loitering: '#fde68a',
      highAltitude: '#93c5fd',
      nato: '#c4b5fd',
      trail: '#67e8f9',
      heatmap: '#f9a8d4',
      cluster: '#bef264'
    }
  }
];