
import React from 'react';
import DesignSpecRenderer from '../DesignSpecRenderer';
import { GeneratedImage, LangType } from '../../types';

interface Props {
  specReviewImage: GeneratedImage | null;
  onClose: () => void;
  lang: LangType;
  specFeedback: string;
  setSpecFeedback: (s: string) => void;
  onRefine: () => void;
  onConfirm: () => void;
}

const SpecReviewModal: React.FC<Props> = ({ 
    specReviewImage, onClose, lang, specFeedback, setSpecFeedback, onRefine, onConfirm 
}) => {
  if (!specReviewImage) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-0 sm:p-4">
        <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-xl w-full max-w-5xl h-[100dvh] sm:h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center gap-3 bg-stone-50 dark:bg-stone-950">
                <h3 className="min-w-0 font-bold text-stone-800 dark:text-white flex flex-wrap items-center gap-2">
                    <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded shrink-0">Step 1/2</span>
                    {lang === 'zh' ? '审查设计规范' : 'Review Design Spec'}
                </h3>
                <button onClick={onClose} className="min-h-10 min-w-10 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">✕</button>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto bg-stone-100 dark:bg-stone-950 p-4 flex items-center justify-center">
                    {specReviewImage.details?.designSystem ? (
                            <div className="w-full min-h-full bg-white shadow-lg overflow-hidden">
                                <DesignSpecRenderer designSystem={specReviewImage.details.designSystem} lang={lang} />
                            </div>
                    ) : (
                            <img src={specReviewImage.url} className="max-w-full max-h-full object-contain shadow-lg" />
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center shadow-up">
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input 
                    type="text" 
                    value={specFeedback}
                    onChange={(e) => setSpecFeedback(e.target.value)}
                    placeholder={lang === 'zh' ? '输入反馈以修正规范 (例如: 颜色更暗一点)...' : 'Enter feedback to refine spec (e.g. Darker colors)...'}
                    className="min-h-11 flex-1 border border-stone-300 dark:border-stone-700 rounded px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <button 
                        onClick={onRefine}
                        className="min-h-11 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-700 whitespace-nowrap"
                    >
                        {lang === 'zh' ? '修正规范' : 'Refine Spec'}
                    </button>
                </div>
                <div className="hidden sm:block w-px h-8 bg-stone-200 dark:bg-stone-800 mx-2"></div>
                <button 
                    onClick={onConfirm}
                    className="min-h-11 px-8 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded text-sm font-bold shadow-lg hover:from-green-500 hover:to-emerald-500 whitespace-nowrap"
                >
                    {lang === 'zh' ? '确认并生成页面' : 'Approve & Generate Pages'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default SpecReviewModal;
