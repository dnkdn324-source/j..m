// ── Color codes and palette ──────────────────────────────────────────────────

export type ColorCode = 'CF' | 'BL' | 'VM' | 'RJ' | 'NG' | 'AZ' | 'AM' | 'AC';

export const COLOR_CODES: ColorCode[] = ['CF', 'BL', 'VM', 'RJ', 'NG', 'AZ', 'AM', 'AC'];

export const COLOR_NAMES: Record<ColorCode, string> = {
  CF: 'Café',
  BL: 'Blanco',
  VM: 'Verde Metálico',
  RJ: 'Rojo',
  NG: 'Negro',
  AZ: 'Azul',
  AM: 'Amarillo',
  AC: 'Amarillo Claro',
};

export const COLOR_INVENTORY: Record<ColorCode, number> = {
  CF: 10,
  BL: 10,
  VM: 14,
  RJ: 10,
  NG: 10,
  AZ: 10,
  AM: 10,
  AC: 10,
}; // Total 84

// Visual reference only — before calibration. After calibration, always use the
// real hex derived from the calibrated Lab via labToHex().
export const DEFAULT_COLOR_HEX: Record<ColorCode, string> = {
  CF: '#6F4E37',
  BL: '#FFFFFF',
  VM: '#3E6B5D',
  RJ: '#C1272D',
  NG: '#1A1A1A',
  AZ: '#1F5FA8',
  AM: '#FFD400',
  AC: '#FFEA80',
};

// ── Pyramid structure ────────────────────────────────────────────────────────

export type Layer = ColorCode[][]; // rows of variable length, longest first

export const LAYER_ROW_LENGTHS: number[][] = [
  [7, 6, 5, 4, 3, 2, 1], // Layer 1 (base)
  [6, 5, 4, 3, 2, 1], // Layer 2
  [5, 4, 3, 2, 1], // Layer 3
  [4, 3, 2, 1], // Layer 4
  [3, 2, 1], // Layer 5
  [2, 1], // Layer 6
  [1], // Layer 7 (apex)
];

export const NUM_LAYERS = 7;

export function getExpectedBlockCount(layer: number): number {
  const idx = Math.max(0, Math.min(LAYER_ROW_LENGTHS.length - 1, layer - 1));
  return LAYER_ROW_LENGTHS[idx].reduce((a, b) => a + b, 0);
}

export function getRowLengths(layer: number): number[] {
  const idx = Math.max(0, Math.min(LAYER_ROW_LENGTHS.length - 1, layer - 1));
  return LAYER_ROW_LENGTHS[idx];
}

// ── Vision pipeline constants ────────────────────────────────────────────────

export const WARPED_WIDTH = 800;
export const WARPED_HEIGHT = 800;

export const MAX_IMG_WIDTH = 1200;

export const ADAPTIVE_BLOCK_SIZE = 31;
export const ADAPTIVE_C = 10;

export const MIN_BLOCK_AREA = 500;
export const MAX_BLOCK_AREA = 50000;

export const ROW_Y_TOLERANCE = 40;

export const EROSION_PERCENTAGE = 20;

export const MIN_VALID_PIXELS = 10;

// ΔE weights
export const WEIGHT_L = 0.5;
export const WEIGHT_A = 1.5;
export const WEIGHT_B = 1.5;

export const UMBRAL_DE = 25;

// ── Storage keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  PLAN: 'pyramidPlan',
  CALIBRATION: 'pyramidCalibration',
} as const;

// ── Lab type ─────────────────────────────────────────────────────────────────

export interface LabColor {
  L: number;
  a: number;
  b: number;
}
