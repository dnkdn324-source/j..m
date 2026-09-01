import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, UserCircle2 } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playClick } from '@/lib/audio';

interface Props {
  onClose: () => void;
}

export default function PlayerModal({ onClose }: Props) {
  const { players, addPlayer, removePlayer, playerHistory } = useGame();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestions = input.trim()
    ? playerHistory.filter((n) => n.toLowerCase().includes(input.toLowerCase()) && !players.find((p) => p.name === n))
    : playerHistory.filter((n) => !players.find((p) => p.name === n)).slice(0, 5);

  const handleAdd = (name: string = input) => {
    if (!name.trim()) return;
    playClick();
    addPlayer(name.trim());
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#1E1035] rounded-t-3xl border-t border-[#3A2B4D] flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#3A2B4D]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A2B4D]">
          <h2 className="text-white font-bold text-xl">Jugadores</h2>
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-sm font-semibold bg-green-400/10 px-3 py-1 rounded-full">
              {players.length} / 12
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Players list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {players.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <UserCircle2 size={40} className="text-gray-600" />
              <p className="text-gray-500 text-sm">Añade al menos 3 jugadores</p>
            </div>
          )}
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-[#2A1B3D] rounded-xl px-4 py-3 group">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#130624] font-bold text-sm shrink-0"
                style={{ backgroundColor: p.avatarColor }}
              >
                {p.name[0].toUpperCase()}
              </div>
              <span className="flex-1 text-white font-medium text-sm truncate">{p.name}</span>
              <button
                onClick={() => { playClick(); removePlayer(p.id); }}
                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 pb-4 pt-3 border-t border-[#3A2B4D] relative">
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-6 right-6 mb-2 bg-[#2A1B3D] border border-[#3A2B4D] rounded-xl overflow-hidden shadow-xl z-10">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); handleAdd(s); }}
                  className="w-full text-left px-4 py-2.5 text-white text-sm hover:bg-[#3A2B4D] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Nombre del jugador..."
              className="flex-1 bg-[#2A1B3D] border border-[#3A2B4D] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-400/60 transition-colors"
            />
            <button
              onClick={() => handleAdd()}
              className="w-12 h-12 rounded-xl bg-green-400 text-[#130624] flex items-center justify-center hover:bg-green-300 active:scale-95 transition-all shrink-0"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
