import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';

interface ReceiptViewerModalProps {
  receipt: {
    url: string;
    type?: 'image' | 'pdf';
    name?: string;
    title: string;
  } | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({ receipt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when receipt changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsFullscreen(false);
  }, [receipt]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!receipt) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [receipt, scale, rotation]);

  if (!receipt) return null;

  const isPdf = receipt.type === 'pdf' || receipt.url.startsWith('data:application/pdf');

  const handleZoomIn = () => {
    setScale((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleClickZoom = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      handleReset();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isPdf) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPdf || scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isPdf || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className={`bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-[#202531] rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' : 'max-w-4xl w-full h-[90vh]'
        }`}
      >
        {/* Top Navigation & Controls Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#181c26] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Paperclip className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                {receipt.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {receipt.name || 'Comprovante de Lançamento'}
              </p>
            </div>
          </div>

          {/* Interactive Zoom Controls (For Images) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isPdf && (
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-colors"
                  title="Diminuir Zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="px-2 font-mono font-bold text-[11px] text-indigo-600 dark:text-indigo-400 min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-colors"
                  title="Aumentar Zoom (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-colors"
                  title="Girar 90° (R)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-colors"
                  title="Resetar Zoom (0)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Buttons: Fullscreen, Download, Close */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Restaurar Tamanho' : 'Expandir Tela Cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <a
              href={receipt.url}
              download={receipt.name || 'comprovante'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Baixar / Abrir Arquivo"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewer Main Viewport Container */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex-1 relative overflow-hidden bg-slate-900/90 dark:bg-[#0c0e14] flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        >
          {isPdf ? (
            <div className="w-full h-full flex flex-col space-y-2">
              <div className="flex justify-end no-print">
                <a
                  href={receipt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir PDF em Nova Aba
                </a>
              </div>
              <iframe
                src={receipt.url}
                className="w-full flex-1 rounded-xl border border-slate-700 bg-white"
                title="Visualizador de PDF"
              />
            </div>
          ) : (
            <div
              className="transition-transform duration-75 flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              onClick={handleToggleClickZoom}
            >
              <img
                src={receipt.url}
                alt={receipt.title}
                draggable={false}
                className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-slate-800 pointer-events-auto select-none transition-shadow"
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Instruction Bar */}
        {!isPdf && (
          <div className="p-2.5 bg-slate-950 text-slate-400 text-[11px] text-center shrink-0 border-t border-slate-800 flex items-center justify-center gap-4">
            <span>💡 <strong>Role o Scroll do Mouse</strong> para aproximar/afastar</span>
            <span>•</span>
            <span><strong>Clique</strong> para alternar Zoom</span>
            <span>•</span>
            <span><strong>Arraste</strong> para mover quando ampliado</span>
          </div>
        )}
      </div>
    </div>
  );
};
