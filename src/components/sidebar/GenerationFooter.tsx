import React from 'react';
import { getEnabledImageAPIs } from '../../services/apiKeyStore';
import type { CreatorRole, LangType } from '../../types';
import { Button, SelectField, Text } from '../ui';

interface Props {
  lang: LangType;
  activeRole: CreatorRole;
  promptLanguage: string | null;
  preferredImageApiId: string | null;
  setPromptLanguage: (language: string | null) => void;
  setPreferredImageApiId: (id: string | null) => void;
  modeSummary: string;
  outputSummary: string;
  onPrepareGeneration: () => void;
  isGenerating: boolean;
  batchProgress: string;
  progressValue: number;
  isBatchMode: boolean;
  isDesigner: boolean;
  isMedia: boolean;
  isFree: boolean;
  isSkill: boolean;
  processingLabel: string;
  error: string | null;
}

const skillLabels: Partial<Record<CreatorRole, { zh: string; en: string }>> = {
  'cover-image': { zh: '生成封面图', en: 'Generate Cover' },
  infographic: { zh: '生成信息图', en: 'Generate Infographic' },
  'xhs-images': { zh: '生成小红书配图', en: 'Generate XHS Images' },
  comic: { zh: '生成漫画', en: 'Generate Comic' },
  'article-illustrator': { zh: '生成文章插图', en: 'Generate Illustrations' },
  'slide-deck': { zh: '生成幻灯片', en: 'Generate Slides' },
  logo: { zh: '生成 Logo', en: 'Generate Logo' },
};

const getGenerateLabel = (props: Props) => {
  const skillLabel = skillLabels[props.activeRole];
  if (props.isSkill && skillLabel) return props.lang === 'zh' ? skillLabel.zh : skillLabel.en;
  if (props.isBatchMode) return props.lang === 'zh' ? '批量生成' : 'Batch Generate';
  if (props.isDesigner) return props.lang === 'zh' ? '生成 UI 设计' : 'Generate UI Design';
  if (props.isMedia) return props.lang === 'zh' ? '生成图片' : 'Generate Image';
  if (props.isFree) return props.lang === 'zh' ? '生成' : 'Generate';
  return props.lang === 'zh' ? '生成游戏资产' : 'Generate Game Asset';
};

const GenerationFooter: React.FC<Props> = (props) => {
  const enabledImageApis = getEnabledImageAPIs();
  const selectedImageApi = enabledImageApis.find(api => api.id === props.preferredImageApiId) || enabledImageApis[0];
  const imageApiLabel = selectedImageApi
    ? (selectedImageApi.name || selectedImageApi.imageModel || selectedImageApi.id)
    : (props.lang === 'zh' ? '未配置图片 API' : 'No image API');

  return (
  <div className="z-20 border-t border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4">
    <div className="mb-3 rounded-lg border border-[var(--gray-5)] bg-[var(--gray-2)] px-3 py-2">
      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-wide text-[var(--gray-10)]">
        <span>{props.lang === 'zh' ? '当前任务' : 'Current task'}</span>
        <span className="truncate">{imageApiLabel}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs font-bold text-[var(--gray-12)]">
        <span className="truncate">{props.modeSummary}</span>
        <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--gray-7)]" />
        <span className="truncate text-[var(--gray-10)]">{props.outputSummary}</span>
      </div>
    </div>

    <div className="flex gap-2 mb-3">
      <SelectField
        value={props.promptLanguage || '__any__'}
        onValueChange={value => props.setPromptLanguage(value === '__any__' ? null : value)}
        options={[
          { value: '__any__', label: props.lang === 'zh' ? '语言不限' : 'Any Language' },
          { value: 'zh', label: '中文' },
          { value: 'en', label: 'English' },
          { value: 'ja', label: '日本語' },
          { value: 'ko', label: '한국어' },
          { value: 'fr', label: 'Français' },
          { value: 'de', label: 'Deutsch' },
          { value: 'es', label: 'Español' },
        ]}
      />
      <SelectField
        value={props.preferredImageApiId || '__default__'}
        onValueChange={value => props.setPreferredImageApiId(value === '__default__' ? null : value)}
        options={[
          { value: '__default__', label: props.lang === 'zh' ? '默认模型' : 'Default Model' },
          ...enabledImageApis.map(api => ({ value: api.id, label: api.name || api.imageModel || api.id })),
        ]}
      />
    </div>

    <Button
      onClick={props.onPrepareGeneration}
      disabled={props.isGenerating}
      className="w-full"
      size="3"
      color="ruby"
      iconName={props.isGenerating ? 'refresh' : 'magic-wand'}
    >
      {props.isGenerating ? (props.batchProgress || props.processingLabel) : getGenerateLabel(props)}
    </Button>
    {props.isGenerating && (
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gray-4)]">
        <div className="h-full bg-[var(--accent-9)] transition-all duration-300" style={{ width: `${props.progressValue}%` }}></div>
      </div>
    )}
    {props.error && <Text as="p" size="1" color="red" mt="2" align="center">{props.error}</Text>}
  </div>
  );
};

export default GenerationFooter;
