import { useState } from 'react';
import { ArrowLeft, Users, Ghost, Eye, RotateCcw, Clock, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playClick } from '@/lib/audio';
import PlayerModal from '@/components/PlayerModal';

const ROUND_OPTIONS = [3, 5, 7, 10];
const TIME_OPTIONS = [1, 2, 3, 5, 7, 10];

type ModalType = 'players' | 'rounds' | 'time' | null;

export default function ConfigScreen() {
  const { setScreen, players, settings, updateSettings, gameMode, setGameMode, startGame } = useGame();
  const [modal, setModal] = useState<ModalType>(null);
  const [error, setError] = useState('');

  const back = () => { playClick(); setScreen('home'); };

  const handleStart = () => {
    playClick();
    const err = startGame();
    if (err) setError(err);
  };

  const adjustImpostors = (delta: number) => {
    const next = Math.max(1, Math.min(settings.impostorCount + delta, Math.max(1, players.length - 2)));
    updateSettings({ impostorCount: next });
  };

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 pt-8 pb-4">
        <button onClick={back} className="w-10 h-10 rounded-xl bg-[#2A1B3D] flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-xl">Configurar Sala</h1>
      </header>

      {/* Game mode */}
      <div className="px-6 mb-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Modo de Juego</p>
        <div className="flex gap-2">
          {(['classic', 'mysterious'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { playClick(); setGameMode(m); }}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border ${
                gameMode === m
                  ? 'bg-green-400/15 border-green-400/60 text-green-400'
                  : 'bg-[#2A1B3D] border-[#3A2B4D] text-gray-400 hover:border-gray-600'
              }`}
            >
              {m === 'classic' ? '🎯 Clásico' : '🔮 Misterioso'}
            </button>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-2 px-1">
          {gameMode === 'classic' ? 'Todos conocen la categoría de la palabra.' : 'Nadie sabe la categoría. ¡Más difícil!'}
        </p>
      </div>

      {/* Settings */}
      <div className="flex-1 px-6 space-y-2 overflow-y-auto">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Ajustes</p>

        {/* Players */}
        <SettingRow
          icon={<Users size={18} className="text-green-400" />}
          label="Jugadores"
          value={`${players.length} añadidos`}
          onClick={() => { playClick(); setModal('players'); }}
          chevron
        />

        {/* Impostors */}
        <div className="bg-[#2A1B3D] rounded-2xl px-4 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <Ghost size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Impostores</p>
            <p className="text-gray-500 text-xs">Espías ocultos entre los civiles</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { playClick(); adjustImpostors(-1); }} className="w-8 h-8 rounded-lg bg-[#130624] text-white flex items-center justify-center hover:bg-red-500/20 transition-colors">
              <ChevronDown size={18} />
            </button>
            <span className="text-white font-bold text-lg w-5 text-center">{settings.impostorCount}</span>
            <button onClick={() => { playClick(); adjustImpostors(1); }} className="w-8 h-8 rounded-lg bg-[#130624] text-white flex items-center justify-center hover:bg-green-400/20 transition-colors">
              <ChevronUp size={18} />
            </button>
          </div>
        </div>

        {/* Show clue toggle */}
        <div className="bg-[#2A1B3D] rounded-2xl px-4 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center shrink-0">
            <Eye size={18} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Pista para el Impostor</p>
            <p className="text-gray-500 text-xs">El impostor recibe una pista relacionada</p>
          </div>
          <button
            onClick={() => { playClick(); updateSettings({ showClue: !settings.showClue }); }}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.showClue ? 'bg-green-400' : 'bg-[#130624]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${settings.showClue ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Rounds */}
        <SettingRow
          icon={<RotateCcw size={18} className="text-blue-400" />}
          label="Rondas"
          value={`${settings.rounds} rondas`}
          onClick={() => { playClick(); setModal('rounds'); }}
          chevron
        />

        {/* Time */}
        <SettingRow
          icon={<Clock size={18} className="text-purple-400" />}
          label="Duración del Debate"
          value={`${settings.timeMinutes} min`}
          onClick={() => { playClick(); setModal('time'); }}
          chevron
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Start button */}
      <div className="px-6 py-6">
        <button
          onClick={handleStart}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-[#130624] font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          Iniciar Juego
        </button>
      </div>

      {/* Modals */}
      {modal === 'players' && <PlayerModal onClose={() => setModal(null)} />}

      {modal === 'rounds' && (
        <PickerModal
          title="Número de Rondas"
          options={ROUND_OPTIONS.map((r) => ({ label: `${r} rondas`, value: r }))}
          selected={settings.rounds}
          onSelect={(v) => { updateSettings({ rounds: v }); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'time' && (
        <PickerModal
          title="Duración del Debate"
          options={TIME_OPTIONS.map((t) => ({ label: `${t} minuto${t > 1 ? 's' : ''}`, value: t }))}
          selected={settings.timeMinutes}
          onSelect={(v) => { updateSettings({ timeMinutes: v }); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function SettingRow({ icon, label, value, onClick, chevron }: {
  icon: React.ReactNode; label: string; value: string; onClick?: () => void; chevron?: boolean;
}) {
  return (
    <button onClick={onClick} className="w-full bg-[#2A1B3D] rounded-2xl px-4 py-4 flex items-center gap-4 hover:bg-[#3A2B4D] transition-colors">
      <div className="w-8 h-8 rounded-lg bg-[#130624] flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <p className="text-white font-semibold text-sm">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">{value}</span>
        {chevron && <ChevronRight size={16} className="text-gray-600" />}
      </div>
    </button>
  );
}

function PickerModal({ title, options, selected, onSelect, onClose }: {
  title: string;
  options: { label: string; value: number }[];
  selected: number;
  onSelect: (v: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#1E1035] rounded-t-3xl border-t border-[#3A2B4D] pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-[#3A2B4D]" /></div>
        <h3 className="text-white font-bold text-lg px-6 py-4 border-b border-[#3A2B4D]">{title}</h3>
        <div className="px-6 pt-3 space-y-2">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { playClick(); onSelect(o.value); }}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all border ${
                selected === o.value
                  ? 'bg-green-400/15 border-green-400/60 text-green-400'
                  : 'bg-[#2A1B3D] border-[#3A2B4D] text-gray-300 hover:border-gray-600'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
