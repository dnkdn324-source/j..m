import { useEffect, useRef, useState } from 'react';
import { Shield, Ghost } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playReveal, playImpostor, vibrate } from '@/lib/audio';


const HOLD_DURATION = 2000;

export default function RoleRevealScreen() {
  const { players, currentRevealIndex, revealedCard, setRevealedCard, nextReveal, activeWordPair, gameMode, categories, settings } = useGame();
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdStart = useRef<number | null>(null);
  const animFrame = useRef<number>(0);
  const held = useRef(false);

  const player = players[currentRevealIndex];

  useEffect(() => {
    setRevealedCard(false);
    setHoldProgress(0);
    setIsHolding(false);
  }, [currentRevealIndex, setRevealedCard]);

  const startHold = () => {
    if (revealedCard) return;
    held.current = false;
    holdStart.current = Date.now();
    setIsHolding(true);

    const animate = () => {
      if (!holdStart.current) return;
      const elapsed = Date.now() - holdStart.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);
      if (progress >= 1 && !held.current) {
        held.current = true;
        setRevealedCard(true);
        setIsHolding(false);
        holdStart.current = null;
        if (player.role === 'impostor') {
          playImpostor();
          vibrate([100, 50, 100]);
        } else {
          playReveal();
          vibrate(80);
        }
        return;
      }
      animFrame.current = requestAnimationFrame(animate);
    };
    animFrame.current = requestAnimationFrame(animate);
  };

  const endHold = () => {
    if (!revealedCard) {
      cancelAnimationFrame(animFrame.current);
      holdStart.current = null;
      setIsHolding(false);
      setHoldProgress(0);
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  if (!player || !activeWordPair) return null;

  const isImpostor = player.role === 'impostor';
  const circumference = 2 * Math.PI * 54;
  const categoryName = categories.find(c => c.words.some(w => w.id === activeWordPair.id))?.name ?? '';

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col items-center justify-between py-12 px-6">
      {/* Progress */}
      <div className="w-full flex items-center gap-2">
        {players.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < currentRevealIndex ? 'bg-green-400' : i === currentRevealIndex ? 'bg-white' : 'bg-[#2A1B3D]'}`}
          />
        ))}
      </div>

      {/* Player name */}
      <div className="text-center">
        <p className="text-gray-400 text-sm font-medium mb-2">Es el turno de</p>
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-[#130624] text-3xl font-black mb-4 shadow-2xl"
          style={{ backgroundColor: player.avatarColor, boxShadow: `0 0 30px ${player.avatarColor}50` }}
        >
          {player.name[0].toUpperCase()}
        </div>
        <h2 className="text-white font-black text-3xl">{player.name}</h2>
      </div>

      {/* Card area */}
      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        {!revealedCard ? (
          <>
            {/* Hold card */}
            <div
              className={`w-full aspect-[3/4] rounded-3xl bg-[#2A1B3D] border-2 flex flex-col items-center justify-center gap-4 cursor-pointer select-none transition-all ${
                isHolding ? 'border-white/40 scale-95' : 'border-[#3A2B4D] hover:border-[#5A4B6D]'
              }`}
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={(e) => { e.preventDefault(); startHold(); }}
              onTouchEnd={endHold}
              onTouchCancel={endHold}
            >
              {/* SVG progress circle */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#3A2B4D" strokeWidth="6" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={isHolding ? '#4ADE80' : '#5A4B6D'}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - holdProgress)}
                    strokeLinecap="round"
                    className="transition-colors"
                  />
                </svg>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="text-4xl">🎭</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm font-medium">
                {isHolding ? 'Manteniendo...' : 'Mantén presionado para revelar'}
              </p>
            </div>
            <p className="text-gray-600 text-xs text-center">Solo tú debes ver tu carta</p>
          </>
        ) : (
          <div className={`w-full aspect-[3/4] rounded-3xl border-2 flex flex-col items-center justify-center gap-5 animate-[fadeIn_0.4s_ease] ${
            isImpostor
              ? 'bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-500/60'
              : 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500/60'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isImpostor ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
              {isImpostor
                ? <Ghost size={40} className="text-red-400" />
                : <Shield size={40} className="text-blue-400" />}
            </div>
            <div className="text-center px-6">
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isImpostor ? 'text-red-400' : 'text-blue-400'}`}>
                {isImpostor ? '🔴 IMPOSTOR' : '🔵 CIVIL'}
              </p>
              {isImpostor ? (
                <>
                  {gameMode === 'classic' && <p className="text-gray-400 text-xs mb-1">Categoría: ???</p>}
                  <p className="text-gray-300 text-sm mb-1">{settings.showClue ? 'Tu pista es:' : 'No tienes pista'}</p>
                  {settings.showClue && (
                    <p className="text-white font-black text-2xl">{activeWordPair.clue}</p>
                  )}
                </>
              ) : (
                <>
                  {gameMode === 'classic' && (
                    <p className="text-gray-400 text-xs mb-1">Categoría: {categoryName}</p>
                  )}
                  <p className="text-gray-300 text-sm mb-1">Tu palabra es:</p>
                  <p className="text-white font-black text-2xl">{activeWordPair.word}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => { if (revealedCard) nextReveal(); }}
        disabled={!revealedCard}
        className={`w-full max-w-xs py-4 rounded-2xl font-bold text-base transition-all ${
          revealedCard
            ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-[#130624] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/30'
            : 'bg-[#2A1B3D] text-gray-600 cursor-not-allowed'
        }`}
      >
        {currentRevealIndex < players.length - 1 ? 'Siguiente jugador →' : 'Comenzar debate →'}
      </button>
    </div>
  );
}
