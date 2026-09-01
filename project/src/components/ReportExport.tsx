import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { DetectionResult } from '@/utils/contourDetection';
import { COLOR_NAMES, DEFAULT_COLOR_HEX } from '@/config';
import type { ColorCode } from '@/config';
import { labToHex, hexToRgb } from '@/utils/colorProcessing';
import type { Calibration } from '@/utils/storage';

interface ReportExportProps {
  detection: DetectionResult;
  calibration: Calibration;
  layerNumber: number;
  overlayContainerId: string;
}

export async function exportReportPDF({
  detection,
  calibration,
  layerNumber,
  overlayContainerId,
}: ReportExportProps): Promise<void> {
  const { blocks, totalExpected } = detection;
  const correctCount = blocks.filter((b) => b.status === 'CORRECTO').length;
  const errorCount = blocks.filter((b) => b.status !== 'CORRECTO').length;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  let y = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Validación - Pirámide', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Capa ${layerNumber}`, margin, y);
  y += 6;
  doc.text(
    `Bloques correctos: ${correctCount}/${totalExpected}. Errores: ${errorCount}.`,
    margin,
    y,
  );
  y += 10;

  // Capture overlay image
  const overlayEl = document.getElementById(overlayContainerId);
  if (overlayEl) {
    try {
      const canvas = await html2canvas(overlayEl, {
        backgroundColor: '#1c1917',
        scale: 1,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', margin, y, imgWidth, Math.min(imgHeight, 120));
      y += Math.min(imgHeight, 120) + 8;
    } catch {
      doc.text('(No se pudo capturar la imagen del overlay)', margin, y);
      y += 8;
    }
  }

  // Table header
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Posición', margin, y);
  doc.text('Detectado', margin + 35, y);
  doc.text('Esperado', margin + 95, y);
  doc.text('Estado', margin + 155, y);
  y += 5;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const getHex = (code: ColorCode | null, labFallback?: { L: number; a: number; b: number }): string => {
    if (code && calibration[code]) return labToHex(calibration[code]!);
    if (code) return DEFAULT_COLOR_HEX[code];
    if (labFallback) return labToHex(labFallback);
    return '#888888';
  };

  for (const block of blocks) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }

    const posText = `F${block.row + 1}, C${block.col + 1}`;
    const detHex = getHex(block.detectedCode, block.detectedLab);
    const expHex = getHex(block.expectedCode);
    const detName = block.detectedCode ? COLOR_NAMES[block.detectedCode] : 'Indet.';
    const expName = COLOR_NAMES[block.expectedCode];
    const stateText =
      block.status === 'CORRECTO'
        ? 'CORRECTO'
        : block.status === 'INCORRECTO'
          ? 'INCORRECTO'
          : 'INDETERMINADO';

    // Position
    doc.text(posText, margin, y);

    // Detected swatch + text
    const detRgb = hexToRgb(detHex);
    doc.setFillColor(detRgb.r, detRgb.g, detRgb.b);
    doc.rect(margin + 35, y - 4, 5, 5, 'F');
    doc.text(`${detName} (${detHex})`, margin + 42, y);

    // Expected swatch + text
    const expRgb = hexToRgb(expHex);
    doc.setFillColor(expRgb.r, expRgb.g, expRgb.b);
    doc.rect(margin + 95, y - 4, 5, 5, 'F');
    doc.text(`${expName} (${expHex})`, margin + 102, y);

    // State
    doc.text(stateText, margin + 155, y);

    y += 7;
  }

  // Summary
  if (y > pageHeight - 30) {
    doc.addPage();
    y = margin;
  }
  y += 5;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `Resumen: Bloques correctos: ${correctCount}/${totalExpected}. Errores: ${errorCount}.`,
    margin,
    y,
  );

  doc.save(`reporte-capa-${layerNumber}.pdf`);
}
