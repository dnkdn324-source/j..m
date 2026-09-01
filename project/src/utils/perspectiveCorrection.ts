import { getCv } from '@/utils/opencv';
import { WARPED_WIDTH, WARPED_HEIGHT } from '@/config';

export interface Point {
  x: number;
  y: number;
}

/**
 * Applies perspective correction using 3 user-selected points (the 3 outer
 * corners of the triangular layer) mapped to a normalized triangle inscribed
 * in the WARPED_WIDTH × WARPED_HEIGHT output image.
 *
 * Returns a data URL of the warped image.
 */
export function correctPerspective(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  srcPoints: [Point, Point, Point],
): string {
  const cv = getCv();

  // Source image as Mat
  const src = cv.imread(imageElement);

  // Define destination triangle — normalized, inscribed in warped canvas
  // We use a triangle that fills most of the warped image area.
  const margin = 40;
  const top: Point = { x: WARPED_WIDTH / 2, y: margin };
  const bottomLeft: Point = { x: margin, y: WARPED_HEIGHT - margin };
  const bottomRight: Point = { x: WARPED_WIDTH - margin, y: WARPED_HEIGHT - margin };

  // We need 4 points for getPerspectiveTransform. Derive a 4th from the 3
  // user points by computing the implied quadrilateral.
  // Actually, with 3 points we can compute an affine transform (2x3).
  // But the spec says getPerspectiveTransform which needs 4 points.
  // We'll use the 3 user points + the centroid-derived 4th point as the
  // midpoint of the two base corners.
  const s0 = srcPoints[0];
  const s1 = srcPoints[1];
  const s2 = srcPoints[2];

  // 4th source point = midpoint of s1 and s2 (the two base corners)
  const s3: Point = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 };
  // 4th dest point = midpoint of bottomLeft and bottomRight
  const d3: Point = {
    x: (bottomLeft.x + bottomRight.x) / 2,
    y: (bottomLeft.y + bottomRight.y) / 2,
  };

  // Map: s0→top, s1→bottomLeft, s2→bottomRight, s3→d3
  const srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
    s0.x, s0.y,
    s1.x, s1.y,
    s2.x, s2.y,
    s3.x, s3.y,
  ]);
  const dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
    top.x, top.y,
    bottomLeft.x, bottomLeft.y,
    bottomRight.x, bottomRight.y,
    d3.x, d3.y,
  ]);

  const M = cv.getPerspectiveTransform(srcMat, dstMat);
  const warped = new cv.Mat();
  const dsize = new cv.Size(WARPED_WIDTH, WARPED_HEIGHT);

  cv.warpPerspective(
    src,
    warped,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar(0, 0, 0, 255),
  );

  // Output to canvas → data URL
  const outCanvas = document.createElement('canvas');
  outCanvas.width = WARPED_WIDTH;
  outCanvas.height = WARPED_HEIGHT;
  cv.imshow(outCanvas, warped);

  const dataUrl = outCanvas.toDataURL('image/png');

  // Cleanup
  src.delete();
  srcMat.delete();
  dstMat.delete();
  M.delete();
  warped.delete();

  return dataUrl;
}

/**
 * Loads an image from a data URL into an HTMLImageElement.
 */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = dataUrl;
  });
}
