import React from 'react';

interface Props {
  id: string;
  name: string;
  name_zh: string;
  description?: string;
  isSelected: boolean;
  isRecommended?: boolean;
  onClick: () => void;
  lang: 'en' | 'zh';
  preview?: React.ReactNode;
}

export const OptionCard: React.FC<Props> = ({
  name, name_zh, description, isSelected, isRecommended, onClick, lang, preview
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-full min-h-11 text-left p-2.5 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-sm'
          : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
      }`}
    >
      {isRecommended && (
        <span className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
          {lang === 'zh' ? '推荐' : 'Best'}
        </span>
      )}
      <div className="flex items-center gap-2">
        {preview && <div className="shrink-0">{preview}</div>}
        <div className="min-w-0">
          <div className={`text-xs font-semibold truncate ${isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-stone-700 dark:text-stone-300'}`}>
            {lang === 'zh' ? name_zh : name}
          </div>
          {description && (
            <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
