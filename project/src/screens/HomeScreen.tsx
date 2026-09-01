import { Swords, Package, HelpCircle, Settings, Gamepad2 } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { playClick } from '@/lib/audio';

export default function HomeScreen() {
  const { setScreen } = useGame();

  const go = (screen: Parameters<typeof setScreen>[0]) => {
    playClick();
    setScreen(screen);
  };

  return (
    <div className="min-h-screen bg-[#130624] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <button onClick={() => go('config')} className="w-10 h-10 rounded-xl bg-[#2A1B3D] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3A2B4D] transition-all">
          <Settings size={20} />
        </button>
        <div />
        <button className="w-10 h-10 rounded-xl bg-[#2A1B3D] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3A2B4D] transition-all">
          <HelpCircle size={20} />
        </button>
      </header>

      {/* Logo */}
      <div className="flex flex-col items-center flex-1 justify-center px-6 gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/10 border border-yellow-400/30 flex items-center justify-center shadow-2xl shadow-yellow-500/20">
              <Swords size={56} className="text-yellow-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 border-2 border-[#130624] animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black text-yellow-400 tracking-tight">IMPOSTOR</h1>
            <p className="text-gray-400 text-sm mt-1 font-medium">¿Quién es el espía entre vosotros?</p>
          </div>
        </div>

        {/* Main actions */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={() => go('config')}
            className="relative w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-[#130624] font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-center gap-3">
              <Gamepad2 size={22} />
              <span>Jugar Offline</span>
            </div>
          </button>

          <button
            disabled
            className="w-full py-5 rounded-2xl bg-[#2A1B3D] border border-[#3A2B4D] text-gray-400 font-bold text-lg cursor-not-allowed opacity-50 flex items-center justify-center gap-3"
          >
            <span>🌐</span>
            <span>Jugar Online</span>
            <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">Próximamente</span>
          </button>
        </div>

        {/* Secondary actions */}
        <div className="w-full max-w-sm flex gap-3">
          <button
            onClick={() => go('packages')}
            className="flex-1 py-4 rounded-2xl bg-[#2A1B3D] border border-[#3A2B4D] text-white font-semibold hover:bg-[#3A2B4D] hover:border-green-400/40 active:scale-[0.97] transition-all flex flex-col items-center gap-2"
          >
            <Package size={22} className="text-green-400" />
            <span className="text-sm">Paquetes</span>
          </button>
          <button
            onClick={() => go('packageManager')}
            className="flex-1 py-4 rounded-2xl bg-[#2A1B3D] border border-[#3A2B4D] text-white font-semibold hover:bg-[#3A2B4D] hover:border-yellow-400/40 active:scale-[0.97] transition-all flex flex-col items-center gap-2"
          >
            <Settings size={22} className="text-yellow-400" />
            <span className="text-sm">Gestionar</span>
          </button>
        </div>
      </div>

      <footer className="py-6 text-center text-gray-600 text-xs font-medium">
        v1.0 &nbsp;·&nbsp; El juego del espía
      </footer>
    </div>
  );
}
