import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Crop } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  onCropComplete,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
  }, [imageSrc]);

  useEffect(() => {
    drawCanvas();
  }, [zoom, rotation, position]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetSize = 400; // Output 400x400
    canvas.width = targetSize;
    canvas.height = targetSize;

    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.save();

    // Center canvas origin
    ctx.translate(targetSize / 2 + position.x, targetSize / 2 + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw image centered
    const aspect = img.width / img.height;
    let drawW = targetSize;
    let drawH = targetSize;

    if (aspect > 1) {
      drawH = targetSize / aspect;
    } else {
      drawW = targetSize * aspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCropComplete(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <Crop className="w-4 h-4 text-indigo-400" /> Redimensionar e Enquadrar Foto do Produto
          </span>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Canvas */}
        <div className="p-6 bg-slate-100 flex flex-col items-center justify-center relative select-none">
          <div
            className="w-[280px] h-[280px] rounded-2xl overflow-hidden shadow-md border-4 border-indigo-600 bg-slate-200 cursor-move relative flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none border border-white/40 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            💡 Arraste a imagem para posicionar no quadrado.
          </p>
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 bg-white border-t border-slate-200 text-xs">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-slate-400" />
            <span className="w-12 text-right font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> Girar 90°
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" /> Aplicar Foto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
