export interface WordPair {
  id: string;
  word: string;
  clue: string;
}

export interface Category {
  id: string;
  name: string;
  unlocked: boolean;
  words: WordPair[];
}

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  role: 'civil' | 'impostor';
  isEliminated: boolean;
}

export interface Settings {
  impostorCount: number;
  showClue: boolean;
  rounds: number;
  timeMinutes: number;
}

export type Screen =
  | 'home'
  | 'config'
  | 'packages'
  | 'packageManager'
  | 'reveal'
  | 'debate'
  | 'voting'
  | 'roundResult'
  | 'gameOver';

export type GameMode = 'classic' | 'mysterious';
