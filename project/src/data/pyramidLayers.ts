import type { Layer } from '@/config';

// Default placeholder plan — used only when no plan is saved in localStorage.
// Each cell is 'BL' (Blanco) as a neutral default. The user should define the
// real plan via the Plan Editor before validating.
const blankLayer = (rows: number[]): Layer =>
  rows.map((len) => Array.from({ length: len }, () => 'BL' as const));

export const DEFAULT_PYRAMID_PLAN: Layer[] = [
  blankLayer([7, 6, 5, 4, 3, 2, 1]),
  blankLayer([6, 5, 4, 3, 2, 1]),
  blankLayer([5, 4, 3, 2, 1]),
  blankLayer([4, 3, 2, 1]),
  blankLayer([3, 2, 1]),
  blankLayer([2, 1]),
  blankLayer([1]),
];
