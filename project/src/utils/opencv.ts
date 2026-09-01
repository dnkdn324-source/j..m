let cvReady: boolean = false;
let cvLoading: Promise<any> | null = null;

export function isCvReady(): boolean {
  return cvReady;
}

export function loadOpenCV(): Promise<any> {
  if (cvReady && (window as any).cv) return Promise.resolve((window as any).cv);
  if (cvLoading) return cvLoading;

  cvLoading = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Entorno de ventana no disponible'));
      return;
    }

    if ((window as any).cv && typeof (window as any).cv.Mat === 'function') {
      cvReady = true;
      resolve((window as any).cv);
      return;
    }

    // Usar jsDelivr CDN (mucho más rápido en móviles de toda la región)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.0/opencv.js';
    script.async = true;
    script.type = 'text/javascript';

    script.onload = () => {
      const checkInterval = setInterval(() => {
        const cvInstance = (window as any).cv;
        if (cvInstance && typeof cvInstance.Mat === 'function') {
          clearInterval(checkInterval);
          cvReady = true;
          resolve(cvInstance);
        }
      }, 100);
    };

    script.onerror = () => {
      reject(new Error('No se pudo descargar OpenCV desde el CDN rápido.'));
    };

    document.head.appendChild(script);

    setTimeout(() => {
      if (!cvReady) {
        reject(new Error('Tiempo de espera agotado.'));
      }
    }, 35000);
  });

  return cvLoading;
}

export function getCv() {
  const cvInstance = (window as any).cv;
  if (!cvReady || !cvInstance) {
    throw new Error('OpenCV.js no está cargado todavía.');
  }
  return cvInstance;
}

export { };
