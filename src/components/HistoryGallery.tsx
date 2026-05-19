import React from 'react';
import { GeneratedImage, LangType } from '../types';
import { I18N } from '../constants';

interface Props {
  history: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  lang: LangType;
  currentId?: string;
}

const HistoryGallery: React.FC<Props> = ({ history, onSelect, onDelete, onClear, lang, currentId }) => {
  const t = I18N[lang];

  if (history.length === 0) return null;

  const handleDragStart = (e: React.DragEvent, img: GeneratedImage) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-muse-ui-image', img.url);
  };

  return (
    <div className="w-full mt-4 bg-stone-100/50 dark:bg-stone-950/50 border-t border-stone-200 dark:border-stone-800">
      <div className="p-3 flex items-center justify-between">
        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">{t.history}</h4>
        <button 
          onClick={onClear}
          className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
        >
          {t.clearHistory}
        </button>
      </div>
      
      <div className="flex overflow-x-auto gap-3 p-3 pb-5 custom-scrollbar">
        {history.map((img) => (
          <div 
            key={img.id} 
            className={`relative flex-shrink-0 w-24 h-36 rounded-lg overflow-visible border-2 cursor-pointer transition-all group ${
              currentId === img.id ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
            }`}
            onClick={() => onSelect(img)}
            draggable
            onDragStart={(e) => handleDragStart(e, img)}
          >
            <div className="w-full h-full overflow-hidden rounded-md relative">
                <img 
                src={img.url} 
                alt="history" 
                className="w-full h-full object-cover" 
                />
                
                {/* Delete Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1 z-10">
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        onDelete(img.id);
                        }}
                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Hover Details Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="text-[10px] space-y-1.5 text-stone-600 dark:text-stone-400">
                    {img.details ? (
                        <>
                            <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1">
                                <span className="font-bold">{lang === 'zh' ? '平台:' : 'Platform:'}</span>
                                <span>{img.details.platform}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1">
                                <span className="font-bold">{lang === 'zh' ? '设备:' : 'Device:'}</span>
                                <span className="truncate max-w-[120px]">{img.details.resolution}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-1">
                                <span className="font-bold">{lang === 'zh' ? '风格:' : 'Style:'}</span>
                                <span>{img.details.style}</span>
                            </div>
                            <div className="pt-1">
                                <span className="font-bold block mb-1">{lang === 'zh' ? '提示词:' : 'Prompt:'}</span>
                                <p className="line-clamp-3 italic text-stone-500 dark:text-stone-500 leading-tight">
                                    "{img.prompt}"
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="italic text-center">{lang === 'zh' ? '无详细信息' : 'No details available'}</p>
                    )}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-white dark:bg-stone-900 border-r border-b border-stone-200 dark:border-stone-800 transform rotate-45"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;