
import React from 'react';
import { LangType } from '../../types';

interface Props {
  batchConfirmation: { resolve: (p: string | null) => void, prompt: string, pageName: string, index: number, total: number } | null;
  setBatchConfirmation: (val: any) => void;
  lang: LangType;
}

const BatchConfirmationModal: React.FC<Props> = ({ batchConfirmation, setBatchConfirmation, lang }) => {
  if (!batchConfirmation) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-0 sm:p-4">
        <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-xl p-4 sm:p-6 max-w-lg w-full h-[100dvh] sm:h-auto flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
            <h3 className="font-bold text-lg mb-2 text-stone-800 dark:text-white">
                {lang === 'zh' ? `批量生成确认 (${batchConfirmation.index}/${batchConfirmation.total})` : `Batch Generation (${batchConfirmation.index}/${batchConfirmation.total})`}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                {lang === 'zh' ? '即将生成页面:' : 'Next page:'} <span className="font-bold text-teal-600">{batchConfirmation.pageName}</span>
            </p>
            
            <div className="mb-4 flex-1 flex flex-col min-h-0">
                <label className="text-xs font-bold text-stone-500 block mb-1">Prompt Preview:</label>
                <textarea 
                    value={batchConfirmation.prompt}
                    onChange={(e) => setBatchConfirmation({ ...batchConfirmation, prompt: e.target.value })}
                    className="w-full flex-1 min-h-[200px] text-xs p-3 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 font-mono resize-y focus:ring-2 focus:ring-teal-500 outline-none"
                />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <button 
                    onClick={() => batchConfirmation.resolve(null)}
                    className="min-h-11 px-4 py-2 text-red-500 hover:bg-red-50 rounded text-sm font-medium"
                >
                    {lang === 'zh' ? '停止批量' : 'Stop Batch'}
                </button>
                <button 
                    onClick={() => batchConfirmation.resolve(batchConfirmation.prompt)}
                    className="min-h-11 px-6 py-2 bg-teal-600 text-white rounded text-sm font-bold hover:bg-teal-500 shadow-lg shadow-teal-500/20"
                >
                    {lang === 'zh' ? '生成' : 'Generate'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default BatchConfirmationModal;
