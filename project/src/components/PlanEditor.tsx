import { useState, useEffect } from 'react';
import {
  Save,
  Download,
  Upload,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  COLOR_CODES,
  COLOR_NAMES,
  COLOR_INVENTORY,
  DEFAULT_COLOR_HEX,
  LAYER_ROW_LENGTHS,
  NUM_LAYERS,
  getExpectedBlockCount,
} from '@/config';
import type { ColorCode, Layer } from '@/config';
import { loadPlan, savePlan } from '@/utils/storage';
import { loadCalibration } from '@/utils/storage';
import { labToHex } from '@/utils/colorProcessing';
import type { Calibration } from '@/utils/storage';

interface PlanEditorProps {
  open: boolean;
  onClose: () => void;
}

export default function PlanEditor({ open, onClose }: PlanEditorProps) {
  const [plan, setPlan] = useState<Layer[]>([]);
  const [activeLayer, setActiveLayer] = useState(1);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setPlan(loadPlan());
      setCalibration(loadCalibration());
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const rowLengths = LAYER_ROW_LENGTHS[activeLayer - 1];

  const getSwatchHex = (code: ColorCode): string => {
    if (calibration && calibration[code]) {
      return labToHex(calibration[code]!);
    }
    return DEFAULT_COLOR_HEX[code];
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const assignColor = (code: ColorCode) => {
    if (!selectedCell) return;
    const newPlan = [...plan];
    const layer = [...newPlan[activeLayer - 1]];
    const row = [...layer[selectedCell.row]];
    row[selectedCell.col] = code;
    layer[selectedCell.row] = row;
    newPlan[activeLayer - 1] = layer;
    setPlan(newPlan);
    setSelectedCell(null);
    setSaved(false);
  };

  const handleSave = () => {
    savePlan(plan);
    setSaved(true);
  };

  const countColorUsage = (code: ColorCode): number => {
    return plan.reduce(
      (total, layer) =>
        total +
        layer.reduce(
          (layerTotal, row) =>
            layerTotal + row.filter((c) => c === code).length,
          0,
        ),
      0,
    );
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plano-piramide.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string) as Layer[];
        if (Array.isArray(imported) && imported.length === NUM_LAYERS) {
          setPlan(imported);
          setSaved(false);
        } else {
          alert('El archivo no tiene el formato correcto.');
        }
      } catch {
        alert('No se pudo leer el archivo.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalBlocks = plan.reduce(
    (total, layer) =>
      total + layer.reduce((s, row) => s + row.length, 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-40 bg-stone-900/80 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-stone-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-stone-200 sticky top-0 bg-stone-50 z-10">
          <h2 className="text-xl font-bold text-stone-800">Editor de Plano</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <ChevronLeft size={22} className="text-stone-600" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Layer selector */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: NUM_LAYERS }, (_, i) => i + 1).map((layerNum) => (
              <button
                key={layerNum}
                onClick={() => {
                  setActiveLayer(layerNum);
                  setSelectedCell(null);
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeLayer === layerNum
                    ? 'bg-amber-700 text-white shadow-md'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                Capa {layerNum}
                <span className="block text-xs font-normal opacity-80">
                  {getExpectedBlockCount(layerNum)} bloques
                </span>
              </button>
            ))}
          </div>

          {/* Triangular grid */}
          <div className="bg-white rounded-xl border-2 border-stone-200 p-4 sm:p-6">
            <p className="text-sm text-stone-500 mb-3 text-center">
              Toca una celda para asignarle un color
            </p>
            <div className="flex flex-col items-center gap-1.5">
              {rowLengths.map((rowLen, rowIdx) => (
                <div key={rowIdx} className="flex gap-1.5 justify-center">
                  {Array.from({ length: rowLen }, (_, colIdx) => {
                    const cellCode = plan[activeLayer - 1]?.[rowIdx]?.[colIdx];
                    const isSelected =
                      selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                    return (
                      <button
                        key={colIdx}
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all active:scale-90 ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-300 scale-110'
                            : 'border-stone-300 hover:border-stone-400'
                        }`}
                        style={{
                          backgroundColor: cellCode ? getSwatchHex(cellCode) : '#f5f5f4',
                        }}
                        title={cellCode ? COLOR_NAMES[cellCode] : 'Sin asignar'}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Color picker */}
          {selectedCell && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
              <p className="text-sm font-semibold text-amber-900 mb-3">
                Asignar color a fila {selectedCell.row + 1}, columna {selectedCell.col + 1}:
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {COLOR_CODES.map((code) => (
                  <button
                    key={code}
                    onClick={() => assignColor(code)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-stone-300 hover:border-amber-500 hover:bg-amber-100 transition-all active:scale-95"
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-stone-400"
                      style={{ backgroundColor: getSwatchHex(code) }}
                    />
                    <span className="text-[10px] font-medium text-stone-700 text-center leading-tight">
                      {COLOR_NAMES[code]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color usage counters */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-stone-700">
              Uso de colores en el plano completo
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLOR_CODES.map((code) => {
                const used = countColorUsage(code);
                const max = COLOR_INVENTORY[code];
                const over = used > max;
                return (
                  <div
                    key={code}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      over
                        ? 'bg-red-50 border-red-300'
                        : used === max
                          ? 'bg-green-50 border-green-300'
                          : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded border border-stone-400 shrink-0"
                      style={{ backgroundColor: getSwatchHex(code) }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-700 truncate">
                        {COLOR_NAMES[code]}
                      </p>
                      <p
                        className={`text-xs font-bold ${
                          over ? 'text-red-600' : 'text-stone-600'
                        }`}
                      >
                        {used}/{max}
                      </p>
                    </div>
                    {over && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-stone-500">
              Total de bloques en el plano: {totalBlocks}/84
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-amber-700 hover:bg-amber-800 text-white'
              }`}
            >
              {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
              {saved ? 'Plano guardado' : 'Guardar plano'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium transition-all active:scale-95"
            >
              <Download size={18} />
              Exportar
            </button>
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium transition-all active:scale-95 cursor-pointer">
              <Upload size={18} />
              Importar
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
