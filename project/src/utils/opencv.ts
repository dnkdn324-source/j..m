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

    // Si ya está cargado globalmente
    if ((window as any).cv && typeof (window as any).cv.Mat === 'function') {
      cvReady = true;
      resolve((window as any).cv);
      return;
    }

    // Crear script para cargar OpenCV desde la web oficial
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
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
      }, 200);
    };

    script.onerror = () => {
      reject(new Error('No se pudo conectar para descargar OpenCV. Verifica tus datos móviles o Wi-Fi.'));
    };

    document.head.appendChild(script);

    // Timeout de seguridad de 35 segundos
    setTimeout(() => {
      if (!cvReady) {
        reject(new Error('Tiempo de espera agotado al descargar OpenCV.'));
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
