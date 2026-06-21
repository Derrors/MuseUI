import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAPISettings,
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
import {
  createDefaultAPIProfile,
  normalizeAPIProfileForUI,
} from '../domain/api-settings/profileModel';
import {
  Badge,
  Box,
  Button,
  Card,
  DialogShell,
  Flex,
  IconButton,
  SelectField,
  SwitchField,
  Tabs,
  Text,
  TextFieldControl,
} from './ui';

interface Props {
  onConfigured?: () => void;
  onClose?: () => void;
  lang?: 'en' | 'zh';
}

const PINNED_TEXT_MODELS = ['gpt-5.4', 'gpt-5.5'];
const PINNED_IMAGE_MODELS = ['gpt-image-2'];

type SaveStatus = 'idle' | 'dirty' | 'saved';

const normalizeSingleAPIProfile = (api: APIConfig): APIConfig => ({
  ...normalizeAPIProfileForUI(api),
  enabled: true,
});

export default function ApiKeyConfig({ onConfigured, onClose, lang = 'zh' }: Props) {
  const isZh = lang === 'zh';
  const [profiles, setProfiles] = useState<APIConfig[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
  const [fetchingModelsId, setFetchingModelsId] = useState<string | null>(null);
  const [fetchErrors, setFetchErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const fetchedSignaturesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const settings = getAPISettings();
    const loaded = settings.profiles.length > 0
      ? [normalizeSingleAPIProfile(settings.profiles[0])]
      : [createDefaultAPIProfile()];
    setProfiles(loaded);
    setActiveProfileId(loaded[0]?.id || '');
    setSaveStatus('idle');
  }, []);

  const activeProfile = profiles.find(profile => profile.id === activeProfileId) || profiles[0] || null;

  const markDirty = () => setSaveStatus('dirty');

  const persist = () => {
    saveAPISettings({
      profiles: activeProfile
        ? [normalizeSingleAPIProfile(activeProfile)]
        : profiles.slice(0, 1).map(normalizeSingleAPIProfile),
    });
    setSaveStatus('saved');
  };

  const handleUpdate = (id: string, updates: Partial<APIConfig>) => {
    const trimmed: Partial<APIConfig> = { ...updates };
    if (trimmed.baseUrl !== undefined) trimmed.baseUrl = trimmed.baseUrl.trim().replace(/\s+/g, '');
    if (trimmed.apiKey !== undefined) trimmed.apiKey = trimmed.apiKey.trim().replace(/\s+/g, '');
    if (trimmed.textModel !== undefined) trimmed.textModel = trimmed.textModel.trim().replace(/\s+/g, '');
    if (trimmed.imageModel !== undefined) trimmed.imageModel = trimmed.imageModel.trim().replace(/\s+/g, '');
    setProfiles(prev => prev.map(api => api.id === id ? normalizeSingleAPIProfile({ ...api, ...trimmed }) : api));
    markDirty();
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

  const modelOptions = (kind: 'text' | 'image') => (
    (kind === 'text' ? TEXT_MODEL_PRESETS : IMAGE_MODEL_PRESETS).map(model => ({
      value: model,
      label: `${model} ${(kind === 'text' ? PINNED_TEXT_MODELS : PINNED_IMAGE_MODELS).includes(model) ? '*' : ''}`,
    }))
  );

  const renderEndpointPreview = (api: APIConfig) => {
    const normalized = normalizeOpenAIBaseUrl(api.baseUrl);
    const endpoints = [
      [isZh ? '文本' : 'Text', buildOpenAICompatibleUrl(api.baseUrl, 'chat/completions')],
      [isZh ? '图片' : 'Image', buildOpenAICompatibleUrl(api.baseUrl, 'images/generations')],
      [isZh ? '编辑' : 'Edits', buildOpenAICompatibleUrl(api.baseUrl, 'images/edits')],
    ];

    return (
      <Card variant="surface" className="mt-3">
        <Text size="1" weight="bold" color="gray">{isZh ? '配置说明与端点预览' : 'Configuration notes and endpoints'}</Text>
        <Text as="p" size="1" color="gray" mt="2">
          {isZh
            ? 'Base URL 只填写服务根地址，MuseUI 会自动拼接文本、图片、参考图编辑和模型列表端点。不要在这里填写 /chat/completions、/images/generations 或 /models。'
            : 'Enter only the service root. MuseUI appends text, image, image-edit, and model-list endpoints automatically. Do not include /chat/completions, /images/generations, or /models here.'}
        </Text>
        <Box mt="2" className="space-y-1">
          <Text as="p" size="1" color="gray">{isZh ? '标准化根地址' : 'Normalized root'}: <code className="break-all">{normalized}</code></Text>
          {endpoints.map(([label, value]) => (
            <Text key={label} as="p" size="1" color="gray">
              {label}: <code className="break-all">{value}</code>
            </Text>
          ))}
        </Box>
        <Flex gap="2" mt="3" wrap="wrap">
          <Button asChild size="1" variant="soft">
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">Key</a>
          </Button>
          <Button asChild size="1" variant="soft">
            <a href="https://platform.openai.com/docs/api-reference" target="_blank" rel="noopener noreferrer">{isZh ? '文档' : 'Docs'}</a>
          </Button>
        </Flex>
      </Card>
    );
  };

  const renderProfileEditor = (api: APIConfig) => {
    const isKeyVisible = visibleKeys.has(api.id);
    const testTextRunning = testingId === `${api.id}:text`;
    const testImageRunning = testingId === `${api.id}:image`;
    const isFetchingModels = fetchingModelsId === api.id;

    return (
      <Card className="min-w-0">
        <Flex direction="column" gap="4">
          <Card variant="surface">
            <Flex direction="column" gap="3">
              <Flex align="start" justify="between" gap="3">
                <Box>
                  <Text size="3" weight="bold">{isZh ? 'API 配置' : 'API configuration'}</Text>
                  <Text as="p" size="1" color="gray" mt="1">
                    {isZh
                      ? '当前项目使用单一 OpenAI-compatible 配置。文本思考和图片生成可以分别启用。'
                      : 'This project uses a single OpenAI-compatible configuration. Text and image requests can be enabled separately.'}
                  </Text>
                </Box>
                <Badge color="green">{isZh ? '已启用' : 'Enabled'}</Badge>
              </Flex>
              <Flex direction={{ initial: 'column', sm: 'row' }} gap="3">
                <Box className="flex-1">
                  <SwitchField
                    label={isZh ? '用于文本思考' : 'Use for text'}
                    checked={Boolean(api.textEnabled)}
                    onCheckedChange={checked => handleUpdate(api.id, { textEnabled: checked })}
                  />
                </Box>
                <Box className="flex-1">
                  <SwitchField
                    label={isZh ? '用于图片生成' : 'Use for images'}
                    checked={Boolean(api.imageEnabled)}
                    onCheckedChange={checked => handleUpdate(api.id, { imageEnabled: checked })}
                  />
                </Box>
              </Flex>
            </Flex>
          </Card>

          <TextFieldControl
            label={isZh ? 'Base URL（服务根地址）' : 'Base URL (service root)'}
            value={api.baseUrl}
            onValueChange={value => handleUpdate(api.id, { baseUrl: value })}
            placeholder="https://api.openai.com/v1"
          />
          {renderEndpointPreview(api)}

          <Box>
            <Flex align="end" gap="2">
              <Box className="min-w-0 flex-1">
                <TextFieldControl
                  label="API Key"
                  value={api.apiKey}
                  type={isKeyVisible ? 'text' : 'password'}
                  onValueChange={value => handleUpdate(api.id, { apiKey: value })}
                  placeholder="sk-..."
                />
              </Box>
              <IconButton
                iconName={isKeyVisible ? 'info' : 'search'}
                label={isKeyVisible ? (isZh ? '隐藏 Key' : 'Hide key') : (isZh ? '显示 Key' : 'Show key')}
                variant="soft"
                color="gray"
                onClick={() => {
                  setVisibleKeys(prev => {
                    const next = new Set(prev);
                    if (next.has(api.id)) next.delete(api.id);
                    else next.add(api.id);
                    return next;
                  });
                }}
              />
            </Flex>
          </Box>

          <Tabs.Root defaultValue="models">
            <Tabs.List>
              <Tabs.Trigger value="models">{isZh ? '模型' : 'Models'}</Tabs.Trigger>
              <Tabs.Trigger value="imageMode">{isZh ? '图片模式' : 'Image mode'}</Tabs.Trigger>
              <Tabs.Trigger value="test">{isZh ? '测试' : 'Test'}</Tabs.Trigger>
            </Tabs.List>

            <Box pt="4">
              <Tabs.Content value="models">
                <Flex direction="column" gap="3">
                  <Flex align="center" justify="between" gap="3">
                    <Box className="min-w-0">
                      <Text size="2" weight="bold">{isZh ? '模型列表' : 'Model list'}</Text>
                      <Text as="p" size="1" color="gray">
                        {fetchedModels[api.id] && !fetchErrors[api.id]
                          ? (isZh ? `已获取 ${fetchedModels[api.id].length} 个支持模型` : `${fetchedModels[api.id].length} supported models fetched`)
                          : (isZh ? '当前仅允许固定模型预设。' : 'Only pinned model presets are selectable.')}
                      </Text>
                      {fetchErrors[api.id] && <Text as="p" size="1" color="red" className="break-all">{fetchErrors[api.id]}</Text>}
                    </Box>
                    <Button
                      size="2"
                      variant="soft"
                      color="gray"
                      iconName={isFetchingModels ? 'loader' : 'refresh'}
                      disabled={isFetchingModels || !api.apiKey.trim()}
                      onClick={() => fetchModelsForApi(api, true)}
                    >
                      {isZh ? '刷新' : 'Refresh'}
                    </Button>
                  </Flex>
                  <Flex direction={{ initial: 'column', sm: 'row' }} gap="3">
                    <Box className="flex-1">
                      <SelectField
                        label={isZh ? '文本模型' : 'Text model'}
                        value={api.textModel || ''}
                        onValueChange={value => handleUpdate(api.id, { textModel: value })}
                        options={modelOptions('text')}
                        placeholder={isZh ? '选择文本模型' : 'Select text model'}
                      />
                    </Box>
                    <Box className="flex-1">
                      <SelectField
                        label={isZh ? '图片模型' : 'Image model'}
                        value={api.imageModel || ''}
                        onValueChange={value => handleUpdate(api.id, { imageModel: value })}
                        options={modelOptions('image')}
                        placeholder={isZh ? '选择图片模型' : 'Select image model'}
                      />
                    </Box>
                  </Flex>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="imageMode">
                <SelectField
                  label={isZh ? '图片请求模式' : 'Image request mode'}
                  value={api.imageMode || 'auto'}
                  onValueChange={value => handleUpdate(api.id, { imageMode: value as OpenAIImageMode })}
                  options={[
                    { value: 'auto', label: isZh ? '自动：先 images/generations，必要时回退 chat/completions' : 'Auto: images first, fallback to chat' },
                    { value: 'images', label: isZh ? 'Images API：/images/generations' : 'Images API: /images/generations' },
                    { value: 'chat', label: isZh ? 'Chat Completions：/chat/completions' : 'Chat Completions: /chat/completions' },
                  ]}
                />
              </Tabs.Content>

              <Tabs.Content value="test">
                <Flex direction="column" gap="3">
                  <Flex gap="2" wrap="wrap">
                    <Button
                      variant="soft"
                      color="cyan"
                      disabled={testTextRunning || !api.apiKey.trim() || !api.textEnabled}
                      onClick={() => handleTest('text', api)}
                    >
                      {testTextRunning ? (isZh ? '测试中...' : 'Testing...') : (isZh ? '测试文本' : 'Test text')}
                    </Button>
                    <Button
                      variant="soft"
                      color="ruby"
                      disabled={testImageRunning || !api.apiKey.trim() || !api.imageEnabled}
                      onClick={() => handleTest('image', api)}
                    >
                      {testImageRunning ? (isZh ? '测试中...' : 'Testing...') : (isZh ? '测试图片' : 'Test image')}
                    </Button>
                  </Flex>
                  {testResult?.id === api.id && (
                    <Card variant="surface">
                      <Text size="2" color={testResult.ok ? 'green' : 'red'} className="break-all">{testResult.msg}</Text>
                    </Card>
                  )}
                </Flex>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Flex>
      </Card>
    );
  };

  const footer = (
    <>
      <Text size="1" color="gray" className="mr-auto">
        {saveStatus === 'dirty'
          ? (isZh ? '有未保存更改' : 'Unsaved changes')
          : saveStatus === 'saved'
            ? (isZh ? '已保存到浏览器本地' : 'Saved locally')
            : (isZh ? 'API Key 仅保存在浏览器本地' : 'API keys are stored locally only')}
      </Text>
      <Button variant="soft" color="gray" onClick={onClose}>{isZh ? '关闭' : 'Close'}</Button>
      <Button onClick={handleSaveAll} color="ruby" iconName="save">{isZh ? '保存' : 'Save'}</Button>
    </>
  );

  return (
    <>
      <DialogShell
        open
        onOpenChange={(open) => { if (!open) onClose?.(); }}
        title={isZh ? 'API 设置' : 'API Settings'}
        description={isZh ? '配置单一 OpenAI-compatible API，用于文本思考和图片生成。' : 'Configure one OpenAI-compatible API for text reasoning and image generation.'}
        size="lg"
        footer={footer}
        closeLabel={isZh ? '关闭 API 设置' : 'Close API settings'}
      >
        <Box data-api-config-body className="mx-auto max-h-[calc(100dvh-180px)] min-h-0 max-w-3xl overflow-y-auto pr-1">
          {activeProfile ? renderProfileEditor(activeProfile) : (
            <Card>
              <Text color="gray">{isZh ? '暂无 API 配置' : 'No API configuration found'}</Text>
            </Card>
          )}
        </Box>
      </DialogShell>
    </>
  );
}
