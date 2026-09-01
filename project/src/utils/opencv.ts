import cv from '@techstark/opencv-js';

let cvReady: boolean = false;
let cvLoading: Promise<typeof cv> | null = null;

export function isCvReady(): boolean {
  return cvReady;
}

export async function loadOpenCV(): Promise<typeof cv> {
  if (cvReady) return cv;

  if (cvLoading) return cvLoading;

  cvLoading = new Promise<typeof cv>((resolve, reject) => {
    // @techstark/opencv-js exposes a cv object with an onRuntimeReady callback
    // or an onRuntimeInitialized property. We need to wait for WASM to be ready.
    const checkReady = () => {
      if (cv && typeof cv.Mat === 'function') {
        cvReady = true;
        resolve(cv);
      } else {
        setTimeout(checkReady, 100);
      }
    };

    // Set the runtime initialized callback
    if (cv) {
      // Try setting onRuntimeInitialized
      (cv as unknown as { onRuntimeInitialized?: () => void }).onRuntimeInitialized = () => {
        cvReady = true;
        resolve(cv);
      };

      // Also poll in case the callback already fired
      setTimeout(checkReady, 200);
    } else {
      reject(new Error('OpenCV.js no está disponible'));
    }

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!cvReady) {
        reject(new Error('OpenCV.js no pudo cargarse (timeout)'));
      }
    }, 30000);
  });

  return cvLoading;
}

export function getCv(): typeof cv {
  if (!cvReady) {
    throw new Error('OpenCV.js no está cargado todavía. Llama a loadOpenCV() primero.');
  }
  return cv;
}

export { cv };
