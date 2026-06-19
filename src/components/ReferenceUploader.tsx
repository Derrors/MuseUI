
import React, { useState } from 'react';
import { I18N } from '../constants';
import { LangType } from '../types';

interface Props {
  images: File[];
  onImagesChange: (files: File[]) => void;
  lang: LangType;
  title?: string;
  hint?: string;
  onExtractStyle?: (files: File[]) => void;
  isExtracting?: boolean;
}

const ReferenceUploader: React.FC<Props> = ({ 
  images, 
  onImagesChange, 
  lang,
  title,
  hint,
  onExtractStyle,
  isExtracting
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const t = I18N[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onImagesChange([...images, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const urlToFile = async (url: string, filename: string, mimeType: string) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mimeType });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Check for internal history drag
    const historyImageUrl = e.dataTransfer.getData('application/x-muse-ui-image');
    if (historyImageUrl) {
        // Convert base64 to File
        try {
            // Check mime type from base64 string
            const mimeMatch = historyImageUrl.match(/^data:(image\/[a-zA-Z]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
            const file = await urlToFile(historyImageUrl, `history-${Date.now()}.png`, mimeType);
            onImagesChange([...images, file]);
        } catch (err) {
            console.error("Failed to convert dragged image", err);
        }
        return;
    }

    // Normal file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      onImagesChange([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-2">
          <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">{title || t.contentImages}</label>
          {onExtractStyle && images.length > 0 && (
              <button 
                onClick={() => onExtractStyle(images)}
                disabled={isExtracting}
                className="min-h-9 text-[10px] px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 rounded hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors flex items-center gap-1"
              >
                  {isExtracting ? (
                      <span className="animate-spin">⏳</span>
                  ) : (
                      <span>🪄</span>
                  )}
                  {lang === 'zh' ? '反推风格' : 'Extract Style'}
              </button>
          )}
      </div>
      
      <div 
        className={`grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3 transition-colors rounded-xl p-1 ${isDragging ? 'bg-stone-200 dark:bg-stone-800 ring-2 ring-teal-500/50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {images.map((file, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 group bg-stone-100 dark:bg-stone-900">
            <img 
              src={URL.createObjectURL(file)} 
              alt="preview" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button 
                onClick={() => removeImage(idx)}
                className="min-h-9 min-w-9 text-white bg-red-500/80 p-1 rounded-full hover:bg-red-600 flex items-center justify-center"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
               </button>
            </div>
          </div>
        ))}
        
        <label className={`flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-all ${
          isDragging 
            ? 'border-teal-500 bg-white dark:bg-stone-800' 
            : 'border-stone-300 dark:border-stone-700 hover:border-teal-500 hover:bg-stone-100 dark:hover:bg-stone-800/50 bg-stone-50 dark:bg-transparent'
        }`}>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleFileChange}
            className="hidden" 
          />
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mb-1 ${isDragging ? 'text-teal-500' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className={`text-[10px] uppercase font-bold tracking-wide ${isDragging ? 'text-teal-500' : 'text-stone-400 dark:text-stone-500'}`}>
            {isDragging ? 'Drop' : t.upload}
          </span>
        </label>
      </div>
      <p className="text-xs text-stone-500">{hint || t.contentImagesHint}</p>
    </div>
  );
};

export default ReferenceUploader;
