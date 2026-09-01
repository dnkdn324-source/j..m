import { useEffect } from 'react';
import { Shield, Ghost, AlertTriangle } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playClick, playVictory } from '@/lib/audio';

export default function RoundResultScreen() {
  const { players, lastEliminatedId, eliminatedIds, continueAfterResult, settings, roundNumber } = useGame();

  const eliminated = players.find((p) => p.id === lastEliminatedId);
  const allElim = [...eliminatedIds];
  const activePlayers = players.filter((p) => !allElim.includes(p.id));
  const activeImpostors = activePlayers.filter((p) => p.role === 'impostor');
  const activeCivils = activePlayers.filter((p) => p.role === 'civil');

  const isImpostor = eliminated?.role === 'impostor';
  const impostorsLeft = activeImpostors.length;
  const roundsLeft = settings.rounds - roundNumber;

  const gameWillEnd = impostorsLeft === 0 || impostorsLeft >= activeCivils.length || roundNumber >= settings.rounds;

  useEffect(() => {
    if (isImpostor && impostorsLeft === 0) playVictory();
  }, []);

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col items-center justify-between py-12 px-6">
      {/* Countdown reveal */}
      <div className="text-center">
        <p className="text-gray-400 text-sm font-medium">Jugador eliminado</p>
      </div>

      {/* Main reveal */}
      <div className="flex flex-col items-center gap-6">
        <div className={`relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl ${
          isImpostor ? 'bg-red-500/20' : 'bg-blue-500/20'
        }`} style={{
          boxShadow: isImpostor ? '0 0 60px rgba(239,68,68,0.3)' : '0 0 60px rgba(59,130,246,0.3)'
        }}>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-[#130624] text-4xl font-black"
            style={{ backgroundColor: eliminated?.avatarColor }}
          >
            {eliminated?.name?.[0].toUpperCase()}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#130624] ${
            isImpostor ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {isImpostor ? <Ghost size={18} className="text-white" /> : <Shield size={18} className="text-white" />}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-white font-black text-3xl mb-1">{eliminated?.name}</h2>
          {isImpostor ? (
            <>
              <p className="text-red-400 font-bold text-lg">¡Era el IMPOSTOR!</p>
              {impostorsLeft > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-2.5">
                  <AlertTriangle size={16} className="text-yellow-400" />
                  <p className="text-yellow-300 text-sm font-medium">
                    Aún {impostorsLeft === 1 ? 'queda' : 'quedan'} <strong>{impostorsLeft}</strong> impostor{impostorsLeft > 1 ? 'es' : ''} oculto{impostorsLeft > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-blue-400 font-bold text-lg">Era un Civil inocente</p>
              <div className="mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                <AlertTriangle size={16} className="text-red-400" />
                <p className="text-red-300 text-sm font-medium">¡El impostor sigue libre!</p>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3 w-full max-w-xs">
          <div className="flex-1 bg-[#2A1B3D] rounded-xl p-3 text-center">
            <p className="text-green-400 font-black text-2xl">{activeCivils.length}</p>
            <p className="text-gray-400 text-xs">Civiles</p>
          </div>
          <div className="flex-1 bg-[#2A1B3D] rounded-xl p-3 text-center">
            <p className="text-red-400 font-black text-2xl">{impostorsLeft}</p>
            <p className="text-gray-400 text-xs">Impostores</p>
          </div>
          <div className="flex-1 bg-[#2A1B3D] rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-black text-2xl">{roundsLeft}</p>
            <p className="text-gray-400 text-xs">Rondas rest.</p>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={() => { playClick(); continueAfterResult(); }}
        className="w-full max-w-xs py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-[#130624] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/30"
      >
        {gameWillEnd ? 'Ver resultado final →' : 'Continuar debate →'}
      </button>
    </div>
  );
}
