import { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Palette,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Triangle,
  X,
} from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import CalibrationModal from '@/components/CalibrationModal';
import PlanEditor from '@/components/PlanEditor';
import ResultsOverlay from '@/components/ResultsOverlay';
import { exportReportPDF } from '@/components/ReportExport';
import {
  loadOpenCV,
  isCvReady,
} from '@/utils/opencv';
import { correctPerspective, loadImage } from '@/utils/perspectiveCorrection';
import { runDetectionPipeline } from '@/utils/contourDetection';
import type { DetectionResult } from '@/utils/contourDetection';
import {
  loadPlan,
  loadCalibration,
  hasCalibration,
} from '@/utils/storage';
import type { Calibration } from '@/utils/storage';
import {
  NUM_LAYERS,
  getExpectedBlockCount,
  getRowLengths,
  WARPED_WIDTH,
  WARPED_HEIGHT,
} from '@/config';
import type { Layer, ColorCode } from '@/config';

type AppMode = 'home' | 'validate';

interface CornerPoint {
  x: number;
  y: number;
}

export default function MainPage() {
  const [mode, setMode] = useState<AppMode>('home');
  const [cvLoaded, setCvLoaded] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [planEditorOpen, setPlanEditorOpen] = useState(false);

  // Validation state
  const [activeLayer, setActiveLayer] = useState(1);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [rawImageEl, setRawImageEl] = useState<HTMLImageElement | null>(null);
  const [cornerPoints, setCornerPoints] = useState<CornerPoint[]>([]);
  const [warpedUrl, setWarpedUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadOpenCV()
      .then(() => setCvLoaded(true))
      .catch((err) => setCvError(err.message));
  }, []);

  useEffect(() => {
    setCalibration(loadCalibration());
  }, [calibrationOpen]);

  // Reset validation state when going home
  const goHome = () => {
    setMode('home');
    setRawImageUrl(null);
    setRawImageEl(null);
    setCornerPoints([]);
    setWarpedUrl(null);
    setDetection(null);
    setDetectionError(null);
  };

  // ── Validation flow ──────────────────────────────────────────────────────

  const handlePhotoSelected = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setRawImageEl(img);
      setRawImageUrl(dataUrl);
      setCornerPoints([]);
      setWarpedUrl(null);
      setDetection(null);
      setDetectionError(null);
    };
    img.src = dataUrl;
  };

  // Draw the raw image with corner point markers
  useEffect(() => {
    if (!rawImageEl || !imageCanvasRef.current) return;
    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = rawImageEl.width;
    canvas.height = rawImageEl.height;
    ctx.drawImage(rawImageEl, 0, 0);

    // Draw corner markers
    for (let i = 0; i < cornerPoints.length; i++) {
      const p = cornerPoints[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, p.x, p.y);
    }

    // Draw connecting lines if 3 points
    if (cornerPoints.length === 3) {
      ctx.beginPath();
      ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
      ctx.lineTo(cornerPoints[1].x, cornerPoints[1].y);
      ctx.lineTo(cornerPoints[2].x, cornerPoints[2].y);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [rawImageEl, cornerPoints]);

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cornerPoints.length >= 3) return;
    if (!imageCanvasRef.current) return;
    const canvas = imageCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setCornerPoints([...cornerPoints, { x, y }]);
  };

  const handleProcess = async () => {
    if (cornerPoints.length !== 3 || !rawImageEl) return;
    setDetecting(true);
    setDetectionError(null);
    try {
      // Step 1: Perspective correction
      const warped = correctPerspective(rawImageEl, [
        cornerPoints[0],
        cornerPoints[1],
        cornerPoints[2],
      ]);
      setWarpedUrl(warped);

      // Step 2: Run detection pipeline
      const plan = loadPlan();
      const expectedLayer = plan[activeLayer - 1] as ColorCode[][];
      const cal = loadCalibration() || {};

      // White balance: we need the detected white Lab vs calibrated white Lab
      // For simplicity, we skip white balance offset if no white block was detected
      // The calibration already has the reference white Lab
      const whiteBalance = null; // White balance offset computed per-photo would need a white reference in the photo

      const result = await runDetectionPipeline(
        warped,
        expectedLayer,
        cal,
        whiteBalance,
      );
      setDetection(result);
    } catch (err) {
      setDetectionError(
        err instanceof Error ? err.message : 'Error procesando la imagen',
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleExport = () => {
    if (!detection || !calibration) return;
    exportReportPDF({
      detection,
      calibration,
      layerNumber: activeLayer,
      overlayContainerId: 'overlay-capture-container',
    });
  };

  const resetValidation = () => {
    setRawImageUrl(null);
    setRawImageEl(null);
    setCornerPoints([]);
    setWarpedUrl(null);
    setDetection(null);
    setDetectionError(null);
  };

  // ── Home screen ──────────────────────────────────────────────────────────

  if (mode === 'home') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 text-stone-100">
          <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-700 rounded-2xl mb-4 shadow-lg">
                <Triangle className="text-white" size={32} fill="currentColor" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Pirámide Validator
              </h1>
              <p className="text-stone-400 text-sm">
                Validación visual de construcción por capas
              </p>
            </div>

            {/* CV status */}
            <div className="mb-6">
              {!cvLoaded && !cvError && (
                <div className="flex items-center justify-center gap-2 p-4 bg-stone-800 rounded-xl border border-stone-700">
                  <Loader2 className="animate-spin text-amber-500" size={20} />
                  <span className="text-sm text-stone-400">
                    Cargando motor de visión...
                  </span>
                </div>
              )}
              {cvError && (
                <div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-800 rounded-xl">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-red-300 font-medium">
                      Error cargando OpenCV.js
                    </p>
                    <p className="text-xs text-red-400 mt-1">{cvError}</p>
                  </div>
                </div>
              )}
              {cvLoaded && (
                <div className="flex items-center justify-center gap-2 p-3 bg-green-950/40 border border-green-800 rounded-xl">
                  <CheckCircle2 className="text-green-400" size={18} />
                  <span className="text-sm text-green-300">
                    Motor de visión listo
                  </span>
                </div>
              )}
            </div>

            {/* Menu buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setCalibrationOpen(true);
                }}
                disabled={!cvLoaded}
                className="w-full flex items-center gap-4 p-5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl border border-stone-700 transition-all active:scale-[0.98] text-left"
              >
                <div className="w-12 h-12 bg-amber-700 rounded-xl flex items-center justify-center shrink-0">
                  <Palette className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-100">
                    Calibrar colores
                  </p>
                  <p className="text-sm text-stone-400">
                    {calibration
                      ? `${Object.keys(calibration).length}/8 colores calibrados`
                      : 'Fotografía los 8 bloques para calibrar'}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setPlanEditorOpen(true)}
                className="w-full flex items-center gap-4 p-5 bg-stone-800 hover:bg-stone-700 rounded-2xl border border-stone-700 transition-all active:scale-[0.98] text-left"
              >
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center shrink-0">
                  <Layers className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-100">
                    Editar plano de construcción
                  </p>
                  <p className="text-sm text-stone-400">
                    Define los colores de cada capa
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('validate')}
                disabled={!cvLoaded}
                className="w-full flex items-center gap-4 p-5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl transition-all active:scale-[0.98] text-left"
              >
                <div className="w-12 h-12 bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                  <Camera className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    Validar una capa
                  </p>
                  <p className="text-sm text-amber-100/80">
                    Toma una foto y compara contra el plano
                  </p>
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="mt-8 p-4 bg-stone-800/50 rounded-xl border border-stone-700">
              <p className="text-xs text-stone-400 leading-relaxed">
                Procesamiento 100% en el navegador. 7 capas, 84 bloques, 8 colores.
                Sin backend ni APIs externas.
              </p>
            </div>
          </div>
        </div>

        <CalibrationModal
          open={calibrationOpen}
          onClose={() => setCalibrationOpen(false)}
          onComplete={() => {
            setCalibrationOpen(false);
            setCalibration(loadCalibration());
          }}
        />
        <PlanEditor
          open={planEditorOpen}
          onClose={() => setPlanEditorOpen(false)}
        />
      </>
    );
  }

  // ── Validation screen ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goHome}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 font-medium"
          >
            <X size={20} />
            Inicio
          </button>
          <h1 className="text-lg font-bold text-stone-800">
            Validar Capa {activeLayer}
          </h1>
        </div>

        {/* Layer selector */}
        {!rawImageUrl && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-stone-600 mb-2">
              Selecciona la capa a validar:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: NUM_LAYERS }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setActiveLayer(n)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    activeLayer === n
                      ? 'bg-amber-700 text-white shadow-md'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  {n}
                  <span className="text-xs font-normal opacity-80 block">
                    {getExpectedBlockCount(n)} bl.
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calibration warning */}
        {!hasCalibration() && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-amber-800 font-medium">
                No hay calibración de colores
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Sin calibración, la detección usará los colores de referencia
                por defecto. Recomendamos calibrar primero.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Photo + corners */}
        {!detection && (
          <>
            {!rawImageUrl && (
              <div className="space-y-4">
                <CameraCapture
                  onImageSelected={handlePhotoSelected}
                  label={`Foto de la capa ${activeLayer}`}
                />
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <strong>Instrucciones:</strong> Fotografía la capa desde arriba,
                    aislada. Luego toca las 3 esquinas exteriores del triángulo
                    para enderezar la foto.
                  </p>
                </div>
                <div className="p-3 bg-stone-100 rounded-lg">
                  <p className="text-xs text-stone-500">
                    Esta capa tiene {getExpectedBlockCount(activeLayer)} bloques
                    en {getRowLengths(activeLayer).length} filas.
                  </p>
                </div>
              </div>
            )}

            {rawImageUrl && (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border-2 border-stone-300 bg-stone-900">
                  <canvas
                    ref={imageCanvasRef}
                    onClick={handleImageClick}
                    className={`w-full ${
                      cornerPoints.length >= 3 ? 'cursor-default' : 'cursor-crosshair'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          cornerPoints.length >= n
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600">
                    {cornerPoints.length === 0 && 'Toca la primera esquina del triángulo'}
                    {cornerPoints.length === 1 && 'Toca la segunda esquina'}
                    {cornerPoints.length === 2 && 'Toca la tercera esquina'}
                    {cornerPoints.length === 3 && '3 esquinas marcadas'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetValidation}
                    className="px-4 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={cornerPoints.length !== 3 || detecting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-95"
                  >
                    {detecting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Analizar capa
                      </>
                    )}
                  </button>
                </div>

                {detectionError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-xl">
                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-800 font-medium">
                      {detectionError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 2: Results */}
        {detection && calibration && (
          <div id="overlay-capture-container">
            <ResultsOverlay
              detection={detection}
              calibration={calibration}
              layerNumber={activeLayer}
              onExport={handleExport}
            />
          </div>
        )}

        {detection && !calibration && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-amber-800 font-medium">
              Necesitas calibrar colores para ver los resultados con hex real.
            </p>
          </div>
        )}

        {/* Back to validate another layer */}
        {detection && (
          <button
            onClick={() => {
              resetValidation();
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium transition-all active:scale-95"
          >
            <Camera size={20} />
            Validar otra capa
          </button>
        )}
      </div>

      <CalibrationModal
        open={calibrationOpen}
        onClose={() => setCalibrationOpen(false)}
        onComplete={() => {
          setCalibrationOpen(false);
          setCalibration(loadCalibration());
        }}
      />
    </div>
  );
}
