import cvModule from '@techstark/opencv-js';

let cvReady: boolean = false;
let cvLoading: Promise<any> | null = null;

export function isCvReady(): boolean {
  return cvReady;
}

export async function loadOpenCV(): Promise<any> {
  if (cvReady) return cvModule;
  if (cvLoading) return cvLoading;

  cvLoading = new Promise((resolve, reject) => {
    try {
      if (!cvModule) {
        reject(new Error('El módulo de OpenCV no está disponible.'));
        return;
      }

      // Si ya está inicializado previamente
      if (typeof cvModule.Mat === 'function') {
        cvReady = true;
        resolve(cvModule);
        return;
      }

      // Interceptar o asegurar el callback de inicialización de WebAssembly
      const originalOnRuntimeInitialized = cvModule.onRuntimeInitialized;
      cvModule.onRuntimeInitialized = () => {
        if (originalOnRuntimeInitialized) {
          try {
            originalOnRuntimeInitialized();
          } catch (e) {
            console.error('Error en el onRuntimeInitialized original:', e);
          }
        }
        cvReady = true;
        console.log('OpenCV.js se inicializó correctamente vía WebAssembly.');
        resolve(cvModule);
      };

      // Sondeo periódico por si el callback se dispara antes o de forma distinta en móviles
      const checkInterval = setInterval(() => {
        if (cvModule && typeof cvModule.Mat === 'function') {
          clearInterval(checkInterval);
          if (!cvReady) {
            cvReady = true;
            console.log('OpenCV.js detectado listo por sondeo.');
            resolve(cvModule);
          }
        }
      }, 100);

      // Temporizador de seguridad de 30 segundos con mensaje descriptivo
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!cvReady) {
          reject(new Error('OpenCV.js no pudo cargarse (timeout de 30s). Revisa tu conexión o si el archivo .wasm es accesible.'));
        }
      }, 30000);
    } catch (err) {
      reject(err);
    }
  });

  return cvLoading;
}

export function getCv() {
  if (!cvReady || !cvModule) {
    throw new Error('OpenCV.js no está cargado todavía. Llama a loadOpenCV() primero.');
  }
  return cvModule;
}

export { cvModule as cv };
