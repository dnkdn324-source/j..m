import { Trophy, Ghost, RotateCcw, Home } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playClick } from '@/lib/audio';

export default function GameOverScreen() {
  const { players, eliminatedIds, lastEliminatedId, resetGame, activeWordPair, startGame, setScreen } = useGame();

  const allElim = [...eliminatedIds];
  const activePlayers = players.filter((p) => !allElim.includes(p.id));
  const activeImpostors = activePlayers.filter((p) => p.role === 'impostor');
  const activeCivils = activePlayers.filter((p) => p.role === 'civil');

  const impostorsWin = activeImpostors.length >= activeCivils.length;
  const impostors = players.filter((p) => p.role === 'impostor');
  const civilians = players.filter((p) => p.role === 'civil');

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col items-center justify-between py-12 px-6">
      {/* Result banner */}
      <div className="text-center">
        <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-4 ${
          impostorsWin ? 'bg-red-500/20 shadow-2xl shadow-red-500/30' : 'bg-yellow-400/20 shadow-2xl shadow-yellow-400/30'
        }`}>
          {impostorsWin
            ? <Ghost size={48} className="text-red-400" />
            : <Trophy size={48} className="text-yellow-400" />}
        </div>
        <h1 className={`font-black text-4xl ${impostorsWin ? 'text-red-400' : 'text-yellow-400'}`}>
          {impostorsWin ? '¡Ganan los Impostores!' : '¡Ganan los Civiles!'}
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          {impostorsWin ? 'Los espías se han infiltrado con éxito.' : 'Los impostores han sido descubiertos.'}
        </p>
      </div>

      {/* Word reveal */}
      {activeWordPair && (
        <div className="w-full max-w-sm bg-[#2A1B3D] rounded-2xl p-5 border border-[#3A2B4D] text-center">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">La palabra secreta era</p>
          <p className="text-white font-black text-3xl mb-1">{activeWordPair.word}</p>
          <p className="text-gray-400 text-sm">Pista del impostor: <span className="text-yellow-400 italic">"{activeWordPair.clue}"</span></p>
        </div>
      )}

      {/* Players reveal */}
      <div className="w-full max-w-sm space-y-3">
        <div>
          <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Impostores</p>
          <div className="flex flex-wrap gap-2">
            {impostors.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1.5">
                <div className="w-5 h-5 rounded-full text-xs font-bold text-[#130624] flex items-center justify-center" style={{ backgroundColor: p.avatarColor }}>
                  {p.name[0]}
                </div>
                <span className="text-red-300 text-xs font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Civiles</p>
          <div className="flex flex-wrap gap-2">
            {civilians.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-3 py-1.5">
                <div className="w-5 h-5 rounded-full text-xs font-bold text-[#130624] flex items-center justify-center" style={{ backgroundColor: p.avatarColor }}>
                  {p.name[0]}
                </div>
                <span className="text-blue-300 text-xs font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={() => { playClick(); startGame(); }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-[#130624] font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          Jugar de nuevo
        </button>
        <button
          onClick={() => { playClick(); resetGame(); }}
          className="w-full py-4 rounded-2xl bg-[#2A1B3D] border border-[#3A2B4D] text-white font-bold text-base hover:bg-[#3A2B4D] transition-all flex items-center justify-center gap-2"
        >
          <Home size={18} />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
