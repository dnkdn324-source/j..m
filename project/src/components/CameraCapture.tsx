import { useRef } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureProps {
  onImageSelected: (dataUrl: string) => void;
  label?: string;
}

export default function CameraCapture({
  onImageSelected,
  label = 'Obtener imagen',
}: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm font-semibold text-stone-600">{label}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-4 px-6 rounded-xl shadow-md transition-all active:scale-95"
        >
          <Camera size={22} />
          Tomar foto
        </button>
        <button
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-stone-600 hover:bg-stone-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transition-all active:scale-95"
        >
          <ImageIcon size={22} />
          Subir desde galería
        </button>
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
