import type { ColorCode, Layer, LabColor } from '@/config';
import { STORAGE_KEYS } from '@/config';
import { DEFAULT_PYRAMID_PLAN } from '@/data/pyramidLayers';

export function loadPlan(): Layer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAN);
    if (!raw) return DEFAULT_PYRAMID_PLAN;
    const parsed = JSON.parse(raw) as Layer[];
    if (!Array.isArray(parsed) || parsed.length !== 7) return DEFAULT_PYRAMID_PLAN;
    return parsed;
  } catch {
    return DEFAULT_PYRAMID_PLAN;
  }
}

export function savePlan(plan: Layer[]): void {
  localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
}

export type Calibration = Partial<Record<ColorCode, LabColor>>;

export function loadCalibration(): Calibration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CALIBRATION);
    if (!raw) return null;
    return JSON.parse(raw) as Calibration;
  } catch {
    return null;
  }
}

export function saveCalibration(cal: Calibration): void {
  localStorage.setItem(STORAGE_KEYS.CALIBRATION, JSON.stringify(cal));
}

export function hasCalibration(): boolean {
  return loadCalibration() !== null;
}
