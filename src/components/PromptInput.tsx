
import React, { useState, useRef } from 'react';
import { COMPONENT_CATEGORIES_EN, COMPONENT_CATEGORIES_ZH, I18N } from '../constants';
import { LangType, PageRequest } from '../types';
import IconLoader from './IconLoader';

interface Props {
  description: string;
  onDescriptionChange: (s: string) => void;
  pageName: string;
  onPageNameChange: (s: string) => void;
  keywords: string[];
  onKeywordsChange: (k: string[]) => void;
  pages: PageRequest[];
  onPagesChange: (pages: PageRequest[]) => void;
  isBatchMode: boolean;
  onBatchModeChange: (isBatch: boolean) => void;
  onAutoGeneratePages: () => void;
  isAutoGenerating: boolean;
  lang: LangType;
  mode?: 'all' | 'basic' | 'keywords';
  onOpenPageBuilder?: (pageId: string) => void;
  onAddNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onAiGenerateDescription?: () => void;
  isAiGeneratingDescription?: boolean;
}

const PromptInput: React.FC<Props> = ({
  description,
  onDescriptionChange,
  pageName,
  onPageNameChange,
  keywords,
  onKeywordsChange,
  pages,
  onPagesChange,
  isBatchMode,
  onBatchModeChange,
  onAutoGeneratePages,
  isAutoGenerating,
  lang,
  mode = 'all',
  onOpenPageBuilder,
  onAddNotification,
  onAiGenerateDescription,
  isAiGeneratingDescription
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  // Page List State
  const [newPageName, setNewPageName] = useState('');
  const [newPageDesc, setNewPageDesc] = useState('');

  // Text Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const t = I18N[lang];
  const categories = lang === 'zh' ? COMPONENT_CATEGORIES_ZH : COMPONENT_CATEGORIES_EN;

  // Helper to trigger hidden file inputs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const toggleKeyword = (k: string) => {
    if (keywords.includes(k)) {
      onKeywordsChange(keywords.filter(kw => kw !== k));
    } else {
      onKeywordsChange([...keywords, k]);
    }
  };

  const handleAddPage = () => {
    if (!newPageName.trim()) return;
    const newPage: PageRequest = {
      id: Date.now().toString(),
      name: newPageName,
      description: newPageDesc
    };
    onPagesChange([...pages, newPage]);
    setNewPageName('');
    setNewPageDesc('');
  };

  const removePage = (id: string) => {
    onPagesChange(pages.filter(p => p.id !== id));
  };

  // Upload page-specific reference
  const handlePageImageUpload = (pageId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        onPagesChange(pages.map(p => p.id === pageId ? { ...p, referenceImage: base64 } : p));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePageImage = (pageId: string) => {
    onPagesChange(pages.map(p => p.id === pageId ? { ...p, referenceImage: undefined } : p));
  };

  const removePageLayout = (pageId: string) => {
    onPagesChange(pages.map(p => p.id === pageId ? { ...p, layoutImage: undefined, layoutElements: undefined } : p));
  };

  // Requirement 4: Batch Prompt Parser & Copy
  const handleCopyPages = () => {
    const text = pages.map(p => `${p.name}\n${p.description}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      if (onAddNotification) {
        onAddNotification(lang === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard', 'success');
      } else {
        alert(lang === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard');
      }
    });
  };

  const handleImportPages = () => {
    if (!importText.trim()) return;

    // Split by empty lines (regex handles multiple newlines)
    const blocks = importText.split(/\n\s*\n/);

    const newPages: PageRequest[] = [];
    blocks.forEach((block, idx) => {
      const lines = block.trim().split('\n');
      if (lines.length > 0) {
        const name = lines[0].trim();
        const desc = lines.slice(1).join(' ').trim(); // Join remaining lines as desc
        if (name) {
          newPages.push({
            id: `imported-${Date.now()}-${idx}`,
            name: name,
            description: desc
          });
        }
      }
    });

    if (newPages.length > 0) {
      onPagesChange([...pages, ...newPages]);
      setImportText('');
      setShowImport(false);
    }
  };

  const showBasic = mode === 'all' || mode === 'basic';
  const showKeywords = false; // Hidden as requested

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      {showBasic && (
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
          <button
            onClick={() => onBatchModeChange(false)}
            className={`flex-1 min-h-9 py-1.5 text-xs font-bold rounded-md transition-all ${!isBatchMode
              ? 'bg-white dark:bg-stone-600 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
          >
            {lang === 'zh' ? '单页模式' : 'Single Page'}
          </button>
          <button
            onClick={() => onBatchModeChange(true)}
            className={`flex-1 min-h-9 py-1.5 text-xs font-bold rounded-md transition-all ${isBatchMode
              ? 'bg-white dark:bg-stone-600 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
          >
            {lang === 'zh' ? '批量生成 (Spec)' : 'Batch + Spec'}
          </button>
        </div>
      )}

      {showBasic && (
        <>
          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">
                {lang === 'zh' ? '描述' : 'Description'}
              </label>
              {onAiGenerateDescription && (
                <button
                  onClick={onAiGenerateDescription}
                  disabled={!description.trim() || isAiGeneratingDescription}
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-teal-50 dark:bg-teal-900/20 text-teal-500 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isAiGeneratingDescription ? (
                    <><IconLoader name="refresh" className="animate-spin" size={10} /> {lang === 'zh' ? '优化中...' : 'Optimizing...'}</>
                  ) : (
                    <><IconLoader name="magic-wand" size={10} /> {lang === 'zh' ? 'AI 优化' : 'AI Optimize'}</>
                  )}
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => {
                  const val = e.target.value;
                  onDescriptionChange(val);
                  onPageNameChange(val.trim().split('\n')[0].slice(0, 30));
                }}
                rows={3}
                placeholder={isBatchMode
                  ? (lang === 'zh' ? '描述整个应用程序的主题、功能和目标受众...' : 'Describe the overall app theme, function, and target audience...')
                  : t.descPlaceholder
                }
                className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-200 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 p-2.5 resize-none placeholder-stone-400"
              />
            </div>
          </div>

          {isBatchMode && (
            // Batch Mode Page List
            <div className="space-y-3 mt-4">

              <div className="flex justify-between items-end">
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400">
                  {lang === 'zh' ? '页面列表' : 'Page List'}
                  <span className="text-xs font-normal text-stone-400 ml-2">
                    ({pages.length})
                  </span>
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={handleCopyPages}
                    className="text-[10px] px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                    title={lang === 'zh' ? '复制列表文本' : 'Copy List Text'}
                  >
                    <IconLoader name="copy" size={14} />
                  </button>
                  <button
                    onClick={() => setShowImport(!showImport)}
                    className="text-[10px] px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                    title={lang === 'zh' ? '导入文本' : 'Import Text'}
                  >
                    <IconLoader name="clipboard" size={14} />
                  </button>
                  <button
                    onClick={onAutoGeneratePages}
                    disabled={isAutoGenerating || !description.trim()}
                    className="text-[10px] px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors flex items-center gap-1"
                  >
                    {isAutoGenerating ? (
                      <IconLoader name="refresh" className="animate-spin" size={14} />
                    ) : (
                      <IconLoader name="magic-wand" size={14} />
                    )}
                    {lang === 'zh' ? 'AI 拆分' : 'AI Split'}
                  </button>
                </div>
              </div>

              {/* Import Text Area */}
              {
                showImport && (
                  <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">
                    <textarea
                      className="w-full h-24 text-[10px] p-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded resize-none mb-2"
                      placeholder={lang === 'zh' ? '格式：\n页面名称\n页面描述\n(空行)\n页面名称2...' : 'Format:\nPage Name\nDescription\n(Empty Line)\nPage Name 2...'}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowImport(false)} className="px-2 py-1 text-xs text-stone-500">{t.cancel}</button>
                      <button onClick={handleImportPages} className="px-2 py-1 text-xs bg-stone-700 text-white rounded">{lang === 'zh' ? '导入' : 'Import'}</button>
                    </div>
                  </div>
                )
              }

              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {pages.length === 0 && !showImport && (
                  <div className="text-center p-4 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg text-xs text-stone-400">
                    {lang === 'zh' ? '添加页面或使用AI自动生成' : 'Add pages manually or use AI auto-split'}
                  </div>
                )}
                {pages.map((p, idx) => (
                  <div key={p.id} className="p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg group relative">
                    <div className="flex justify-between items-start mb-1">
                      {editingPageId === p.id ? (
                        <input
                          autoFocus
                          className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded px-1 py-0.5 w-full mr-2 outline-none focus:ring-1 ring-teal-500"
                          value={p.name}
                          onChange={e => onPagesChange(pages.map(pg => pg.id === p.id ? { ...pg, name: e.target.value } : pg))}
                          onBlur={() => setEditingPageId(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditingPageId(null)}
                        />
                      ) : (
                        <span
                          className="text-xs font-bold text-teal-600 dark:text-teal-400 cursor-text hover:underline"
                          onClick={() => setEditingPageId(p.id)}
                        >
                          Page {idx + 1}: {p.name}
                        </span>
                      )}
                      <button onClick={() => removePage(p.id)} className="text-stone-400 hover:text-red-500 shrink-0">×</button>
                    </div>
                    {editingPageId === p.id ? (
                      <textarea
                        className="text-[10px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded p-1 w-full resize-none mb-2 outline-none focus:ring-1 ring-teal-500"
                        rows={2}
                        value={p.description}
                        onChange={e => onPagesChange(pages.map(pg => pg.id === p.id ? { ...pg, description: e.target.value } : pg))}
                        onBlur={() => setEditingPageId(null)}
                      />
                    ) : (
                      <p
                        className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 mb-2 cursor-text hover:text-stone-700 dark:hover:text-stone-300"
                        onClick={() => setEditingPageId(p.id)}
                      >
                        {p.description || (lang === 'zh' ? '点击编辑描述...' : 'Click to edit...')}
                      </p>
                    )}

                    {/* Per-Page Controls */}
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-700/50">
                      {/* Reference Image */}
                      <div className="flex items-center">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          ref={el => { fileInputRefs.current[p.id] = el; }}
                          onChange={(e) => handlePageImageUpload(p.id, e)}
                        />
                        {p.referenceImage ? (
                          <div className="relative group/ref">
                            <img src={p.referenceImage} className="w-8 h-8 rounded border object-cover" />
                            <button
                              onClick={() => removePageImage(p.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px] opacity-0 group-hover/ref:opacity-100"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRefs.current[p.id]?.click()}
                            className="text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded hover:bg-stone-200 dark:hover:bg-stone-600"
                          >
                            {lang === 'zh' ? '+ 参考图' : '+ Ref Img'}
                          </button>
                        )}
                      </div>

                      <div className="h-4 w-px bg-stone-200 dark:bg-stone-700"></div>

                      {/* Layout Builder */}
                      <div className="flex items-center">
                        {p.layoutImage ? (
                          <div className="relative group/layout">
                            <img src={p.layoutImage} className="w-8 h-8 rounded border object-cover bg-white" />
                            <button
                              onClick={() => removePageLayout(p.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px] opacity-0 group-hover/layout:opacity-100"
                            >
                              ×
                            </button>
                            <button
                              onClick={() => onOpenPageBuilder && onOpenPageBuilder(p.id)}
                              className="absolute inset-0 bg-black/20 opacity-0 group-hover/layout:opacity-100 flex items-center justify-center text-[10px] text-white"
                            >
                              <IconLoader name="edit" size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenPageBuilder && onOpenPageBuilder(p.id)}
                            className="text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded hover:bg-stone-200 dark:hover:bg-stone-600"
                          >
                            {lang === 'zh' ? '+ 布局' : '+ Layout'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Page Input */}
              <div className="p-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 rounded-lg space-y-2">
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder={lang === 'zh' ? '页面名称 (如: 个人中心)' : 'Page Name (e.g. Profile)'}
                  className="w-full text-xs p-2 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-200"
                />
                <textarea
                  value={newPageDesc}
                  onChange={(e) => setNewPageDesc(e.target.value)}
                  rows={2}
                  placeholder={lang === 'zh' ? '该页面的具体功能要求...' : 'Specific requirements for this page...'}
                  className="w-full text-xs p-2 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-200 resize-none"
                />
                <button
                  onClick={handleAddPage}
                  disabled={!newPageName.trim()}
                  className="w-full py-1.5 text-xs bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded hover:bg-stone-300 dark:hover:bg-stone-600 disabled:opacity-50 font-bold"
                >
                  + {lang === 'zh' ? '添加页面' : 'Add Page'}
                </button>
              </div>
            </div >
          )}
        </>
      )}

      {
        showKeywords && (
          // KEYWORDS SECTION REMOVED/HIDDEN AS REQUESTED
          <div></div>
        )
      }
    </div >
  );
};

export default PromptInput;
