import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-150 cursor-zoom-out select-none"
    >
      {/* Lightbox Header */}
      <div className="w-full max-w-3xl flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <ZoomIn className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-xs sm:text-sm truncate">
            {title || 'Visualização do Produto'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          title="Fechar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Image Container */}
      <div className="flex-1 flex items-center justify-center p-2 my-auto max-w-full">
        <img
          src={imageUrl}
          alt={title || 'Foto Ampliada'}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[75vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-slate-800 bg-slate-900/40 animate-in zoom-in-90 duration-200"
        />
      </div>

      {/* Lightbox Footer Instruction */}
      <div className="text-center text-slate-400 text-xs shrink-0 py-2">
        <span className="bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-xs font-medium">
          Toque em qualquer lugar fora da imagem para fechar
        </span>
      </div>
    </div>
  );
};
