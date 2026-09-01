import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playClick } from '@/lib/audio';
import { exportToPDF } from '@/lib/pdf';

export default function PackageManagerScreen() {
  const { setScreen, categories, addWordToCategory, removeWordFromCategory, addCategory, removeCategory, nextWordOverride } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(categories[0]?.id ?? null);
  const [newWord, setNewWord] = useState('');
  const [newClue, setNewClue] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);

  const handleAddWord = (catId: string) => {
    if (!newWord.trim() || !newClue.trim()) return;
    playClick();
    addWordToCategory(catId, newWord.trim(), newClue.trim());
    setNewWord('');
    setNewClue('');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    playClick();
    addCategory(newCatName.trim());
    setNewCatName('');
    setShowNewCat(false);
  };

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col">
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => { playClick(); setScreen('home'); }} className="w-10 h-10 rounded-xl bg-[#2A1B3D] flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-xl">Gestionar Palabras</h1>
        </div>
        <button
          onClick={() => { playClick(); exportToPDF(categories); }}
          className="flex items-center gap-2 text-yellow-400 text-sm font-medium bg-yellow-400/10 px-3 py-2 rounded-xl hover:bg-yellow-400/20 transition-all"
        >
          <FileText size={15} />
          PDF
        </button>
      </header>

      {nextWordOverride && (
        <div className="mx-6 mb-3 bg-green-400/10 border border-green-400/30 rounded-xl px-4 py-3">
          <p className="text-green-400 text-xs font-semibold">⚡ Próxima palabra inyectada:</p>
          <p className="text-white text-sm font-medium mt-0.5">{nextWordOverride.word} <span className="text-gray-400">/</span> {nextWordOverride.clue}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
        {categories.map((cat) => {
          const expanded = expandedId === cat.id;
          return (
            <div key={cat.id} className="bg-[#2A1B3D] rounded-2xl overflow-hidden border border-[#3A2B4D]">
              <button
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#3A2B4D] transition-colors"
                onClick={() => { playClick(); setExpandedId(expanded ? null : cat.id); }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-sm">{cat.name}</span>
                  <span className="text-xs text-gray-500 bg-[#130624] px-2 py-0.5 rounded-full">{cat.words.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); playClick(); removeCategory(cat.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </div>
              </button>

              {expanded && (
                <div className="border-t border-[#3A2B4D]">
                  {/* Add word form */}
                  <div className="px-4 py-3 bg-[#1E1035] space-y-2">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Añadir par</p>
                    <div className="flex gap-2">
                      <input
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        placeholder="Palabra (Civil ve esto)"
                        className="flex-1 bg-[#2A1B3D] border border-[#3A2B4D] rounded-xl px-3 py-2.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-green-400/60 transition-colors"
                      />
                      <input
                        value={newClue}
                        onChange={(e) => setNewClue(e.target.value)}
                        placeholder="Pista (Impostor ve esto)"
                        className="flex-1 bg-[#2A1B3D] border border-[#3A2B4D] rounded-xl px-3 py-2.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-400/60 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddWord(cat.id)}
                      />
                      <button
                        onClick={() => handleAddWord(cat.id)}
                        className="w-10 h-10 rounded-xl bg-green-400 text-[#130624] flex items-center justify-center hover:bg-green-300 active:scale-95 transition-all shrink-0"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Word list */}
                  {cat.words.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-600 text-sm">Sin palabras aún</div>
                  ) : (
                    <div className="divide-y divide-[#3A2B4D]">
                      {cat.words.map((w) => (
                        <div key={w.id} className="flex items-center px-4 py-3 group">
                          <span className="flex-1 text-white text-sm font-medium">{w.word}</span>
                          <span className="text-gray-500 text-xs mx-2">→</span>
                          <span className="flex-1 text-gray-400 text-sm italic">{w.clue}</span>
                          <button
                            onClick={() => { playClick(); removeWordFromCategory(cat.id, w.id); }}
                            className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add category */}
        {showNewCat ? (
          <div className="bg-[#2A1B3D] rounded-2xl px-4 py-4 border border-green-400/30 space-y-3">
            <p className="text-white font-semibold text-sm">Nueva categoría</p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nombre de la categoría..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 bg-[#130624] border border-[#3A2B4D] rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-400/60 transition-colors"
              />
              <button onClick={handleAddCategory} className="px-4 py-2.5 rounded-xl bg-green-400 text-[#130624] font-bold text-sm hover:bg-green-300 transition-all">
                Crear
              </button>
              <button onClick={() => setShowNewCat(false)} className="px-4 py-2.5 rounded-xl bg-[#130624] text-gray-400 font-bold text-sm hover:text-white transition-all">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { playClick(); setShowNewCat(true); }}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-[#3A2B4D] text-gray-500 font-medium text-sm flex items-center justify-center gap-2 hover:border-green-400/40 hover:text-green-400 transition-all"
          >
            <Plus size={18} />
            Nueva categoría
          </button>
        )}
      </div>
    </div>
  );
}
