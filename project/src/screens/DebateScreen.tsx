import { useEffect, useRef } from 'react';
import { SkipForward } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playTick, playClick } from '@/lib/audio';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DebateScreen() {
  const { setScreen, debateTimeLeft, setDebateTimeLeft, settings, players, eliminatedIds, roundNumber } = useGame();
  const tickedRef = useRef(false);

  const total = settings.timeMinutes * 60;
  const progress = debateTimeLeft / total;
  const isUrgent = debateTimeLeft <= 10;

  const activePlayers = players.filter((p) => !eliminatedIds.includes(p.id));

  useEffect(() => {
    if (debateTimeLeft <= 0) {
      setScreen('voting');
      return;
    }
    const id = setInterval(() => {
      setDebateTimeLeft(debateTimeLeft - 1);
      if (debateTimeLeft <= 11 && debateTimeLeft > 1) {
        playTick();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [debateTimeLeft, setScreen, setDebateTimeLeft]);

  const radius = 110;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col items-center justify-between py-12 px-6">
      {/* Round info */}
      <div className="w-full flex items-center justify-between">
        <div className="bg-[#2A1B3D] px-4 py-2 rounded-xl">
          <p className="text-gray-400 text-xs font-semibold">Ronda</p>
          <p className="text-white font-black text-lg leading-tight">{roundNumber}/{settings.rounds}</p>
        </div>
        <div className="bg-[#2A1B3D] px-4 py-2 rounded-xl text-right">
          <p className="text-gray-400 text-xs font-semibold">Jugadores</p>
          <p className="text-white font-black text-lg leading-tight">{activePlayers.length}</p>
        </div>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 264 264">
            <circle cx="132" cy="132" r={radius} fill="none" stroke="#2A1B3D" strokeWidth="12" />
            <circle
              cx="132" cy="132" r={radius}
              fill="none"
              stroke={isUrgent ? '#EF4444' : '#4ADE80'}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="flex flex-col items-center z-10">
            <span className={`font-black text-6xl tabular-nums transition-colors ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {formatTime(debateTimeLeft)}
            </span>
            <span className="text-gray-400 text-sm mt-1">
              {isUrgent ? '¡Tiempo casi agotado!' : 'Tiempo restante'}
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-300 text-base font-medium">Discutid y encontrad al impostor</p>
          <p className="text-gray-500 text-sm mt-1">Cuando acabe el tiempo, votaréis</p>
        </div>
      </div>

      {/* Active players */}
      <div className="w-full max-w-sm">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3 text-center">Jugadores activos</p>
        <div className="flex flex-wrap justify-center gap-2">
          {activePlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-2 bg-[#2A1B3D] rounded-full px-3 py-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[#130624] text-xs font-bold shrink-0"
                style={{ backgroundColor: p.avatarColor }}
              >
                {p.name[0]}
              </div>
              <span className="text-white text-xs font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={() => { playClick(); setScreen('voting'); }}
        className="flex items-center gap-2 text-gray-400 text-sm font-medium hover:text-white transition-colors py-3 px-6 rounded-xl hover:bg-[#2A1B3D]"
      >
        <SkipForward size={16} />
        Ir a votar
      </button>
    </div>
  );
}
