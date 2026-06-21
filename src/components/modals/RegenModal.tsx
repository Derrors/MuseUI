
import React, { useRef, useState, useEffect } from 'react';
import { I18N } from '../../constants';
import { LangType } from '../../types';
import { Button, Card, DialogShell, Flex, TabsShell, Text, TextAreaField } from '../ui';

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
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const syncCanvasSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
  };
  
  // Reset drawing when opening
  useEffect(() => {
      if (isOpen && canvasRef.current && containerRef.current) {
          syncCanvasSize();
          const ctx = canvasRef.current.getContext('2d');
          const canvas = canvasRef.current;
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasDrawn(false);
      }
  }, [isOpen]);

  // Adjust canvas size to image
  useEffect(() => {
      if (!isOpen) return;
      syncCanvasSize();
      window.addEventListener('resize', syncCanvasSize);
      return () => window.removeEventListener('resize', syncCanvasSize);
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

  const createEditMask = () => {
      const sourceCanvas = canvasRef.current;
      const image = imageRef.current;
      if (!sourceCanvas || !image || !image.naturalWidth || !image.naturalHeight) {
          return sourceCanvas?.toDataURL('image/png') || null;
      }

      const output = document.createElement('canvas');
      output.width = image.naturalWidth;
      output.height = image.naturalHeight;
      const ctx = output.getContext('2d');
      if (!ctx) return sourceCanvas.toDataURL('image/png');

      const canvasW = sourceCanvas.width;
      const canvasH = sourceCanvas.height;
      if (!canvasW || !canvasH) return sourceCanvas.toDataURL('image/png');

      const imageRatio = image.naturalWidth / image.naturalHeight;
      const canvasRatio = canvasW / canvasH;
      const renderW = canvasRatio > imageRatio ? canvasH * imageRatio : canvasW;
      const renderH = canvasRatio > imageRatio ? canvasH : canvasW / imageRatio;
      const offsetX = (canvasW - renderW) / 2;
      const offsetY = (canvasH - renderH) / 2;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, output.width, output.height);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(sourceCanvas, offsetX, offsetY, renderW, renderH, 0, 0, output.width, output.height);
      return output.toDataURL('image/png');
  };

  const handleConfirm = () => {
      let mask = null;
      if (hasDrawn) {
          mask = createEditMask();
      }
      onConfirm(mask);
  };

  return (
    <DialogShell
        open={isOpen}
        onOpenChange={(open) => { if (!open) onClose(); }}
        title={lang === 'zh' ? '重新生成 / 微调' : 'Regenerate / Refine'}
        description={lang === 'zh' ? '圈选区域、补充参考图或布局后重新生成画板。' : 'Mask an area, add references or layout guidance, then regenerate this artboard.'}
        size="lg"
        closeLabel={lang === 'zh' ? '关闭重生成' : 'Close regenerate dialog'}
        footer={(
            <>
                <Button onClick={onClose} variant="soft" color="gray">{t.cancel}</Button>
                <Button onClick={handleConfirm} color="ruby" iconName="magic-wand">{lang === 'zh' ? '确认生成' : 'Generate'}</Button>
            </>
        )}
    >
        <div className="grid min-h-[calc(100dvh-190px)] gap-4 md:grid-cols-[minmax(0,1fr)_320px] md:min-h-[560px]">
            {/* Left Column: Image & Masking */}
            <Card className="flex min-h-[42vh] flex-col bg-[var(--gray-2)] p-4 md:min-h-0">
                <Flex align="center" justify="between" gap="3" mb="2">
                    <Text size="1" weight="bold" color="gray">
                        {lang === 'zh' ? '圈选重绘区域 (可选)' : 'Circle area to regenerate (Optional)'}
                    </Text>
                    {hasDrawn && (
                        <Button onClick={clearCanvas} size="1" variant="ghost" color="red">
                            {lang === 'zh' ? '清除笔迹' : 'Clear Mask'}
                        </Button>
                    )}
                </Flex>
                
                <div 
                    ref={containerRef}
                    className="relative flex-1 cursor-crosshair touch-none overflow-hidden rounded-lg border border-[var(--gray-6)] bg-[var(--gray-3)]"
                >
                    {targetImage ? (
                        <img 
                            ref={imageRef}
                            src={targetImage} 
                            alt=""
                            className="w-full h-full object-contain pointer-events-none select-none absolute inset-0" 
                            onLoad={syncCanvasSize}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--gray-9)]">
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
            </Card>

            {/* Right Column: Controls */}
            <div className="flex min-h-0 w-full flex-col gap-4 overflow-y-visible md:overflow-y-auto md:pr-1">
                {/* Mode Select */}
                <TabsShell
                    value={mode}
                    onValueChange={(value) => setMode(value as 'refine' | 'new')}
                    items={[
                        { value: 'refine', label: lang === 'zh' ? '微调' : 'Refine' },
                        { value: 'new', label: lang === 'zh' ? '重绘' : 'Redraw' },
                    ]}
                />

                <div className="flex-1 flex flex-col min-h-0 gap-4">
                    <TextAreaField
                        label={lang === 'zh' ? '修改提示词' : 'Refinement Prompt'}
                        value={prompt}
                        onValueChange={setPrompt}
                        rows={6}
                        placeholder={hasDrawn
                                ? (lang === 'zh' ? '描述红圈区域需要改成什么...' : 'Describe what to change in the circled area...')
                                : (lang === 'zh' ? '例如: 将按钮改成红色...' : 'e.g. Change button color to red...')
                        }
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Text as="label" size="1" weight="bold" color="gray">{lang === 'zh' ? '参考图' : 'Ref Img'}</Text>
                            <div className="group relative mt-1 flex h-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--gray-7)] bg-[var(--gray-2)] hover:border-[var(--accent-7)]">
                                {referenceImage ? (
                                    <>
                                        <img src={referenceImage} alt="" className="w-full h-full object-cover opacity-60" />
                                        <button onClick={onRemoveReference} className="absolute inset-0 flex items-center justify-center bg-[var(--color-panel-solid)]/85 text-xs font-bold text-[var(--red-10)] opacity-0 transition-opacity group-hover:opacity-100">
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
                            <Text as="label" size="1" weight="bold" color="gray">{lang === 'zh' ? '布局' : 'Layout'}</Text>
                            <div className="group relative mt-1 flex h-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--gray-7)] bg-[var(--gray-2)] hover:border-[var(--accent-7)]">
                                {layoutImage ? (
                                    <>
                                        <img src={layoutImage} alt="" className="w-full h-full object-contain p-1" />
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
            </div>
        </div>
    </DialogShell>
  );
};

export default RegenModal;
