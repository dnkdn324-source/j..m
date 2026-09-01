import { useState, useRef, useEffect } from 'react';
import { Download, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { BlockResult } from '@/utils/contourDetection';
import type { DetectionResult } from '@/utils/contourDetection';
import { COLOR_NAMES, DEFAULT_COLOR_HEX } from '@/config';
import type { ColorCode } from '@/config';
import { labToHex } from '@/utils/colorProcessing';
import type { Calibration } from '@/utils/storage';

interface ResultsOverlayProps {
  detection: DetectionResult;
  calibration: Calibration;
  layerNumber: number;
  onExport: () => void;
}

interface Tooltip {
  block: BlockResult;
  x: number;
  y: number;
}

export default function ResultsOverlay({
  detection,
  calibration,
  layerNumber,
  onExport,
}: ResultsOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const { blocks, width, height, totalDetected, totalExpected } = detection;

  const correctCount = blocks.filter((b) => b.status === 'CORRECTO').length;
  const errorCount = blocks.filter((b) => b.status === 'INCORRECTO').length;
  const indeterminateCount = blocks.filter(
    (b) => b.status === 'INDETERMINADO',
  ).length;

  useEffect(() => {
    drawOverlay();
  }, [detection]);

  const getSwatchHex = (code: ColorCode | null, labFallback?: { L: number; a: number; b: number }): string => {
    if (code && calibration[code]) {
      return labToHex(calibration[code]!);
    }
    if (code) {
      return DEFAULT_COLOR_HEX[code];
    }
    if (labFallback) {
      return labToHex(labFallback);
    }
    return '#888888';
  };

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Draw the warped image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);

      // Draw contours
      for (const block of blocks) {
        ctx.beginPath();
        const poly = block.polygon;
        if (poly.length === 0) continue;
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();

        if (block.status === 'CORRECTO') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.fill();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (block.status === 'INCORRECTO') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
          ctx.fill();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    };
    img.src = detection.warpedImageUrl;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find clicked block
    for (const block of blocks) {
      if (block.status === 'CORRECTO') continue;
      if (pointInPolygon(x, y, block.polygon)) {
        setTooltip({ block, x, y });
        return;
      }
    }
    setTooltip(null);
  };

  const pointInPolygon = (
    x: number,
    y: number,
    polygon: { x: number; y: number }[],
  ): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;
      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const errorBlocks = blocks.filter((b) => b.status !== 'CORRECTO');

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-stone-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-stone-700">
            Capa {layerNumber}: {correctCount}/{totalExpected} correctos
          </span>
          <div className="flex gap-3 text-sm">
            <span className="text-green-600 font-medium">{correctCount} OK</span>
            {errorCount > 0 && (
              <span className="text-red-600 font-medium">{errorCount} errores</span>
            )}
            {indeterminateCount > 0 && (
              <span className="text-orange-600 font-medium">
                {indeterminateCount} indet.
              </span>
            )}
          </div>
        </div>
        <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(correctCount / totalExpected) * 100}%` }}
          />
        </div>
      </div>

      {/* Count mismatch warning */}
      {totalDetected !== totalExpected && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-xl">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-800 font-medium">
            Se detectaron {totalDetected} bloques, se esperaban {totalExpected}.
            Vuelve a fotografiar la capa.
          </p>
        </div>
      )}

      {/* Image with overlay */}
      <div className="relative rounded-xl overflow-hidden border-2 border-stone-300 bg-stone-900">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer"
        />
        {tooltip && (
          <div
            className="absolute z-10 bg-stone-900/95 text-white p-3 rounded-lg shadow-xl text-xs max-w-[220px] pointer-events-none"
            style={{
              left: `${(tooltip.x / width) * 100}%`,
              top: `${(tooltip.y / height) * 100}%`,
              transform: 'translate(8px, 8px)',
            }}
          >
            {tooltip.block.status === 'INDETERMINADO' ? (
              <p className="text-orange-300">
                No se pudo identificar el color con seguridad. Vuelve a fotografiar.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-white/40 shrink-0"
                    style={{
                      backgroundColor: getSwatchHex(
                        tooltip.block.detectedCode,
                        tooltip.block.detectedLab,
                      ),
                    }}
                  />
                  <span>
                    Detectado: {tooltip.block.detectedCode ? COLOR_NAMES[tooltip.block.detectedCode] : 'Indet.'} (
                    {getSwatchHex(tooltip.block.detectedCode, tooltip.block.detectedLab)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-white/40 shrink-0"
                    style={{
                      backgroundColor: getSwatchHex(tooltip.block.expectedCode),
                    }}
                  />
                  <span>
                    Esperado: {COLOR_NAMES[tooltip.block.expectedCode]} (
                    {getSwatchHex(tooltip.block.expectedCode)})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error list */}
      {errorBlocks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-stone-700">Lista de errores</h3>
          {errorBlocks.map((block, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                block.status === 'INCORRECTO'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              {block.status === 'INCORRECTO' ? (
                <XCircle className="text-red-500 shrink-0" size={20} />
              ) : (
                <HelpCircle className="text-orange-500 shrink-0" size={20} />
              )}
              <div className="flex-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-stone-600">
                  Fila {block.row + 1}, Col {block.col + 1}
                </span>
                {block.status === 'INCORRECTO' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded border border-stone-400"
                        style={{
                          backgroundColor: getSwatchHex(
                            block.detectedCode,
                            block.detectedLab,
                          ),
                        }}
                      />
                      <span className="text-stone-600">
                        {block.detectedCode ? COLOR_NAMES[block.detectedCode] : 'Indet.'} (
                        {getSwatchHex(block.detectedCode, block.detectedLab)})
                      </span>
                    </div>
                    <span className="text-stone-400">→</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded border border-stone-400"
                        style={{ backgroundColor: getSwatchHex(block.expectedCode) }}
                      />
                      <span className="text-stone-600">
                        {COLOR_NAMES[block.expectedCode]} (
                        {getSwatchHex(block.expectedCode)})
                      </span>
                    </div>
                  </>
                )}
                {block.status === 'INDETERMINADO' && (
                  <span className="text-orange-600">
                    No se pudo identificar el color con seguridad
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {errorBlocks.length === 0 && totalDetected === totalExpected && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-xl">
          <CheckCircle2 className="text-green-600 shrink-0" size={22} />
          <p className="text-sm text-green-800 font-medium">
            Todos los bloques de la capa {layerNumber} son correctos.
          </p>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={onExport}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold transition-all active:scale-95"
      >
        <Download size={20} />
        Exportar reporte PDF
      </button>
    </div>
  );
}
