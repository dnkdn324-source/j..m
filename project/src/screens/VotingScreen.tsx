import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { playClick, playEliminated } from '@/lib/audio';
import TiebreakModal from '@/components/TiebreakModal';

export default function VotingScreen() {
  const { players, eliminatedIds, selectedVote, selectVote, confirmVote, roundNumber, settings } = useGame();
  const [tiebreakCandidates, setTiebreakCandidates] = useState<string[] | null>(null);
  const [individualVotes, setIndividualVotes] = useState<Record<string, string>>({});

  const activePlayers = players.filter((p) => !eliminatedIds.includes(p.id));

  const handleSelectTarget = (id: string) => {
    playClick();
    selectVote(id === selectedVote ? null as unknown as string : id);
  };

  const handleConfirm = () => {
    if (!selectedVote) return;
    playEliminated();

    // Simple tally simulation: check if it's a tie (50/50 chance for demo)
    // In a real multi-device scenario we'd collect actual votes
    // Here: group vote — just eliminate the selected player
    confirmVote();
  };

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col px-6 py-10">
      <div className="mb-6">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Ronda {roundNumber}/{settings.rounds}</p>
        <h1 className="text-white font-black text-3xl">Votación</h1>
        <p className="text-gray-400 text-sm mt-1">¿Quién creéis que es el impostor?</p>
      </div>

      {/* Players grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 content-start">
        {activePlayers.map((p) => {
          const isSelected = selectedVote === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectTarget(p.id)}
              className={`relative flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.97] ${
                isSelected
                  ? 'border-red-500/70 bg-red-500/10'
                  : 'border-[#3A2B4D] bg-[#2A1B3D] hover:border-[#4A3B5D]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-black">!</span>
                </div>
              )}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-[#130624] text-xl font-black shadow-lg"
                style={{ backgroundColor: p.avatarColor, boxShadow: isSelected ? `0 0 20px ${p.avatarColor}60` : 'none' }}
              >
                {p.name[0].toUpperCase()}
              </div>
              <span className={`font-semibold text-sm text-center px-2 truncate max-w-full ${isSelected ? 'text-red-300' : 'text-white'}`}>
                {p.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="mt-6">
        {selectedVote && (
          <p className="text-center text-gray-400 text-sm mb-3">
            Eliminando a <span className="text-red-400 font-semibold">{activePlayers.find((p) => p.id === selectedVote)?.name}</span>
          </p>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selectedVote}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all ${
            selectedVote
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-red-500/30'
              : 'bg-[#2A1B3D] text-gray-600 cursor-not-allowed'
          }`}
        >
          {selectedVote ? 'Confirmar Eliminación' : 'Selecciona un jugador'}
        </button>
      </div>

      {tiebreakCandidates && (
        <TiebreakModal candidates={tiebreakCandidates} onClose={() => setTiebreakCandidates(null)} />
      )}
    </div>
  );
}
