import { Category } from '../types';

const KEYS = {
  categories: 'impostor_categories',
  playerHistory: 'impostor_player_history',
} as const;

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(KEYS.categories, JSON.stringify(categories));
}

export function loadCategories(): Category[] | null {
  try {
    const raw = localStorage.getItem(KEYS.categories);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlayerHistory(names: string[]): void {
  const unique = [...new Set(names)].slice(0, 50);
  localStorage.setItem(KEYS.playerHistory, JSON.stringify(unique));
}

export function loadPlayerHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.playerHistory);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
