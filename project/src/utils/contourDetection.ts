import cv from '@techstark/opencv-js';
import { getCv } from '@/utils/opencv';
import type { LabColor, ColorCode } from '@/config';
import {
  MAX_IMG_WIDTH,
  ADAPTIVE_BLOCK_SIZE,
  ADAPTIVE_C,
  MIN_BLOCK_AREA,
  MAX_BLOCK_AREA,
  ROW_Y_TOLERANCE,
  EROSION_PERCENTAGE,
  MIN_VALID_PIXELS,
} from '@/config';
import { rgbToLab, median, matchColor } from '@/utils/colorProcessing';
import type { Calibration } from '@/utils/storage';

export interface ContourInfo {
  polygon: { x: number; y: number }[];
  centroid: { x: number; y: number };
  area: number;
  row: number;
  col: number;
}

export interface BlockResult {
  row: number;
  col: number;
  polygon: { x: number; y: number }[];
  centroid: { x: number; y: number };
  detectedCode: ColorCode | null;
  detectedLab: LabColor;
  detectedHex: string;
  expectedCode: ColorCode;
  status: 'CORRECTO' | 'INCORRECTO' | 'INDETERMINADO';
  deltaE: number;
}

export interface DetectionResult {
  warpedImageUrl: string;
  blocks: BlockResult[];
  totalDetected: number;
  totalExpected: number;
  width: number;
  height: number;
}

/**
 * Run the full vision pipeline on a warped image data URL.
 * The warped image is already perspective-corrected (WARPED_WIDTH × WARPED_HEIGHT).
 */
export function runDetectionPipeline(
  warpedImageUrl: string,
  expectedLayer: ColorCode[][],
  calibration: Calibration,
  whiteBalance: LabColor | null,
): Promise<DetectionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const result = processImage(img, expectedLayer, calibration, whiteBalance);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
    img.src = warpedImageUrl;
  });
}

function processImage(
  img: HTMLImageElement,
  expectedLayer: ColorCode[][],
  calibration: Calibration,
  whiteBalance: LabColor | null,
): DetectionResult {
  const cv = getCv();

  // Draw image to canvas at max width
  const scale = Math.min(1, MAX_IMG_WIDTH / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  const src = cv.imread(canvas);

  // GaussianBlur
  const blurred = new cv.Mat();
  const ksize = new cv.Size(5, 5);
  cv.GaussianBlur(src, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);

  // Grayscale
  const gray = new cv.Mat();
  cv.cvtColor(blurred, gray, cv.COLOR_RGBA2GRAY);

  // adaptiveThreshold
  const binary = new cv.Mat();
  cv.adaptiveThreshold(
    gray,
    binary,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV,
    ADAPTIVE_BLOCK_SIZE,
    ADAPTIVE_C,
  );

  // findContours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(
    binary,
    contours,
    hierarchy,
    cv.RETR_LIST,
    cv.CHAIN_APPROX_SIMPLE,
  );

  // Filter by area and collect polygon + centroid
  const validContours: ContourInfo[] = [];

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);

    if (area < MIN_BLOCK_AREA || area > MAX_BLOCK_AREA) {
      contour.delete();
      continue;
    }

    // Polygon
    const polygon: { x: number; y: number }[] = [];
    const pts = contour.data32S; // flat array [x0, y0, x1, y1, ...]
    for (let j = 0; j < pts.length; j += 2) {
      polygon.push({ x: pts[j], y: pts[j + 1] });
    }

    // Centroid via moments
    const moments = cv.moments(contour);
    const cx = moments.m10 / moments.m00;
    const cy = moments.m01 / moments.m00;

    validContours.push({
      polygon,
      centroid: { x: cx, y: cy },
      area,
      row: 0,
      col: 0,
    });

    contour.delete();
  }

  // Group into rows by Y centroid
  validContours.sort((a, b) => a.centroid.y - b.centroid.y);

  const rows: ContourInfo[][] = [];
  for (const c of validContours) {
    let placed = false;
    for (const row of rows) {
      if (Math.abs(row[0].centroid.y - c.centroid.y) <= ROW_Y_TOLERANCE) {
        row.push(c);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([c]);
    }
  }

  // Sort each row by X ascending
  for (const row of rows) {
    row.sort((a, b) => a.centroid.x - b.centroid.x);
  }

  // Assign row/col indices
  let flatIndex = 0;
  const allBlocks: ContourInfo[] = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      rows[r][c].row = r;
      rows[r][c].col = c;
      allBlocks.push(rows[r][c]);
      flatIndex++;
    }
  }

  const totalDetected = allBlocks.length;
  const totalExpected = expectedLayer.reduce(
    (sum, row) => sum + row.length,
    0,
  );

  // Process each block: erode polygon, sample interior pixels, compute median Lab
  const blocks: BlockResult[] = [];

  for (const block of allBlocks) {
    // Get expected color for this row/col
    const expectedRow = expectedLayer[block.row];
    const expectedCode: ColorCode =
      expectedRow && block.col < expectedRow.length
        ? expectedRow[block.col]
        : 'BL';

    // Create mask for this contour
    const mask = cv.Mat.zeros(h, w, cv.CV_8UC1);
    const contourMat = cv.matFromArray(
      block.polygon.length,
      1,
      cv.CV_32SC2,
      block.polygon.flatMap((p) => [p.x, p.y]),
    );
    const contourVec = new cv.MatVector();
    contourVec.push_back(contourMat);
    cv.fillPoly(mask, contourVec, new cv.Scalar(255, 255, 255, 255));

    // Erode mask by EROSION_PERCENTAGE
    const erodedMask = erodeMask(mask, block, EROSION_PERCENTAGE);

    // Sample pixels from eroded mask region on the original (blurred) image
    const labResult = sampleInteriorLab(blurred, erodedMask, w, h);

    let detectedCode: ColorCode | null = null;
    let detectedLab: LabColor = { L: 0, a: 0, b: 0 };
    let status: BlockResult['status'] = 'INDETERMINADO';
    let deltaEValue = 0;

    if (labResult === null) {
      // Not enough valid pixels
      detectedLab = { L: 0, a: 0, b: 0 };
      status = 'INDETERMINADO';
    } else {
      detectedLab = labResult;

      // White balance correction
      if (whiteBalance) {
        detectedLab = {
          L: detectedLab.L + whiteBalance.L,
          a: detectedLab.a + whiteBalance.a,
          b: detectedLab.b + whiteBalance.b,
        };
      }

      // Match color
      const match = matchColor(detectedLab, calibration);
      detectedCode = match.code;
      deltaEValue = match.deltaE;

      if (detectedCode === null) {
        status = 'INDETERMINADO';
      } else if (detectedCode === expectedCode) {
        status = 'CORRECTO';
      } else {
        status = 'INCORRECTO';
      }
    }

    blocks.push({
      row: block.row,
      col: block.col,
      polygon: block.polygon,
      centroid: block.centroid,
      detectedCode,
      detectedLab,
      detectedHex: '#000000',
      expectedCode,
      status,
      deltaE: deltaEValue,
    });

    // Cleanup
    mask.delete();
    erodedMask.delete();
    contourMat.delete();
    contourVec.delete();
  }

  // Compute detected hex for display
  for (const block of blocks) {
    if (block.detectedCode) {
      // Use calibrated Lab → hex
      const calLab = calibration[block.detectedCode];
      if (calLab) {
        block.detectedHex = labToHexLocal(calLab);
      }
    } else {
      block.detectedHex = labToHexLocal(block.detectedLab);
    }
  }

  // Cleanup
  src.delete();
  blurred.delete();
  gray.delete();
  binary.delete();
  contours.delete();
  hierarchy.delete();

  return {
    warpedImageUrl: canvas.toDataURL('image/png'),
    blocks,
    totalDetected,
    totalExpected,
    width: w,
    height: h,
  };
}

function erodeMask(
  mask: cv.Mat,
  block: ContourInfo,
  percentage: number,
): cv.Mat {
  const cvInstance = getCv();
  const eroded = new cv.Mat();

  // Compute erode kernel size based on percentage of contour "radius"
  // Use the contour area to estimate a kernel size
  const area = block.area;
  const approxRadius = Math.sqrt(area / Math.PI);
  const erodePx = Math.max(1, Math.round((approxRadius * percentage) / 100));

  const kernel = cvInstance.Mat.ones(erodePx, erodePx, cvInstance.CV_8UC1);
  const anchor = new cvInstance.Point(-1, -1);
  cvInstance.erode(mask, eroded, kernel, anchor, 1, cvInstance.BORDER_CONSTANT, new cvInstance.Scalar(0));

  kernel.delete();
  return eroded;
}

function sampleInteriorLab(
  imgMat: cv.Mat,
  mask: cv.Mat,
  w: number,
  h: number,
): LabColor | null {

  // Read pixel data
  const imgData = imgMat.data;
  const maskData = mask.data;

  const lValues: number[] = [];
  const aValues: number[] = [];
  const bValues: number[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const maskIdx = y * w + x;
      if (maskData[maskIdx] === 0) continue;

      const imgIdx = maskIdx * 4; // RGBA
      const r = imgData[imgIdx];
      const g = imgData[imgIdx + 1];
      const b = imgData[imgIdx + 2];

      const lab = rgbToLab(r, g, b);

      // Discard highlights (L > 90) and shadows (L < 10)
      if (lab.L > 90 || lab.L < 10) continue;

      lValues.push(lab.L);
      aValues.push(lab.a);
      bValues.push(lab.b);
    }
  }

  if (lValues.length < MIN_VALID_PIXELS) {
    return null;
  }

  return {
    L: median(lValues),
    a: median(aValues),
    b: median(bValues),
  };
}

// Local import to avoid circular dependency issues
import { labToHex } from '@/utils/colorProcessing';
function labToHexLocal(lab: LabColor): string {
  return labToHex(lab);
}
