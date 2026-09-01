import React, { createContext, useContext, useState, useCallback } from 'react';
import { Category, GameMode, Player, Screen, Settings, WordPair } from '../types';
import { DEFAULT_CATEGORIES, AVATAR_COLORS } from '../defaultData';
import { loadCategories, saveCategories, savePlayerHistory, loadPlayerHistory } from '../lib/storage';
import { vibrate } from '../lib/audio';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface GameStore {
  screen: Screen;
  players: Player[];
  settings: Settings;
  categories: Category[];
  selectedCategoryIds: string[];
  gameMode: GameMode;
  activeWordPair: WordPair | null;
  nextWordOverride: WordPair | null;
  currentRevealIndex: number;
  revealedCard: boolean;
  selectedVote: string | null;
  eliminatedIds: string[];
  lastEliminatedId: string | null;
  roundNumber: number;
  debateTimeLeft: number;
  tiebreakCandidates: string[];
  showTiebreak: boolean;
  playerHistory: string[];

  setScreen: (s: Screen) => void;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  toggleCategory: (id: string) => void;
  setGameMode: (m: GameMode) => void;
  setNextWordOverride: (wp: WordPair | null) => void;
  startGame: () => string | null;
  nextReveal: () => void;
  setRevealedCard: (v: boolean) => void;
  selectVote: (id: string) => void;
  confirmVote: () => void;
  confirmTiebreakVote: () => void;
  continueAfterResult: () => void;
  resetGame: () => void;
  addWordToCategory: (categoryId: string, word: string, clue: string) => void;
  removeWordFromCategory: (categoryId: string, wordId: string) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  setDebateTimeLeft: (t: number) => void;
}

const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<Settings>({ impostorCount: 1, showClue: true, rounds: 5, timeMinutes: 3 });
  const [categories, setCategories] = useState<Category[]>(() => loadCategories() ?? DEFAULT_CATEGORIES);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(['animales']);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [activeWordPair, setActiveWordPair] = useState<WordPair | null>(null);
  const [nextWordOverride, setNextWordOverride] = useState<WordPair | null>(null);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [revealedCard, setRevealedCard] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [lastEliminatedId, setLastEliminatedId] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [debateTimeLeft, setDebateTimeLeft] = useState(0);
  const [tiebreakCandidates, setTiebreakCandidates] = useState<string[]>([]);
  const [showTiebreak, setShowTiebreak] = useState(false);
  const [playerHistory, setPlayerHistory] = useState<string[]>(() => loadPlayerHistory());

  const addPlayer = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const colorIndex = players.length % AVATAR_COLORS.length;
    const newPlayer: Player = {
      id: uid(),
      name: trimmed,
      avatarColor: AVATAR_COLORS[colorIndex],
      role: 'civil',
      isEliminated: false,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    const newHistory = [trimmed, ...playerHistory.filter((n) => n !== trimmed)];
    setPlayerHistory(newHistory);
    savePlayerHistory(newHistory);
  }, [players.length, playerHistory]);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  }, []);

  const startGame = useCallback((): string | null => {
    if (players.length < 3) return 'Necesitas al menos 3 jugadores.';
    if (settings.impostorCount >= players.length) return 'Debe haber más civiles que impostores.';
    const selectedCats = categories.filter((c) => selectedCategoryIds.includes(c.id));
    const allWords = selectedCats.flatMap((c) => c.words);
    if (!nextWordOverride && allWords.length === 0) return 'Los paquetes seleccionados no tienen palabras.';

    let wordPair: WordPair;
    if (nextWordOverride) {
      wordPair = nextWordOverride;
      setNextWordOverride(null);
    } else {
      wordPair = allWords[Math.floor(Math.random() * allWords.length)];
    }
    setActiveWordPair(wordPair);

    const shuffled = shuffle(players);
    const withRoles: Player[] = shuffled.map((p, i) => ({
      ...p,
      role: i < settings.impostorCount ? 'impostor' : 'civil',
      isEliminated: false,
    }));
    const reordered = shuffle(withRoles);
    setPlayers(reordered);
    setEliminatedIds([]);
    setLastEliminatedId(null);
    setCurrentRevealIndex(0);
    setRevealedCard(false);
    setSelectedVote(null);
    setRoundNumber(1);
    setDebateTimeLeft(settings.timeMinutes * 60);
    setShowTiebreak(false);
    setScreen('reveal');
    return null;
  }, [players, settings, categories, selectedCategoryIds, nextWordOverride]);

  const nextReveal = useCallback(() => {
    const nextIndex = currentRevealIndex + 1;
    setRevealedCard(false);
    if (nextIndex >= players.length) {
      setScreen('debate');
    } else {
      setCurrentRevealIndex(nextIndex);
    }
  }, [currentRevealIndex, players.length]);

  const selectVote = useCallback((id: string) => {
    setSelectedVote(id);
  }, []);

  const processElimination = useCallback((targetId: string) => {
    setLastEliminatedId(targetId);
    setEliminatedIds((prev) => [...prev, targetId]);
    setSelectedVote(null);
    setShowTiebreak(false);
    setScreen('roundResult');
  }, []);

  const confirmVote = useCallback(() => {
    if (!selectedVote) return;
    processElimination(selectedVote);
  }, [selectedVote, processElimination]);

  const confirmTiebreakVote = useCallback(() => {
    if (!selectedVote) return;
    processElimination(selectedVote);
  }, [selectedVote, processElimination]);

  const continueAfterResult = useCallback(() => {
    const allElim = [...eliminatedIds, lastEliminatedId].filter(Boolean) as string[];
    const activePlayers = players.filter((p) => !allElim.includes(p.id));
    const activeImpostors = activePlayers.filter((p) => p.role === 'impostor');
    const activeCivils = activePlayers.filter((p) => p.role === 'civil');

    if (activeImpostors.length === 0 || activeImpostors.length >= activeCivils.length || roundNumber >= settings.rounds) {
      setScreen('gameOver');
    } else {
      setRoundNumber((r) => r + 1);
      setSelectedVote(null);
      setScreen('debate');
    }
  }, [eliminatedIds, lastEliminatedId, players, roundNumber, settings.rounds]);

  const resetGame = useCallback(() => {
    setScreen('home');
    setPlayers([]);
    setActiveWordPair(null);
    setNextWordOverride(null);
    setEliminatedIds([]);
    setLastEliminatedId(null);
    setRoundNumber(1);
    setSelectedVote(null);
    setShowTiebreak(false);
  }, []);

  const persistCategories = useCallback((cats: Category[]) => {
    setCategories(cats);
    saveCategories(cats);
  }, []);

  const addWordToCategory = useCallback((categoryId: string, word: string, clue: string) => {
    const pair: WordPair = { id: uid(), word: word.trim(), clue: clue.trim() };
    setCategories((prev) => {
      const updated = prev.map((c) =>
        c.id === categoryId ? { ...c, words: [pair, ...c.words] } : c
      );
      saveCategories(updated);
      return updated;
    });
    setNextWordOverride(pair);
  }, []);

  const removeWordFromCategory = useCallback((categoryId: string, wordId: string) => {
    setCategories((prev) => {
      const updated = prev.map((c) =>
        c.id === categoryId ? { ...c, words: c.words.filter((w) => w.id !== wordId) } : c
      );
      saveCategories(updated);
      return updated;
    });
  }, []);

  const addCategory = useCallback((name: string) => {
    const cat: Category = { id: uid(), name: name.trim().toUpperCase(), unlocked: true, words: [] };
    setCategories((prev) => {
      const updated = [...prev, cat];
      saveCategories(updated);
      return updated;
    });
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCategories(updated);
      return updated;
    });
    setSelectedCategoryIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const value: GameStore = {
    screen, players, settings, categories, selectedCategoryIds, gameMode,
    activeWordPair, nextWordOverride, currentRevealIndex, revealedCard,
    selectedVote, eliminatedIds, lastEliminatedId, roundNumber,
    debateTimeLeft, tiebreakCandidates, showTiebreak, playerHistory,
    setScreen, addPlayer, removePlayer, updateSettings, toggleCategory,
    setGameMode: (m) => setGameMode(m),
    setNextWordOverride,
    startGame, nextReveal,
    setRevealedCard, selectVote, confirmVote, confirmTiebreakVote,
    continueAfterResult, resetGame,
    addWordToCategory, removeWordFromCategory, addCategory, removeCategory,
    setDebateTimeLeft,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameStore {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
