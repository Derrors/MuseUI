import React, { useRef, useState } from 'react';
import { I18N } from '../constants';
import { LangType, Project } from '../types';
import IconLoader from './IconLoader';
import ApiKeyConfig from './ApiKeyConfig';
import { hasAnyAPI } from '../services/apiKeyStore';
import { Badge, Button, DropdownMenuShell, Flex, IconButton, Separator, Text } from './ui';

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
  lang,
  setLang,
  theme,
  toggleTheme,
  devMode,
  toggleDevMode,
  onOpenGallery,
  onExportConfig,
  onImportConfig,
  currentProject,
  isSaving,
  onUpdateCurrentProject,
  onRenameProject,
  onOpenProjectManager,
}) => {
  const t = I18N[lang];
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasKey = hasAnyAPI();

  const isZh = lang === 'zh';

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

  const openApiSettings = () => setShowApiSettings(true);

  const menuItems = [
    {
      label: hasKey ? (isZh ? 'API 设置' : 'API settings') : (isZh ? '配置 API Key' : 'Set API Key'),
      iconName: 'settings' as const,
      mobileApiEntry: true,
      onSelect: openApiSettings,
    },
    { label: t.gallery, iconName: 'image' as const, onSelect: onOpenGallery },
    {
      label: theme === 'dark' ? (isZh ? '浅色模式' : 'Light mode') : (isZh ? '深色模式' : 'Dark mode'),
      iconName: theme === 'dark' ? ('sun' as const) : ('moon' as const),
      onSelect: toggleTheme,
    },
    {
      label: lang === 'zh' ? 'English' : '中文',
      iconName: 'globe' as const,
      onSelect: () => setLang(lang === 'zh' ? 'en' : 'zh'),
    },
    {
      label: devMode ? (isZh ? '关闭 DEV' : 'Disable DEV') : (isZh ? '开启 DEV' : 'Enable DEV'),
      iconName: 'code' as const,
      onSelect: toggleDevMode,
    },
    { label: isZh ? '导出配置' : 'Export config', iconName: 'download' as const, onSelect: onExportConfig },
    { label: isZh ? '导入配置' : 'Import config', iconName: 'upload' as const, onSelect: () => importInputRef.current?.click() },
  ];

  return (
    <>
      <header className="muse-topbar relative z-20 flex h-16 shrink-0 items-center justify-between border-b px-3 md:px-4">
        <Flex align="center" gap="3" className="min-w-0">
          <a href="/" className="flex shrink-0 items-center gap-2 rounded-xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]">
            <span className="muse-brand-mark flex h-10 w-10 items-center justify-center rounded-xl p-[2px]">
              <img src="/logo.png" alt="MuseUI" className="h-full w-full rounded-[10px] object-cover bg-white" />
            </span>
            <span className="hidden leading-tight sm:block">
              <Text size="4" weight="bold" className="block text-[var(--gray-12)]">MuseUI</Text>
              <Text size="1" color="gray" className="block -mt-0.5">{isZh ? '创作工作台' : 'Creative Studio'}</Text>
            </span>
          </a>
          <Separator orientation="vertical" className="hidden h-7 md:block" />
          <Button
            variant="soft"
            color="gray"
            size="2"
            onClick={onOpenProjectManager}
            className="hidden md:inline-flex rounded-full"
            iconName="grid"
          >
            {isZh ? '项目' : 'Projects'}
          </Button>
        </Flex>

        <Flex align="center" gap="2" className="min-w-0">
          {currentProject && (
            <Flex align="center" gap="2" className="muse-panel-quiet min-w-0 rounded-full px-2.5 py-1.5">
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  className="w-24 bg-transparent text-xs font-bold text-[var(--accent-11)] outline-none md:w-40"
                />
              ) : (
                <button
                  onClick={startRename}
                  className="max-w-[92px] truncate text-xs font-bold text-[var(--accent-11)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] md:max-w-[180px]"
                  title={isZh ? '点击改名' : 'Click to rename'}
                >
                  {currentProject.name}
                </button>
              )}
              <IconButton
                iconName={isSaving ? 'loader' : 'save'}
                label={isZh ? (isSaving ? '保存中' : '保存当前项目') : (isSaving ? 'Saving' : 'Save project')}
                size="1"
                variant="ghost"
                color="ruby"
                disabled={isSaving}
                onClick={() => { if (!isSaving) onUpdateCurrentProject(); }}
              />
            </Flex>
          )}

          <Button
            onClick={openApiSettings}
            data-mobile-api-entry
            size="2"
            variant={hasKey ? 'soft' : 'solid'}
            color={hasKey ? 'gray' : 'amber'}
            iconName="settings"
            className={`relative rounded-full ${hasKey ? '' : 'muse-gradient-action'}`}
            aria-label={isZh ? '打开 API 设置' : 'Open API settings'}
          >
            <span>API</span>
            {!hasKey && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--amber-9)]" />}
          </Button>

          <Flex align="center" gap="2" className="hidden md:flex">
            <Button variant="soft" color="gray" size="2" onClick={onOpenGallery} iconName="image" className="rounded-full">
              {t.gallery}
            </Button>
            <Flex align="center" className="muse-panel-quiet rounded-full p-0.5">
              <button onClick={() => setLang('en')} className={`rounded-full px-2.5 py-1 text-xs transition-colors ${lang === 'en' ? 'bg-[var(--color-panel-solid)] text-[var(--gray-12)] shadow-sm' : 'text-[var(--gray-10)] hover:text-[var(--gray-12)]'}`}>EN</button>
              <button onClick={() => setLang('zh')} className={`rounded-full px-2.5 py-1 text-xs transition-colors ${lang === 'zh' ? 'bg-[var(--color-panel-solid)] text-[var(--gray-12)] shadow-sm' : 'text-[var(--gray-10)] hover:text-[var(--gray-12)]'}`}>中文</button>
            </Flex>
            <IconButton
              iconName={theme === 'dark' ? 'sun' : 'moon'}
              label={theme === 'dark' ? (isZh ? '浅色模式' : 'Light mode') : (isZh ? '深色模式' : 'Dark mode')}
              variant="soft"
              color="gray"
              onClick={toggleTheme}
            />
            <Button size="2" variant={devMode ? 'solid' : 'soft'} color={devMode ? 'ruby' : 'gray'} onClick={toggleDevMode} className="rounded-full">
              DEV
            </Button>
            <a
              href="https://github.com/Derrors/MuseUI"
              target="_blank"
              rel="noreferrer"
              aria-label={isZh ? '打开 MuseUI GitHub 仓库' : 'Open MuseUI on GitHub'}
              className="muse-panel-quiet flex h-8 w-8 items-center justify-center rounded-full text-[var(--gray-10)] transition-colors hover:text-[var(--gray-12)]"
            >
              <IconLoader name="code" size={18} />
            </a>
          </Flex>

          <div className="md:hidden">
            <DropdownMenuShell
              trigger={(
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  aria-label={isZh ? '打开更多操作' : 'Open more actions'}
                  trailingIconName="menu"
                >
                  {isZh ? '更多' : 'More'}
                </Button>
              )}
              items={menuItems}
            />
          </div>

          <Badge color={devMode ? 'ruby' : 'gray'} variant={devMode ? 'solid' : 'soft'} className="hidden lg:inline-flex">
            {devMode ? 'DEV ON' : 'DEV OFF'}
          </Badge>
        </Flex>
      </header>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          onImportConfig(e);
          e.currentTarget.value = '';
        }}
      />

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
