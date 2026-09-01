import type { ColorCode, LabColor } from '@/config';
import { WEIGHT_L, WEIGHT_A, WEIGHT_B, UMBRAL_DE } from '@/config';

// ── RGB ↔ Lab conversion ─────────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs > 0.04045 ? Math.pow((cs + 0.055) / 1.055, 2.4) : cs / 12.92;
}

function linearToSrgb(c: number): number {
  const v = c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
  return Math.round(Math.max(0, Math.min(255, v * 255)));
}

export function rgbToLab(r: number, g: number, b: number): LabColor {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  // sRGB → XYZ (D65)
  let X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  let Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  let Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;

  // Normalize by D65 white point
  X /= 0.95047;
  Y /= 1.0;
  Z /= 1.08883;

  const f = (t: number): number =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

// ── Lab → Hex (for displaying calibrated colors as swatches) ─────────────────

export function labToHex(lab: LabColor): string {
  let fy = (lab.L + 16) / 116;
  let fx = lab.a / 500 + fy;
  let fz = fy - lab.b / 200;

  const invf = (t: number): number =>
    t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787;

  const Xr = invf(fx) * 0.95047;
  const Yr = invf(fy) * 1.0;
  const Zr = invf(fz) * 1.08883;

  // XYZ → linear sRGB
  const R = Xr * 3.2404542 + Yr * -1.5371385 + Zr * -0.4985314;
  const G = Xr * -0.969266 + Yr * 1.8760108 + Zr * 0.041556;
  const B = Xr * 0.0556434 + Yr * -0.2040259 + Zr * 1.0572252;

  const r = linearToSrgb(R);
  const g = linearToSrgb(G);
  const b = linearToSrgb(B);

  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Hex → RGB (for PDF swatches) ─────────────────────────────────────────────

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '');
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

// ── ΔE weighted distance ────────────────────────────────────────────────────

export function deltaE(detected: LabColor, reference: LabColor): number {
  const dL = detected.L - reference.L;
  const da = detected.a - reference.a;
  const db = detected.b - reference.b;
  return Math.sqrt(
    WEIGHT_L * dL * dL + WEIGHT_A * da * da + WEIGHT_B * db * db,
  );
}

export interface ColorMatchResult {
  code: ColorCode | null; // null = INDETERMINADO
  deltaE: number;
  lab: LabColor;
}

export function matchColor(
  detectedLab: LabColor,
  calibration: Partial<Record<ColorCode, LabColor>>,
): ColorMatchResult {
  let bestCode: ColorCode | null = null;
  let bestDE = Infinity;

  for (const code of Object.keys(calibration) as ColorCode[]) {
    const ref = calibration[code];
    if (!ref) continue;
    const de = deltaE(detectedLab, ref);
    if (de < bestDE) {
      bestDE = de;
      bestCode = code;
    }
  }

  if (bestCode === null || bestDE > UMBRAL_DE) {
    return { code: null, deltaE: bestDE, lab: detectedLab };
  }

  return { code: bestCode, deltaE: bestDE, lab: detectedLab };
}

// ── Median of an array (for robust color sampling) ───────────────────────────

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
