import { useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playTick, playClick } from '@/lib/audio';

interface Props {
  candidates: string[];
  onClose: () => void;
}

export default function TiebreakModal({ candidates, onClose }: Props) {
  const { players, selectedVote, selectVote, confirmTiebreakVote } = useGame();
  const [timeLeft, setTimeLeft] = useState(30);

  const candidatePlayers = players.filter((p) => candidates.includes(p.id));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        if (t <= 11) playTick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#1E1035] rounded-3xl border border-yellow-400/30 p-6 shadow-2xl shadow-yellow-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center">
            <Swords size={28} className="text-yellow-400" />
          </div>
          <h2 className="text-white font-black text-2xl">¡Empate!</h2>
          <p className="text-gray-400 text-sm text-center">Los acusados tienen 30 segundos para defenderse</p>
          <div className={`text-4xl font-black tabular-nums mt-1 ${timeLeft <= 10 ? 'text-red-400' : 'text-yellow-400'}`}>
            {timeLeft}s
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Vota entre los empatados:</p>
          {candidatePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => { playClick(); selectVote(p.id); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedVote === p.id
                  ? 'border-red-500/60 bg-red-500/10'
                  : 'border-[#3A2B4D] bg-[#2A1B3D] hover:border-[#4A3B5D]'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#130624] font-bold shrink-0"
                style={{ backgroundColor: p.avatarColor }}
              >
                {p.name[0]}
              </div>
              <span className="text-white font-semibold">{p.name}</span>
              {selectedVote === p.id && (
                <span className="ml-auto text-red-400 text-xs font-bold">SELECCIONADO</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => { if (selectedVote) { confirmTiebreakVote(); onClose(); } }}
          disabled={!selectedVote}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            selectedVote
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/30'
              : 'bg-[#2A1B3D] text-gray-600 cursor-not-allowed'
          }`}
        >
          Confirmar voto de desempate
        </button>
      </div>
    </div>
  );
}
