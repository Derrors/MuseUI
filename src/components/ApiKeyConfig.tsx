import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAPISettings,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_TEXT_MODEL,
  IMAGE_MODEL_PRESETS,
  saveAPISettings,
  TEXT_MODEL_PRESETS,
} from '../services/apiKeyStore';
import {
  callOpenAIChatImageAPI,
  callOpenAIImageAPI,
  callOpenAITextAPI,
  shouldFallbackToChatImageAPI,
} from '../services/aiService';
import { buildOpenAICompatibleRequestUrl, buildOpenAICompatibleUrl, normalizeOpenAIBaseUrl } from '../services/apiUrl';
import { APIConfig, OpenAIImageMode } from '../types';
import { createId } from '../utils/id';

interface Props {
  onConfigured?: () => void;
  onClose?: () => void;
  lang?: 'en' | 'zh';
}

const officialApiGuides = [
  {
    id: 'openai',
    title: { zh: 'OpenAI 兼容 API', en: 'OpenAI-Compatible API' },
    description: {
      zh: 'Base URL 按服务根地址填写，代码会自动拼接 chat/completions、images/generations 和 models。',
      en: 'Enter the service root. The app appends chat/completions, images/generations, and models automatically.',
    },
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    keyUrl: 'https://platform.openai.com/api-keys',
    endpoints: [
      { label: { zh: '服务根地址', en: 'Service root' }, value: 'https://api.openai.com/v1' },
      { label: { zh: '文本请求', en: 'Text request' }, value: '/chat/completions' },
      { label: { zh: '图片请求', en: 'Image request' }, value: '/images/generations' },
      { label: { zh: '模型列表', en: 'Models list' }, value: '/models' },
    ],
    steps: {
      zh: [
        'Provider 选择 OpenAI',
        'Base URL 填官方或中转站根地址，例如 https://api.example.com/v1',
        '不要再填写 /chat/completions 或 /images/generations',
        '如果图片服务只支持聊天接口，可把图片模式切到 Chat Completions',
      ],
      en: [
        'Choose OpenAI as the provider',
        'Use a root URL such as https://api.example.com/v1',
        'Do not include /chat/completions or /images/generations',
        'If image generation is routed through chat, switch image mode to Chat Completions',
      ],
    },
  },
];

const defaultAPIConfig = (): APIConfig => ({
  id: createId('api'),
  name: '',
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  textModel: DEFAULT_TEXT_MODEL,
  imageModel: DEFAULT_IMAGE_MODEL,
  enabled: true,
  textEnabled: true,
  imageEnabled: true,
  imageMode: 'auto',
});

const normalizeProfileForUI = (api: APIConfig): APIConfig => ({
  ...api,
  name: api.name || '',
  textEnabled: api.textEnabled ?? true,
  imageEnabled: api.imageEnabled ?? true,
  imageMode: api.imageMode || 'auto',
});

const PINNED_TEXT_MODELS = [
  'gpt-5.4',
  'gpt-5.5',
];

const PINNED_IMAGE_MODELS = [
  'gpt-image-2',
];

export default function ApiKeyConfig({ onConfigured, onClose, lang = 'zh' }: Props) {
  const isZh = lang === 'zh';
  const [profiles, setProfiles] = useState<APIConfig[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
  const [fetchingModelsId, setFetchingModelsId] = useState<string | null>(null);
  const [fetchErrors, setFetchErrors] = useState<Record<string, string>>({});
  const fetchedSignaturesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const settings = getAPISettings();
    setProfiles(settings.profiles.length > 0
      ? settings.profiles.map(normalizeProfileForUI)
      : [defaultAPIConfig()]);
  }, []);

  const persist = () => {
    saveAPISettings({ profiles });
  };

  const resetFetchedModels = (id: string) => {
    setFetchedModels(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFetchErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    delete fetchedSignaturesRef.current[id];
  };

  const handleAdd = () => {
    setProfiles(prev => [...prev, defaultAPIConfig()]);
  };

  const handleRemove = (id: string) => {
    setProfiles(prev => prev.filter(api => api.id !== id));
    resetFetchedModels(id);
  };

  const handleUpdate = (id: string, updates: Partial<APIConfig>) => {
    const trimmed: Partial<APIConfig> = { ...updates };
    if (trimmed.baseUrl !== undefined) trimmed.baseUrl = trimmed.baseUrl.trim().replace(/\s+/g, '');
    if (trimmed.apiKey !== undefined) trimmed.apiKey = trimmed.apiKey.trim().replace(/\s+/g, '');
    if (trimmed.textModel !== undefined) trimmed.textModel = trimmed.textModel.trim().replace(/\s+/g, '');
    if (trimmed.imageModel !== undefined) trimmed.imageModel = trimmed.imageModel.trim().replace(/\s+/g, '');
    setProfiles(prev => prev.map(api => api.id === id ? normalizeProfileForUI({ ...api, ...trimmed }) : api));
  };

  const handleTest = async (kind: 'text' | 'image', api: APIConfig) => {
    if (!api.apiKey.trim()) return;
    setTestingId(`${api.id}:${kind}`);
    setTestResult(null);
    const start = Date.now();

    try {
      if (kind === 'text') {
        await callOpenAITextAPI(api, { prompt: 'Hi' });
      } else if (api.imageMode === 'chat') {
        await callOpenAIChatImageAPI(api, { prompt: 'A simple blue circle on white background', aspectRatio: '1:1' });
      } else {
        try {
          await callOpenAIImageAPI(api, { prompt: 'A simple blue circle on white background', aspectRatio: '1:1' });
        } catch (error: any) {
          if (api.imageMode !== 'images' && shouldFallbackToChatImageAPI(error)) {
            await callOpenAIChatImageAPI(api, { prompt: 'A simple blue circle on white background', aspectRatio: '1:1' });
          } else {
            throw error;
          }
        }
      }

      setTestResult({ id: api.id, ok: true, msg: isZh ? `成功 (${Date.now() - start}ms)` : `OK (${Date.now() - start}ms)` });
    } catch (error: any) {
      setTestResult({ id: api.id, ok: false, msg: error.message || 'Failed' });
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveAll = () => {
    persist();
    onConfigured?.();
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (event: React.DragEvent, id: string) => {
    setDraggedId(id);
    event.dataTransfer.effectAllowed = 'move';
    (event.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (event: React.DragEvent) => {
    setDraggedId(null);
    setDragOverId(null);
    (event.currentTarget as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (event: React.DragEvent, id: string) => {
    event.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setProfiles(prev => {
      const fromIndex = prev.findIndex(api => api.id === draggedId);
      const toIndex = prev.findIndex(api => api.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
    setDraggedId(null);
    setDragOverId(null);
  };

  const startRename = (api: APIConfig) => {
    setEditingNameId(api.id);
    setEditingNameValue(api.name);
  };

  const commitRename = (id: string) => {
    if (editingNameValue.trim()) handleUpdate(id, { name: editingNameValue.trim() });
    setEditingNameId(null);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchModelsForApi = useCallback(async (api: APIConfig, force = false) => {
    if (!api.apiKey.trim()) {
      setFetchErrors(prev => ({ ...prev, [api.id]: isZh ? '请填写 API Key' : 'Please enter API Key' }));
      return;
    }

    const signature = `${api.provider}|${api.baseUrl.trim()}|${api.apiKey.trim()}`;
    if (!force && fetchedSignaturesRef.current[api.id] === signature) return;

    setFetchingModelsId(api.id);
    setFetchErrors(prev => {
      const next = { ...prev };
      delete next[api.id];
      return next;
    });

    try {
      const res = await fetch(buildOpenAICompatibleRequestUrl(api.baseUrl, 'models'), {
        headers: { Authorization: `Bearer ${api.apiKey}` },
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${errText ? `: ${errText}` : ''}`);
      }
      const data = await res.json();
      const supportedModels = new Set([...TEXT_MODEL_PRESETS, ...IMAGE_MODEL_PRESETS]);
      const models = (data.data || [])
        .map((model: any) => model.id)
        .filter((model: string | undefined): model is string => Boolean(model && supportedModels.has(model)));

      setFetchedModels(prev => ({ ...prev, [api.id]: models }));
      fetchedSignaturesRef.current[api.id] = signature;
    } catch (error: any) {
      setFetchErrors(prev => ({ ...prev, [api.id]: error.message || (isZh ? '获取模型列表失败' : 'Failed to fetch models') }));
    } finally {
      setFetchingModelsId(null);
    }
  }, [isZh]);

  useEffect(() => {
    profiles.forEach(api => {
      if (!api.apiKey.trim()) return;
      const signature = `${api.provider}|${api.baseUrl.trim()}|${api.apiKey.trim()}`;
      if (fetchedSignaturesRef.current[api.id] !== signature) {
        fetchModelsForApi(api, false);
      }
    });
  }, [profiles, fetchModelsForApi]);

  const getModelOptions = (_api: APIConfig, kind: 'text' | 'image'): string[] => {
    return kind === 'text' ? TEXT_MODEL_PRESETS : IMAGE_MODEL_PRESETS;
  };

  const inputCls = 'w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white text-xs placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
  const selectCls = 'w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none';
  const labelCls = 'block text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-0.5 uppercase tracking-wider';
  const toggleCls = 'flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2.5 py-2 text-xs text-stone-600 dark:text-stone-300';

  const renderModelField = (api: APIConfig, kind: 'text' | 'image') => {
    const isText = kind === 'text';
    const label = isText ? (isZh ? '文本模型' : 'Text Model') : (isZh ? '图片模型' : 'Image Model');
    const value = isText ? api.textModel || '' : api.imageModel || '';
    const pinned = isText ? PINNED_TEXT_MODELS : PINNED_IMAGE_MODELS;

    return (
      <div>
        <label className={labelCls}>{label}</label>
        <select
          value={value}
          onChange={event => handleUpdate(api.id, isText ? { textModel: event.target.value } : { imageModel: event.target.value })}
          className={selectCls}
        >
          <option value="">{isZh ? '选择模型...' : 'Select model...'}</option>
          {getModelOptions(api, kind).map(model => (
            <option key={model} value={model}>
              {model} {pinned.includes(model) ? '*' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderEndpointPreview = (api: APIConfig) => {
    const normalized = normalizeOpenAIBaseUrl(api.baseUrl);
    return (
      <div className="text-[10px] text-stone-400 dark:text-stone-500 leading-relaxed mt-1 space-y-0.5">
        <div>{isZh ? '标准化根地址' : 'Normalized root'}: <code className="break-all">{normalized}</code></div>
        <div>{isZh ? '文本' : 'Text'}: <code className="break-all">{buildOpenAICompatibleUrl(api.baseUrl, 'chat/completions')}</code></div>
        <div>{isZh ? '图片' : 'Image'}: <code className="break-all">{buildOpenAICompatibleUrl(api.baseUrl, 'images/generations')}</code></div>
      </div>
    );
  };

  const renderAPICard = (api: APIConfig, index: number) => {
    const isCollapsed = collapsedIds.has(api.id);
    const isDragOver = dragOverId === api.id && draggedId !== api.id;
    const isEditingName = editingNameId === api.id;
    const isKeyVisible = visibleKeys.has(api.id);
    const isFetchingModels = fetchingModelsId === api.id;
    const displayName = api.name || (isZh ? '未命名 Profile' : 'Unnamed Profile');

    return (
      <div
        key={api.id}
        draggable
        onDragStart={event => handleDragStart(event, api.id)}
        onDragEnd={handleDragEnd}
        onDragOver={event => handleDragOver(event, api.id)}
        onDrop={() => handleDrop(api.id)}
        className={`border rounded-xl transition-all ${isDragOver ? 'border-teal-400 dark:border-teal-500 ring-2 ring-teal-200 dark:ring-teal-900/40' : 'border-stone-200 dark:border-stone-700'} bg-stone-50 dark:bg-stone-800/50`}
      >
        <div className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing">
          <div className="text-stone-400 dark:text-stone-500 shrink-0" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${index === 0 ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <input
                autoFocus
                value={editingNameValue}
                onChange={event => setEditingNameValue(event.target.value)}
                onBlur={() => commitRename(api.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter') commitRename(api.id);
                  if (event.key === 'Escape') setEditingNameId(null);
                }}
                className="w-full text-xs font-bold bg-white dark:bg-stone-900 border border-teal-300 dark:border-teal-600 rounded px-1.5 py-0.5 text-stone-800 dark:text-stone-200 outline-none"
              />
            ) : (
              <button
                onClick={() => startRename(api)}
                className="text-xs font-bold text-stone-700 dark:text-stone-300 truncate hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left w-full"
                title={isZh ? '点击重命名' : 'Click to rename'}
              >
                {displayName}
              </button>
            )}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-stone-400 dark:text-stone-500">OpenAI-compatible</span>
              {api.textEnabled && <span className="text-[9px] px-1 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">{isZh ? '文本' : 'Text'}</span>}
              {api.imageEnabled && <span className="text-[9px] px-1 rounded bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">{isZh ? '图片' : 'Image'}</span>}
            </div>
          </div>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${api.enabled ? 'bg-green-500' : 'bg-stone-300 dark:bg-stone-600'}`} title={api.enabled ? (isZh ? '已启用' : 'Enabled') : (isZh ? '已禁用' : 'Disabled')} />
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => handleTest('text', api)}
              disabled={testingId === `${api.id}:text` || !api.apiKey.trim() || !api.textEnabled}
              className="text-[10px] px-1.5 py-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-40 text-stone-500 dark:text-stone-400 transition-colors"
              title={isZh ? '测试文本' : 'Test text'}
            >
              {testingId === `${api.id}:text` ? '...' : (isZh ? '文' : 'T')}
            </button>
            <button
              onClick={() => handleTest('image', api)}
              disabled={testingId === `${api.id}:image` || !api.apiKey.trim() || !api.imageEnabled}
              className="text-[10px] px-1.5 py-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-40 text-stone-500 dark:text-stone-400 transition-colors"
              title={isZh ? '测试图片' : 'Test image'}
            >
              {testingId === `${api.id}:image` ? '...' : (isZh ? '图' : 'I')}
            </button>
            <button
              onClick={() => toggleCollapse(api.id)}
              className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              title={isCollapsed ? (isZh ? '展开' : 'Expand') : (isZh ? '收起' : 'Collapse')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => setDeleteConfirm({ id: api.id, name: displayName })}
              className="p-1 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title={isZh ? '删除' : 'Remove'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {testResult?.id === api.id && (
          <div className={`px-3 pb-2 text-[10px] ${testResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {testResult.msg}
          </div>
        )}

        {!isCollapsed && (
          <div className="px-3 pb-3 space-y-3">
            <div className="h-px bg-stone-200 dark:bg-stone-700" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>{isZh ? '协议' : 'Protocol'}</label>
                <div className={`${toggleCls} h-[31px]`}>
                  OpenAI-compatible
                </div>
              </div>
              <div>
                <label className={labelCls}>{isZh ? '总开关' : 'Profile'}</label>
                <label className={`${toggleCls} h-[31px]`}>
                  <input
                    type="checkbox"
                    checked={api.enabled}
                    onChange={event => handleUpdate(api.id, { enabled: event.target.checked })}
                    className="accent-teal-500"
                  />
                  {isZh ? '启用此 Profile' : 'Enabled'}
                </label>
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={toggleCls}>
                  <input
                    type="checkbox"
                    checked={api.textEnabled}
                    onChange={event => handleUpdate(api.id, { textEnabled: event.target.checked })}
                    className="accent-cyan-500"
                  />
                  {isZh ? '用于文本思考' : 'Use for text'}
                </label>
                <label className={toggleCls}>
                  <input
                    type="checkbox"
                    checked={api.imageEnabled}
                    onChange={event => handleUpdate(api.id, { imageEnabled: event.target.checked })}
                    className="accent-teal-500"
                  />
                  {isZh ? '用于图片生成' : 'Use for images'}
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>{isZh ? 'Base URL（服务根地址）' : 'Base URL (service root)'}</label>
                <input
                  type="text"
                  value={api.baseUrl}
                  onChange={event => handleUpdate(api.id, { baseUrl: event.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className={inputCls}
                />
                {renderEndpointPreview(api)}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>API Key</label>
                <div className="relative">
                  <input
                    type={isKeyVisible ? 'text' : 'password'}
                    value={api.apiKey}
                    onChange={event => handleUpdate(api.id, { apiKey: event.target.value })}
                    placeholder="sk-... or AIza..."
                    className={`${inputCls} pr-9`}
                  />
                  <button
                    onClick={() => toggleKeyVisibility(api.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-0.5"
                    title={isKeyVisible ? (isZh ? '隐藏' : 'Hide') : (isZh ? '显示' : 'Show')}
                  >
                    {isKeyVisible ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <label className={labelCls}>{isZh ? '模型列表' : 'Models'}</label>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {fetchErrors[api.id] && (
                      <span className="text-[10px] text-red-500 dark:text-red-400 truncate max-w-[220px]" title={fetchErrors[api.id]}>
                        {fetchErrors[api.id]}
                      </span>
                    )}
                    {fetchedModels[api.id] && !fetchErrors[api.id] && (
                      <span className="text-[10px] text-green-600 dark:text-green-400">
                        {isZh ? `已获取 ${fetchedModels[api.id].length} 个模型` : `${fetchedModels[api.id].length} models fetched`}
                      </span>
                    )}
                    <button
                      onClick={() => fetchModelsForApi(api, true)}
                      disabled={isFetchingModels || !api.apiKey.trim()}
                      className="text-stone-400 dark:text-stone-500 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-40 transition-colors p-0.5"
                      title={isZh ? '刷新模型列表' : 'Refresh model list'}
                    >
                      {isFetchingModels ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <polyline points="1 20 1 14 7 14" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {renderModelField(api, 'text')}
              {renderModelField(api, 'image')}
              <div className="sm:col-span-2">
                <label className={labelCls}>{isZh ? '图片请求模式' : 'Image request mode'}</label>
                <select
                  value={api.imageMode || 'auto'}
                  onChange={event => handleUpdate(api.id, { imageMode: event.target.value as OpenAIImageMode })}
                  className={selectCls}
                >
                  <option value="auto">{isZh ? '自动：先 images/generations，必要时回退 chat/completions' : 'Auto: images first, fallback to chat'}</option>
                  <option value="images">{isZh ? 'Images API：/images/generations' : 'Images API: /images/generations'}</option>
                  <option value="chat">{isZh ? 'Chat Completions：/chat/completions' : 'Chat Completions: /chat/completions'}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-stone-800 rounded-none sm:rounded-2xl border border-stone-200 dark:border-stone-700 w-full sm:w-[92%] lg:w-[80%] shadow-2xl flex flex-col h-[100dvh] max-h-[100dvh] sm:h-[90vh] sm:max-h-[90vh]" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 border-b border-stone-200 dark:border-stone-700 shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                <line x1="6" y1="12" x2="18" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className="text-stone-900 dark:text-white font-bold text-sm">{isZh ? 'API 设置' : 'API Settings'}</h2>
              <p className="text-stone-500 text-xs leading-relaxed">
                {isZh ? '一个 Profile 统一管理 Key、根地址、文本模型和图片模型' : 'One profile manages key, root URL, text model, and image model'}
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div data-api-config-body className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:min-h-0 lg:h-full">
            <div className="lg:col-span-2 flex flex-col lg:h-full lg:min-h-0">
              <div className="flex items-center justify-between shrink-0 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-700 dark:text-stone-200">{isZh ? 'API Profiles' : 'API Profiles'}</h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                    {isZh ? '按顺序 fallback；每个 Profile 可单独控制文本和图片用途。' : 'Fallback follows this order; text and image usage can be toggled per profile.'}
                  </p>
                </div>
                <button
                  onClick={handleAdd}
                  className="text-[10px] px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 transition-colors"
                >
                  + {isZh ? '添加' : 'Add'}
                </button>
              </div>
              <div data-api-list="profiles" className="space-y-3 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
                {profiles.map((api, index) => renderAPICard(api, index))}
              </div>
              {profiles.length === 0 && (
                <div className="text-center text-stone-400 dark:text-stone-500 text-xs py-8 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl">
                  {isZh ? '暂无配置，点击添加' : 'No profiles configured'}
                </div>
              )}
            </div>

            <div className="lg:col-span-1 flex flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
              <div data-api-guide className="space-y-4 pb-3 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
                <div>
                  <h3 className="text-sm font-bold text-stone-700 dark:text-stone-200 mb-2">
                    {isZh ? '配置规则' : 'Configuration Rules'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    {isZh
                      ? 'Base URL 现在统一表示服务根地址。OpenAI 兼容服务不再需要分别配置文本端点和图片端点。'
                      : 'Base URL now always means the service root. OpenAI-compatible services no longer need separate text and image endpoints.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {officialApiGuides.map(guide => (
                    <details
                      key={guide.id}
                      className="rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/70 dark:bg-teal-950/20"
                    >
                      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-100 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                        {isZh ? guide.title.zh : guide.title.en}
                      </summary>
                      <div className="px-3 pb-3">
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed mt-1">
                          {isZh ? guide.description.zh : guide.description.en}
                        </p>
                        <div className="flex gap-1 shrink-0 mt-2 mb-2">
                          <a
                            href={guide.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                          >
                            Key
                          </a>
                          <a
                            href={guide.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                          >
                            {isZh ? '文档' : 'Docs'}
                          </a>
                        </div>

                        <div className="space-y-1.5 mb-2">
                          {guide.endpoints.map(endpoint => (
                            <div key={`${guide.id}-${endpoint.value}`} className="text-[10px] leading-relaxed">
                              <span className="text-stone-500 dark:text-stone-400">
                                {isZh ? endpoint.label.zh : endpoint.label.en}:
                              </span>
                              <code className="block mt-0.5 px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[10px] text-stone-700 dark:text-stone-200 break-all">
                                {endpoint.value}
                              </code>
                            </div>
                          ))}
                        </div>

                        <ol className="text-[10px] text-stone-600 dark:text-stone-300 leading-relaxed space-y-1 list-decimal list-inside">
                          {(isZh ? guide.steps.zh : guide.steps.en).map(step => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 shrink-0">
          <p className="text-stone-400 dark:text-stone-500 text-[10px]">
            {isZh ? 'API Key 仅保存在浏览器本地' : 'API Keys are stored locally in your browser only'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isZh ? '保存' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-stone-700" onClick={event => event.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-stone-800 dark:text-white">
                {isZh ? '确认删除' : 'Confirm Delete'}
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              {isZh
                ? `确定要删除 API Profile「${deleteConfirm.name}」吗？此操作不可撤销。`
                : `Are you sure you want to delete the API profile "${deleteConfirm.name}"? This cannot be undone.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  handleRemove(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors"
              >
                {isZh ? '删除' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
