import React, { useRef, useState } from 'react';
import { I18N } from '../constants';
import { LangType, Project } from '../types';
import IconLoader from './IconLoader';
import ApiKeyConfig from './ApiKeyConfig';
import { hasAnyAPI } from '../services/apiKeyStore';

interface Props {
  lang: LangType;
  setLang: (l: LangType) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  devMode: boolean;
  toggleDevMode: () => void;
  onOpenGallery: () => void;
  onExportConfig: () => void;
  onImportConfig: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentProject?: Project;
  isSaving?: boolean;
  onUpdateCurrentProject: () => void;
  onRenameProject?: (newName: string) => void;
  onOpenProjectManager: () => void;
}

const AppHeader: React.FC<Props> = ({
  lang, setLang, theme, toggleTheme, devMode, toggleDevMode, onOpenGallery,
  onExportConfig, onImportConfig,
  currentProject, isSaving, onUpdateCurrentProject, onRenameProject, onOpenProjectManager,
}) => {
  const t = I18N[lang];
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasKey = hasAnyAPI();

  const startRename = () => {
    if (!currentProject || !onRenameProject) return;
    setEditName(currentProject.name);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const commitRename = () => {
    if (editName.trim() && editName.trim() !== currentProject?.name) {
      onRenameProject?.(editName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <>
      <header className="h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 z-20 shrink-0">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="MuseUI" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="font-bold text-stone-800 dark:text-stone-100 text-lg">MuseUI</h1>
        </a>

        <div className="flex items-center gap-2">
          {currentProject && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-teal-800 mr-2">
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsEditingName(false); }}
                  className="text-xs font-bold bg-transparent border-b border-teal-400 dark:border-teal-600 outline-none max-w-[150px] text-teal-700 dark:text-teal-300"
                />
              ) : (
                <button
                  onClick={startRename}
                  className="text-xs font-bold max-w-[150px] truncate hover:underline cursor-pointer"
                  title={lang === 'zh' ? '点击改名' : 'Click to rename'}
                >
                  {currentProject.name}
                </button>
              )}
              <div className="h-3 w-px bg-teal-200 dark:bg-teal-800 mx-1"></div>
              <button
                onClick={() => { if (!isSaving) onUpdateCurrentProject(); }}
                disabled={isSaving}
                className={`p-1.5 text-teal-600 dark:text-teal-400 rounded flex items-center gap-1 transition-all ${isSaving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:text-teal-800 dark:hover:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/40'
                  }`}
                title={lang === 'zh' ? (isSaving ? '保存中...' : '保存当前变动到此项目') : (isSaving ? 'Saving...' : 'Save changes to this project')}
              >
                {isSaving ? (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <IconLoader name="save" size={14} />
                )}
              </button>
            </div>
          )}

          <div className="flex bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
            <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs rounded ${lang === 'en' ? 'bg-white dark:bg-stone-700 shadow text-stone-800 dark:text-stone-100' : 'text-stone-500'}`}>EN</button>
            <button onClick={() => setLang('zh')} className={`px-2 py-1 text-xs rounded ${lang === 'zh' ? 'bg-white dark:bg-stone-700 shadow text-stone-800 dark:text-stone-100' : 'text-stone-500'}`}>中文</button>
          </div>

          <button onClick={toggleTheme} className="p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
            {theme === 'dark' ? <IconLoader name="sun" size={20} /> : <IconLoader name="moon" size={20} />}
          </button>
          <button
            onClick={onOpenGallery}
            className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-2"
          >
            <IconLoader name="image" size={16} /> <span>{t.gallery}</span>
          </button>
          <button onClick={toggleDevMode} className={`px-2 py-1 text-[10px] rounded border ${devMode ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
            DEV
          </button>

          {/* API Key Button */}
          <button
            onClick={() => setShowApiSettings(true)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              hasKey
                ? 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
                : 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
            }`}
          >
            <IconLoader name="settings" size={14} />
            {hasKey
              ? (lang === 'zh' ? 'API' : 'API')
              : (lang === 'zh' ? '未设置 Key' : 'Set API Key')
            }
            {!hasKey && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* API Settings Modal */}
      {showApiSettings && (
        <ApiKeyConfig
          lang={lang}
          onClose={() => setShowApiSettings(false)}
          onConfigured={() => setShowApiSettings(false)}
        />
      )}
    </>
  );
};

export default AppHeader;
