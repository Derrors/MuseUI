
import React, { useRef, useState, useEffect } from 'react';
import { I18N } from '../../constants';
import { LangType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: LangType;
  mode: 'refine' | 'new';
  setMode: (m: 'refine' | 'new') => void;
  prompt: string;
  setPrompt: (s: string) => void;
  referenceImage: string | null;
  onReferenceUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReference: () => void;
  layoutImage: string | null;
  onOpenBuilder: () => void;
  onRemoveLayout: () => void;
  onConfirm: (maskBase64: string | null) => void; // Update to return mask
  targetImage: string | null; // Show what we are regenerating
}

const RegenModal: React.FC<Props> = ({ 
    isOpen, onClose, lang, mode, setMode, prompt, setPrompt, 
    referenceImage, onReferenceUpload, onRemoveReference, 
    layoutImage, onOpenBuilder, onRemoveLayout, onConfirm, targetImage 
}) => {
  const t = I18N[lang];
  
  // Canvas logic
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  // Reset drawing when opening
  useEffect(() => {
      if (isOpen && canvasRef.current && containerRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasDrawn(false);
      }
  }, [isOpen]);

  // Adjust canvas size to image
  useEffect(() => {
      if (targetImage && containerRef.current && canvasRef.current) {
          const img = new Image();
          img.src = targetImage;
          img.onload = () => {
              const canvas = canvasRef.current!;
              // Match render size
              canvas.width = containerRef.current!.clientWidth;
              canvas.height = containerRef.current!.clientHeight;
          };
      }
  }, [targetImage, isOpen]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }
      return {
          x: clientX - rect.left,
          y: clientY - rect.top
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDrawing(true);
      const { x, y } = getCoordinates(e);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red transparent mask
          ctx.lineWidth = 20;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
      }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getCoordinates(e);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
          ctx.lineTo(x, y);
          ctx.stroke();
      }
  };

  const stopDrawing = () => {
      if (isDrawing) {
          setIsDrawing(false);
          setHasDrawn(true);
      }
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasDrawn(false);
      }
  };

  const handleConfirm = () => {
      let mask = null;
      if (hasDrawn && canvasRef.current) {
          mask = canvasRef.current.toDataURL('image/png');
      }
      onConfirm(mask);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-0 sm:p-4">
        <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-xl p-4 sm:p-6 max-w-4xl w-full h-[100dvh] sm:h-auto flex flex-col md:flex-row gap-4 sm:gap-6 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto md:overflow-hidden animate-in zoom-in-95">
            
            {/* Left Column: Image & Masking */}
            <div className="flex-1 flex flex-col min-h-[42vh] md:min-h-0 bg-stone-100 dark:bg-stone-950 rounded-lg p-4 border border-stone-200 dark:border-stone-800">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                        {lang === 'zh' ? '圈选重绘区域 (可选)' : 'Circle area to regenerate (Optional)'}
                    </h4>
                    {hasDrawn && (
                        <button onClick={clearCanvas} className="text-xs text-red-500 hover:underline">
                            {lang === 'zh' ? '清除笔迹' : 'Clear Mask'}
                        </button>
                    )}
                </div>
                
                <div 
                    ref={containerRef}
                    className="flex-1 relative overflow-hidden rounded border border-stone-300 dark:border-stone-700 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] cursor-crosshair touch-none"
                >
                    {targetImage ? (
                        <img 
                            src={targetImage} 
                            className="w-full h-full object-contain pointer-events-none select-none absolute inset-0" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                            No Image
                        </div>
                    )}
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full z-10"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            </div>

            {/* Right Column: Controls */}
            <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-visible md:overflow-y-auto md:pr-1">
                <h3 className="font-bold text-lg text-stone-800 dark:text-white">{lang === 'zh' ? '重新生成 / 微调' : 'Regenerate / Refine'}</h3>
                
                {/* Mode Select */}
                <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg shrink-0">
                    <button 
                        onClick={() => setMode('refine')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'refine' ? 'bg-white dark:bg-stone-700 shadow text-teal-600' : 'text-stone-500'}`}
                    >
                        {lang === 'zh' ? '微调 (Refine)' : 'Refine'}
                    </button>
                    <button 
                        onClick={() => setMode('new')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'new' ? 'bg-white dark:bg-stone-700 shadow text-teal-600' : 'text-stone-500'}`}
                    >
                        {lang === 'zh' ? '重绘 (New)' : 'Redraw'}
                    </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1">{lang === 'zh' ? '修改提示词' : 'Refinement Prompt'}</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 text-sm p-2 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 resize-none focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder={hasDrawn 
                                ? (lang === 'zh' ? '描述红圈区域需要改成什么...' : 'Describe what to change in the circled area...')
                                : (lang === 'zh' ? '例如: 将按钮改成红色...' : 'e.g. Change button color to red...')
                            }
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] font-bold text-stone-500 mb-1">{lang === 'zh' ? '参考图' : 'Ref Img'}</label>
                            <div className="relative border border-dashed border-stone-300 dark:border-stone-700 rounded-lg h-16 flex items-center justify-center bg-stone-50 dark:bg-stone-900 overflow-hidden group hover:border-teal-500">
                                {referenceImage ? (
                                    <>
                                        <img src={referenceImage} className="w-full h-full object-cover opacity-50" />
                                        <button onClick={onRemoveReference} className="absolute inset-0 flex items-center justify-center text-xs font-bold text-red-500 bg-white/80 opacity-0 group-hover:opacity-100">
                                            ×
                                        </button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer w-full h-full flex items-center justify-center">
                                        <span className="text-xl text-stone-300">+</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={onReferenceUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-stone-500 mb-1">{lang === 'zh' ? '布局' : 'Layout'}</label>
                            <div className="relative border border-dashed border-stone-300 dark:border-stone-700 rounded-lg h-16 flex items-center justify-center bg-stone-50 dark:bg-stone-900 overflow-hidden group hover:border-teal-500">
                                {layoutImage ? (
                                    <>
                                        <img src={layoutImage} className="w-full h-full object-contain p-1" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                                            <button onClick={onOpenBuilder} className="text-white text-[10px] hover:underline">Edit</button>
                                            <button onClick={onRemoveLayout} className="text-red-400 text-[10px] hover:underline">✕</button>
                                        </div>
                                    </>
                                ) : (
                                    <button onClick={onOpenBuilder} className="w-full h-full text-stone-400 text-[10px] hover:bg-stone-100 dark:hover:bg-stone-800">
                                        + Layout
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
                        {t.cancel}
                    </button>
                    <button onClick={handleConfirm} className="px-6 py-2 bg-teal-600 text-white rounded text-sm font-bold hover:bg-teal-500 shadow-lg shadow-teal-500/20">
                        {lang === 'zh' ? '确认生成' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RegenModal;
