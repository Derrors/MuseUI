import React from 'react';
import { getEnabledImageAPIs } from '../../services/apiKeyStore';
import type { CreatorRole, LangType } from '../../types';
import IconLoader from '../IconLoader';

interface Props {
  lang: LangType;
  activeRole: CreatorRole;
  promptLanguage: string | null;
  preferredImageApiId: string | null;
  setPromptLanguage: (language: string | null) => void;
  setPreferredImageApiId: (id: string | null) => void;
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

const GenerationFooter: React.FC<Props> = (props) => (
  <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 z-20">
    <div className="flex gap-2 mb-3">
      <select
        value={props.promptLanguage || ''}
        onChange={e => props.setPromptLanguage(e.target.value || null)}
        className="flex-1 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-stone-600 dark:text-stone-300"
      >
        <option value="">{props.lang === 'zh' ? '语言不限' : 'Any Language'}</option>
        <option value="zh">中文</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
        <option value="ko">한국어</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="es">Español</option>
      </select>
      <select
        value={props.preferredImageApiId || ''}
        onChange={e => props.setPreferredImageApiId(e.target.value || null)}
        className="flex-1 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-stone-600 dark:text-stone-300"
      >
        <option value="">{props.lang === 'zh' ? '默认模型' : 'Default Model'}</option>
        {getEnabledImageAPIs().map(api => (
          <option key={api.id} value={api.id}>{api.name || api.imageModel || api.id}</option>
        ))}
      </select>
    </div>

    <button
      onClick={props.onPrepareGeneration}
      disabled={props.isGenerating}
      className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${props.isGenerating
        ? 'bg-stone-400 cursor-not-allowed'
        : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-500/20 active:scale-95'
        }`}
    >
      {props.isGenerating ? (
        <>
          <IconLoader name="refresh" className="animate-spin" size={16} />
          {props.batchProgress || props.processingLabel}
        </>
      ) : (
        <>
          <IconLoader name="magic-wand" size={16} />
          {getGenerateLabel(props)}
        </>
      )}
    </button>
    {props.isGenerating && (
      <div className="mt-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
        <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${props.progressValue}%` }}></div>
      </div>
    )}
    {props.error && <p className="text-xs text-red-500 mt-2 text-center">{props.error}</p>}
  </div>
);

export default GenerationFooter;
