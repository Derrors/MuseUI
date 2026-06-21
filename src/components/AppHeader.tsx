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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <header className="relative h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-3 md:px-4 z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <img src="/logo.png" alt="MuseUI" className="w-8 h-8 rounded-lg object-cover" />
            <h1 className="hidden sm:block font-bold text-stone-800 dark:text-stone-100 text-lg">MuseUI</h1>
          </a>
        </div>

        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {currentProject && (
            <div className="flex h-10 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2 text-teal-700 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-300">
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsEditingName(false); }}
                  className="w-20 bg-transparent text-xs font-bold outline-none"
                />
              ) : (
                <button
                  onClick={startRename}
                  className="max-w-[92px] truncate text-xs font-bold"
                  title={lang === 'zh' ? '点击改名' : 'Click to rename'}
                >
                  {currentProject.name}
                </button>
              )}
              <button
                onClick={() => { if (!isSaving) onUpdateCurrentProject(); }}
                disabled={isSaving}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-teal-100 disabled:opacity-50 dark:hover:bg-teal-900/40"
                title={lang === 'zh' ? (isSaving ? '保存中...' : '保存当前变动到此项目') : (isSaving ? 'Saving...' : 'Save changes to this project')}
              >
                {isSaving ? (
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <IconLoader name="save" size={15} />
                )}
              </button>
            </div>
          )}
          <button
            onClick={() => setShowApiSettings(true)}
            data-mobile-api-entry
            className={`relative flex h-10 min-w-[58px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${
              hasKey
                ? 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                : 'border border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
            }`}
            aria-label={lang === 'zh' ? '打开 API 设置' : 'Open API settings'}
            title={lang === 'zh' ? 'API 设置' : 'API settings'}
          >
            <IconLoader name="settings" size={16} />
            <span className="leading-none">API</span>
            {!hasKey && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber-500" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label={lang === 'zh' ? '打开更多操作' : 'Open more actions'}
            title={lang === 'zh' ? '更多' : 'More'}
          >
            <IconLoader name="menu" size={20} />
          </button>

          {isMobileMenuOpen && (
            <div className="absolute right-3 top-full mt-2 w-60 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900">
              <button
                onClick={() => { setShowApiSettings(true); setIsMobileMenuOpen(false); }}
                data-mobile-menu-api-entry
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800 ${
                  hasKey
                    ? 'text-stone-700 dark:text-stone-200'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                <IconLoader name="settings" size={16} />
                <span className="min-w-0 flex-1 truncate">
                  {hasKey
                    ? (lang === 'zh' ? 'API 设置' : 'API settings')
                    : (lang === 'zh' ? '未设置 API Key' : 'Set API Key')}
                </span>
              </button>
              <button onClick={() => { onOpenGallery(); setIsMobileMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800">
                <IconLoader name="image" size={16} /> {t.gallery}
              </button>
              <button onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800">
                <IconLoader name={theme === 'dark' ? 'sun' : 'moon'} size={16} /> {theme === 'dark' ? (lang === 'zh' ? '浅色模式' : 'Light mode') : (lang === 'zh' ? '深色模式' : 'Dark mode')}
              </button>
              <button onClick={() => { setLang(lang === 'zh' ? 'en' : 'zh'); setIsMobileMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800">
                <IconLoader name="globe" size={16} /> {lang === 'zh' ? 'English' : '中文'}
              </button>
              <button onClick={() => { toggleDevMode(); setIsMobileMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800">
                <IconLoader name="code" size={16} /> {devMode ? (lang === 'zh' ? '关闭 DEV' : 'Disable DEV') : (lang === 'zh' ? '开启 DEV' : 'Enable DEV')}
              </button>
              <button onClick={() => { onExportConfig(); setIsMobileMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800">
                <IconLoader name="download" size={16} /> {lang === 'zh' ? '导出配置' : 'Export config'}
              </button>
              <button onClick={() => importInputRef.current?.click()} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800">
                <IconLoader name="upload" size={16} /> {lang === 'zh' ? '导入配置' : 'Import config'}
              </button>
              <a href="https://github.com/Derrors/MuseUI" target="_blank" rel="noreferrer" className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800" onClick={() => setIsMobileMenuOpen(false)}>
                <IconLoader name="code" size={16} /> GitHub
              </a>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {currentProject && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-teal-800">
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

          <div className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 p-1">
            <div className="flex bg-white dark:bg-stone-900 rounded-lg p-1 shadow-sm">
              <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs rounded ${lang === 'en' ? 'bg-stone-100 dark:bg-stone-700 shadow text-stone-800 dark:text-stone-100' : 'text-stone-500'}`}>EN</button>
              <button onClick={() => setLang('zh')} className={`px-2 py-1 text-xs rounded ${lang === 'zh' ? 'bg-stone-100 dark:bg-stone-700 shadow text-stone-800 dark:text-stone-100' : 'text-stone-500'}`}>中文</button>
            </div>

            <button onClick={toggleTheme} className="p-2 text-stone-500 hover:bg-white dark:hover:bg-stone-700 rounded-lg">
              {theme === 'dark' ? <IconLoader name="sun" size={20} /> : <IconLoader name="moon" size={20} />}
            </button>
            <button
              onClick={onOpenGallery}
              className="px-3 py-1.5 hover:bg-white dark:hover:bg-stone-700 rounded-lg text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-2"
            >
              <IconLoader name="image" size={16} /> <span>{t.gallery}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 p-1">
            <button onClick={toggleDevMode} className={`px-2 py-1 text-[10px] rounded border ${devMode ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-white dark:bg-stone-900 text-stone-400 border-stone-200 dark:border-stone-700'}`}>
              DEV
            </button>

            {/* API Key Button */}
            <button
              onClick={() => setShowApiSettings(true)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                hasKey
                  ? 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
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
            <a
              href="https://github.com/Derrors/MuseUI"
              target="_blank"
              rel="noreferrer"
              aria-label={lang === 'zh' ? '打开 MuseUI GitHub 仓库' : 'Open MuseUI on GitHub'}
              title={lang === 'zh' ? 'GitHub 仓库' : 'GitHub repository'}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-white dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  fill="currentColor"
                  d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.238-.009-.868-.014-1.704-2.782.605-3.369-1.343-3.369-1.343-.455-1.157-1.11-1.465-1.11-1.465-.908-.621.069-.609.069-.609 1.004.071 1.532 1.033 1.532 1.033.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.094.39-1.988 1.03-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.563 9.563 0 0 1 12 6.847c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.594 1.028 2.688 0 3.848-2.337 4.695-4.566 4.943.36.31.679.921.679 1.856 0 1.339-.012 2.42-.012 2.749 0 .268.18.579.688.481A10.025 10.025 0 0 0 22 12.021C22 6.484 17.523 2 12 2Z"
                />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          onImportConfig(e);
          e.currentTarget.value = '';
          setIsMobileMenuOpen(false);
        }}
      />

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
