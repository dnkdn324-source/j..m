import { useState, useEffect, useRef } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import { COLOR_CODES, COLOR_NAMES, DEFAULT_COLOR_HEX } from '@/config';
import type { ColorCode, LabColor } from '@/config';
import { loadCalibration, saveCalibration } from '@/utils/storage';
import { rgbToLab, labToHex } from '@/utils/colorProcessing';
import type { Calibration } from '@/utils/storage';

interface CalibrationModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CalibrationModal({
  open,
  onClose,
  onComplete,
}: CalibrationModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [assignedCodes, setAssignedCodes] = useState<Set<ColorCode>>(new Set());
  const [pendingClick, setPendingClick] = useState<{ x: number; y: number } | null>(null);
  const [calibration, setCalibration] = useState<Calibration>({});
  const [existingCal, setExistingCal] = useState<Calibration | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open) {
      const existing = loadCalibration();
      setExistingCal(existing);
      setCalibration(existing || {});
      setAssignedCodes(new Set(Object.keys(existing || {}) as ColorCode[]));
    }
  }, [open]);

  if (!open) return null;

  const handleImageSelected = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      setImageUrl(dataUrl);
    };
    img.src = dataUrl;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageEl) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setPendingClick({ x, y });
  };

  const assignCode = (code: ColorCode) => {
    if (!pendingClick || !imageEl) return;

    // Sample a small region around the click point
    const sampleRadius = 15;
    const canvas = document.createElement('canvas');
    canvas.width = imageEl.width;
    canvas.height = imageEl.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageEl, 0, 0);

    const lValues: number[] = [];
    const aValues: number[] = [];
    const bValues: number[] = [];

    for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
      for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
        const px = Math.round(pendingClick.x + dx);
        const py = Math.round(pendingClick.y + dy);
        if (px < 0 || px >= imageEl.width || py < 0 || py >= imageEl.height) continue;
        const pixel = ctx.getImageData(px, py, 1, 1).data;
        const lab = rgbToLab(pixel[0], pixel[1], pixel[2]);
        if (lab.L > 90 || lab.L < 10) continue;
        lValues.push(lab.L);
        aValues.push(lab.a);
        bValues.push(lab.b);
      }
    }

    if (lValues.length < 10) {
      alert('No se pudieron muestrear suficientes píxeles válidos en esa zona. Intenta de nuevo.');
      setPendingClick(null);
      return;
    }

    const median = (arr: number[]) => {
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };

    const lab: LabColor = {
      L: median(lValues),
      a: median(aValues),
      b: median(bValues),
    };

    const newCal = { ...calibration, [code]: lab };
    setCalibration(newCal);
    setAssignedCodes(new Set([...assignedCodes, code]));
    setPendingClick(null);

    // Redraw canvas with markers
    drawCanvas();
  };

  const drawCanvas = () => {
    if (!canvasRef.current || !imageEl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageEl.width;
    canvas.height = imageEl.height;
    ctx.drawImage(imageEl, 0, 0);

    // Draw markers for assigned codes
    // (We don't track positions for assigned codes, just show count)
  };

  const handleSave = () => {
    if (assignedCodes.size < 8) {
      alert(`Faltan calibrar colores. Has calibrado ${assignedCodes.size}/8.`);
      return;
    }
    saveCalibration(calibration);
    onComplete();
  };

  const handleReset = () => {
    setCalibration({});
    setAssignedCodes(new Set());
    setImageUrl(null);
    setImageEl(null);
    setPendingClick(null);
  };

  const getSwatchHex = (code: ColorCode): string => {
    const calLab = calibration[code];
    if (calLab) return labToHex(calLab);
    return DEFAULT_COLOR_HEX[code];
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 flex items-center justify-center p-4">
      <div className="bg-stone-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h2 className="text-xl font-bold text-stone-800">Calibración de colores</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X size={22} className="text-stone-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!imageUrl && (
            <>
              <p className="text-stone-600 text-sm">
                Fotografia los 8 bloques sueltos sobre la mesa. Luego toca cada bloque
                y asígnale su color. Esto calibra los colores reales bajo la luz actual.
              </p>
              <CameraCapture
                onImageSelected={handleImageSelected}
                label="Foto de los 8 bloques sueltos"
              />
              {existingCal && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    Ya existe una calibración guardada ({Object.keys(existingCal).length}/8 colores).
                    Puedes repetirla si cambió la iluminación.
                  </p>
                </div>
              )}
            </>
          )}

          {imageUrl && (
            <>
              <div className="relative rounded-xl overflow-hidden border-2 border-stone-300">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="w-full cursor-crosshair"
                />
              </div>

              {pendingClick && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                  <p className="text-sm font-semibold text-amber-900 mb-3">
                    Toca el color que corresponde a esta zona:
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_CODES.map((code) => {
                      const used = assignedCodes.has(code) && !calibration[code];
                      return (
                        <button
                          key={code}
                          onClick={() => assignCode(code)}
                          disabled={used}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                            used
                              ? 'opacity-40 border-stone-200 cursor-not-allowed'
                              : 'border-stone-300 hover:border-amber-500 hover:bg-amber-100 active:scale-95'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full border border-stone-400"
                            style={{ backgroundColor: getSwatchHex(code) }}
                          />
                          <span className="text-xs font-medium text-stone-700">
                            {COLOR_NAMES[code]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {COLOR_CODES.map((code) => (
                    <div
                      key={code}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                        assignedCodes.has(code)
                          ? 'bg-green-50 border-green-300'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded border border-stone-400"
                        style={{ backgroundColor: getSwatchHex(code) }}
                      />
                      <span className="text-xs text-stone-600">
                        {COLOR_NAMES[code]}
                      </span>
                      {assignedCodes.has(code) && (
                        <Check size={14} className="text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium transition-all active:scale-95"
                >
                  <RefreshCw size={18} />
                  Reiniciar
                </button>
                <button
                  onClick={handleSave}
                  disabled={assignedCodes.size < 8}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-95"
                >
                  <Check size={20} />
                  Guardar calibración ({assignedCodes.size}/8)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
