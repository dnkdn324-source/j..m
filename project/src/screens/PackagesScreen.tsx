import { ArrowLeft, Check, FileText, Plus } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playClick } from '@/lib/audio';
import { exportToPDF } from '@/lib/pdf';

const CATEGORY_ICONS: Record<string, string> = {
  animales: '🦁', comida: '🍕', lugares: '🌍', objetos: '🔑', profesiones: '👨‍⚕️', deportes: '⚽',
};

export default function PackagesScreen() {
  const { setScreen, categories, selectedCategoryIds, toggleCategory } = useGame();

  const back = () => { playClick(); setScreen('config'); };

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col">
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={back} className="w-10 h-10 rounded-xl bg-[#2A1B3D] flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-xl">Paquetes de Palabras</h1>
        </div>
      </header>

      <div className="px-6 pb-2 flex gap-2">
        <button
          onClick={() => { playClick(); exportToPDF(categories); }}
          className="flex items-center gap-2 bg-[#2A1B3D] text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#3A2B4D] hover:text-white transition-all border border-[#3A2B4D]"
        >
          <FileText size={16} className="text-yellow-400" />
          Exportar PDF
        </button>
        <button
          onClick={() => { playClick(); setScreen('packageManager'); }}
          className="flex items-center gap-2 bg-[#2A1B3D] text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#3A2B4D] hover:text-white transition-all border border-[#3A2B4D]"
        >
          <Plus size={16} className="text-green-400" />
          Gestionar
        </button>
      </div>

      <p className="px-6 pt-4 pb-2 text-gray-400 text-xs font-semibold uppercase tracking-widest">
        Selecciona categorías ({selectedCategoryIds.length} activas)
      </p>

      <div className="px-6 grid grid-cols-2 gap-3 flex-1 overflow-y-auto pb-6">
        {categories.map((cat) => {
          const selected = selectedCategoryIds.includes(cat.id);
          const icon = CATEGORY_ICONS[cat.id] ?? '📦';
          return (
            <button
              key={cat.id}
              onClick={() => { playClick(); toggleCategory(cat.id); }}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 border-2 transition-all hover:scale-[1.02] active:scale-[0.97] ${
                selected
                  ? 'bg-green-400/10 border-green-400/60'
                  : 'bg-[#2A1B3D] border-[#3A2B4D] hover:border-[#4A3B5D]'
              }`}
            >
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                  <Check size={12} strokeWidth={3} className="text-[#130624]" />
                </div>
              )}
              <span className="text-4xl">{icon}</span>
              <div className="text-center px-2">
                <p className={`font-bold text-xs tracking-wide ${selected ? 'text-green-400' : 'text-white'}`}>
                  {cat.name}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{cat.words.length} palabras</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={back}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-[#130624] font-bold text-base hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-green-500/30"
        >
          Confirmar selección
        </button>
      </div>
    </div>
  );
}
