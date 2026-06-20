
import React, { useRef, useState, useEffect } from 'react';
import PlatformSelector from './PlatformSelector';
import MediaSelector from './MediaSelector';
import PromptInput from './PromptInput';
import StyleSelector from './StyleSelector';
import DesignTokenSelector from './DesignTokenSelector';
import DesignMdSelector from './DesignMdSelector';
import BackgroundSelector from './BackgroundSelector';
import { I18N, UI_STYLES } from '../constants';
import { LangType, PlatformType, ResolutionPreset, UIStyle, DesignTokens, BackgroundConfig, PageRequest, LayoutElement, CreatorRole, MediaAspectRatio, MediaResolutionPreset, MediaType, SkillConfig, SkillType } from '../types';
import GenerationFooter from './sidebar/GenerationFooter';

// Skill Panels
import { CoverImagePanel } from './skills/CoverImagePanel';
import { InfographicPanel } from './skills/InfographicPanel';
import { XHSImagesPanel } from './skills/XHSImagesPanel';
import { ComicPanel } from './skills/ComicPanel';
import { ArticleIllustratorPanel } from './skills/ArticleIllustratorPanel';
import { SlideDeckPanel } from './skills/SlideDeckPanel';
import { LogoPanel } from './skills/LogoPanel';
import { StickerDesignPanel } from './skills/StickerDesignPanel';
import { ROLES, RoleIcon } from './RoleSelectorModal';

const SKILL_TYPES: SkillType[] = ['cover-image', 'infographic', 'xhs-images', 'comic', 'article-illustrator', 'slide-deck', 'logo', 'sticker-design'];
const isSkillRole = (role: CreatorRole) => SKILL_TYPES.includes(role as SkillType);

interface Props {
    // Role
    activeRole: CreatorRole;
    setActiveRole: (r: CreatorRole) => void;

    // Skill Mode
    skillMode: boolean;
    skillConfig: SkillConfig | null;
    onSkillConfigChange: (config: SkillConfig | null) => void;

    // Config
    lang: LangType;
    platform: PlatformType;
    resolution: ResolutionPreset;
    customSize: { width: number; height: number; active: boolean };
    description: string;
    pageName: string;
    keywords: string[];
    style: UIStyle;
    customStyles: UIStyle[];
    enableDesignTokens: boolean;
    designTokens: DesignTokens;
    background: BackgroundConfig;
    highQuality: boolean;
    forceChinese: boolean;
    promptLanguage: string | null;
    preferredImageApiId: string | null;

    // Design.md
    designMdId: string | null;
    setDesignMdId: (id: string | null) => void;
    setDesignMdContent: (content: string | null) => void;

    // Visual Style
    visualStyleId: string | null;
    setVisualStyleId: (id: string | null) => void;
    setVisualStyleContent: (content: string | null) => void;

    // Layout Density
    layoutDensityId: string | null;
    setLayoutDensityId: (id: string | null) => void;
    setLayoutDensityContent: (content: string | null) => void;

    // Batch Config
    isBatchMode: boolean;
    batchOutputMode: 'separate' | 'grid';
    specMode: 'image' | 'code';
    pages: PageRequest[];
    isAutoGeneratingPages: boolean;

    // Media Mode
    mediaAspectRatio: MediaAspectRatio;
    mediaResolution: MediaResolutionPreset;
    mediaType: MediaType;

    // Assets
    colorImage: File | null;
    referenceImages: string[];
    copiedImageBase64: string | null;
    layoutImage: string | null;

    // Setters
    setPlatform: (p: PlatformType) => void;
    setResolution: (r: ResolutionPreset) => void;
    setCustomSize: (s: any) => void;
    setDescription: (s: string) => void;
    setPageName: (s: string) => void;
    setKeywords: (k: string[]) => void;
    setStyle: (s: UIStyle) => void;
    setCustomStyles: (s: UIStyle[] | ((prev: UIStyle[]) => UIStyle[])) => void;
    setEnableDesignTokens: (b: boolean) => void;
    setDesignTokens: (t: DesignTokens) => void;
    setBackground: (b: BackgroundConfig) => void;
    setHighQuality: (b: boolean) => void;
    setForceChinese: (b: boolean) => void;
    setPromptLanguage: (l: string | null) => void;
    setPreferredImageApiId: (id: string | null) => void;

    setIsBatchMode: (b: boolean) => void;
    setBatchOutputMode: (m: 'separate' | 'grid') => void;
    setSpecMode: (m: 'image' | 'code') => void;
    setPages: (p: PageRequest[]) => void;

    setMediaAspectRatio: (r: MediaAspectRatio) => void;
    setMediaResolution: (r: MediaResolutionPreset) => void;
    setMediaType: (t: MediaType) => void;

    setColorImage: (f: File | null) => void;
    setReferenceImages: (imgs: string[]) => void;
    setCopiedImageBase64: (s: string | null) => void;
    setLayoutImage: (s: string | null) => void;
    setLayoutElements: (e: LayoutElement[]) => void;

    // Actions
    onAutoGeneratePages: () => void;
    onOpenPageBuilder: (pid: string | null) => void;
    onExtractStyle: (f: File[]) => void;
    isExtractingStyle: boolean;
    onPrepareGeneration: () => void;
    isGenerating: boolean;
    batchProgress: string;
    progressValue: number;
    error: string | null;
    onAddNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
    onOpenProjectManager: () => void;

    onAnalyzeLayout?: () => void;
    isAnalyzingLayout?: boolean;
    layoutAnalysis?: string | null;

    onAiGenerateDescription?: () => void;
    isAiGeneratingDescription?: boolean;
}

import IconLoader from './IconLoader';

const AppSidebar: React.FC<Props> = (props) => {
    const t = I18N[props.lang];
    const layoutInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const refImageInputRef = useRef<HTMLInputElement>(null);

    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
                setIsRoleDropdownOpen(false);
            }
        };
        if (isRoleDropdownOpen) {
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [isRoleDropdownOpen]);

    const activeRoleDef = ROLES.find(r => r.id === props.activeRole);

    const handleLayoutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                // Logic to reset analysis if new image is uploaded is handled in parent hook
                props.setLayoutImage(ev.target?.result as string);
                props.setLayoutElements([]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
        if (e.target.files?.[0]) setter(e.target.files[0]);
    };

    const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || props.referenceImages.length >= 2) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            const updated = [...props.referenceImages, base64];
            props.setReferenceImages(updated);
            autoSwitchToReferenceStyle();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handlePasteRefImage = () => {
        if (!props.copiedImageBase64 || props.referenceImages.length >= 2) return;
        const updated = [...props.referenceImages, props.copiedImageBase64];
        props.setReferenceImages(updated);
        props.setCopiedImageBase64(null);
        autoSwitchToReferenceStyle();
    };

    const removeRefImage = (idx: number) => {
        props.setReferenceImages(props.referenceImages.filter((_, i) => i !== idx));
    };

    const autoSwitchToReferenceStyle = () => {
        if (props.style.id !== 'reference-based') {
            const refStyle = UI_STYLES.find((s: any) => s.id === 'reference-based');
            if (refStyle) props.setStyle(refStyle);
        }
    };

    // Helper for single image slot
    const ImageSlot = ({ label, file, onRemove, onClick, placeholderIcon = "plus", customContent }: any) => (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase">{label}</span>
            <div className="relative group w-full h-24 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg overflow-hidden bg-stone-50 dark:bg-stone-900 hover:border-teal-500 transition-colors">
                {customContent ? customContent : (
                    file ? (
                        <>
                            <img
                                src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                                className="w-full h-full object-cover opacity-80"
                                onClick={onClick}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                className="absolute top-1 right-1 bg-white text-stone-800 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-stone-100"
                            >
                                <IconLoader name="close" size={12} />
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1 cursor-pointer hover:text-teal-500 transition-colors" onClick={onClick}>
                            <IconLoader name={placeholderIcon} size={24} />
                            <span className="text-[9px]">{props.lang === 'zh' ? '上传' : 'Upload'}</span>
                        </div>
                    )
                )}
            </div>
        </div>
    );

    const isDesigner = props.activeRole === 'designer';
    const isMedia = props.activeRole === 'media';
    const isGame = props.activeRole === 'game';
    const isSkill = isSkillRole(props.activeRole);
    const isFree = props.activeRole === 'free';

    return (
        <div className="w-full md:w-[360px] bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shrink-0 min-w-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {/* Role Switcher Dropdown */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1" ref={roleDropdownRef}>
                        <button
                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                {activeRoleDef && (
                                    <RoleIcon roleId={activeRoleDef.id} className="w-4 h-4" />
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide leading-tight">
                                    {props.lang === 'zh' ? '当前模式' : 'Current Mode'}
                                </div>
                                <div className="text-sm font-semibold text-stone-800 dark:text-stone-100 leading-tight">
                                    {props.lang === 'zh' ? activeRoleDef?.label_zh : activeRoleDef?.label}
                                </div>
                            </div>
                            <IconLoader name="chevron-down" size={14} className={`text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isRoleDropdownOpen && (
                            <div className="absolute z-30 left-0 right-0 mt-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {ROLES.map(role => {
                                    const isActive = role.id === props.activeRole;
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => { props.setActiveRole(role.id); setIsRoleDropdownOpen(false); }}
                                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${
                                                isActive
                                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                                                    : 'border-transparent bg-stone-50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 hover:border-stone-200 dark:hover:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                                            }`}
                                        >
                                            <RoleIcon roleId={role.id} className="w-6 h-6" />
                                            <span className={`text-[10px] font-bold leading-tight ${isActive ? 'text-teal-700 dark:text-teal-300' : 'text-stone-700 dark:text-stone-200'}`}>
                                                {props.lang === 'zh' ? role.label_zh : role.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    </div>
                    <button
                        onClick={props.onOpenProjectManager}
                        className="p-2 text-stone-400 hover:text-teal-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors shrink-0"
                        title={props.lang === 'zh' ? '项目管理' : 'Project Manager'}
                    >
                        <IconLoader name="grid" size={18} />
                    </button>
                </div>

                {isDesigner && (
                    <PlatformSelector
                        selectedPlatform={props.platform}
                        selectedResolution={props.resolution}
                        onSelectPlatform={props.setPlatform}
                        onSelectResolution={props.setResolution}
                        customSize={props.customSize}
                        onCustomSizeChange={props.setCustomSize}
                        lang={props.lang}
                    />
                )}

                {isMedia && (
                    <MediaSelector
                        aspectRatio={props.mediaAspectRatio}
                        resolution={props.mediaResolution}
                        mediaType={props.mediaType}
                        onAspectRatioChange={props.setMediaAspectRatio}
                        onResolutionChange={props.setMediaResolution}
                        onMediaTypeChange={props.setMediaType}
                        customSize={props.customSize}
                        onCustomSizeChange={props.setCustomSize}
                        lang={props.lang}
                    />
                )}

                {/* Skill Panels */}
                {isSkill && props.skillConfig && (
                    <>
                        {props.activeRole === 'cover-image' && props.skillConfig.coverImage && (
                            <CoverImagePanel
                                config={props.skillConfig.coverImage}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, coverImage: cfg })}
                                lang={props.lang}
                            />
                        )}
                        {props.activeRole === 'infographic' && props.skillConfig.infographic && (
                            <InfographicPanel
                                config={props.skillConfig.infographic}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, infographic: cfg })}
                                lang={props.lang}
                            />
                        )}
                        {props.activeRole === 'xhs-images' && props.skillConfig.xhsImages && (
                            <XHSImagesPanel
                                config={props.skillConfig.xhsImages}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, xhsImages: cfg })}
                                lang={props.lang}
                            />
                        )}
                        {props.activeRole === 'comic' && props.skillConfig.comic && (
                            <ComicPanel
                                config={props.skillConfig.comic}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, comic: cfg })}
                                lang={props.lang}
                            />
                        )}
                        {props.activeRole === 'article-illustrator' && props.skillConfig.articleIllustrator && (
                            <ArticleIllustratorPanel
                                config={props.skillConfig.articleIllustrator}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, articleIllustrator: cfg })}
                                lang={props.lang}
                            />
                        )}
                        {props.activeRole === 'slide-deck' && props.skillConfig.slideDeck && (
                            <SlideDeckPanel
                                config={props.skillConfig.slideDeck}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, slideDeck: cfg })}
                                lang={props.lang}
                            />
                        )}
                        {props.activeRole === 'logo' && props.skillConfig.logo && (
                            <LogoPanel
                                config={props.skillConfig.logo}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, logo: cfg })}
                                lang={props.lang}
                            />
                        )}
                        {props.activeRole === 'sticker-design' && props.skillConfig.stickerDesign && (
                            <StickerDesignPanel
                                config={props.skillConfig.stickerDesign}
                                onChange={(cfg) => props.onSkillConfigChange?.({ ...props.skillConfig!, stickerDesign: cfg })}
                                lang={props.lang}
                            />
                        )}
                    </>
                )}

                <div className="h-px bg-stone-100 dark:bg-stone-800"></div>

                <PromptInput
                    description={props.description}
                    onDescriptionChange={props.setDescription}
                    pageName={props.pageName}
                    onPageNameChange={props.setPageName}
                    keywords={props.keywords}
                    onKeywordsChange={props.setKeywords}
                    pages={props.pages}
                    onPagesChange={props.setPages}
                    isBatchMode={props.isBatchMode}
                    onBatchModeChange={props.setIsBatchMode}
                    onAutoGeneratePages={props.onAutoGeneratePages}
                    isAutoGenerating={props.isAutoGeneratingPages}
                    lang={props.lang}
                    onOpenPageBuilder={props.onOpenPageBuilder}
                    onAddNotification={props.onAddNotification}
                    onAiGenerateDescription={props.onAiGenerateDescription}
                    isAiGeneratingDescription={props.isAiGeneratingDescription}
                />

                <div className="h-px bg-stone-100 dark:bg-stone-800"></div>

                {!isSkill && !isFree && (
                    <StyleSelector
                        selectedStyle={props.style}
                        onSelectStyle={props.setStyle}
                        customStyles={props.customStyles}
                        onAddCustomStyle={(s) => props.setCustomStyles(prev => [...prev, s])}
                        lang={props.lang}
                    />
                )}

                {(isDesigner || isMedia) && (!isSkill) && (
                    <>
                        {/* Design.md Template Selector */}
                        {isDesigner && (
                            <DesignMdSelector
                                selectedId={props.designMdId}
                                onSelect={(id, content) => {
                                    props.setDesignMdId(id);
                                    props.setDesignMdContent(content);
                                }}
                                lang={props.lang}
                            />
                        )}

                        {/* Visual Style Template Selector */}
                        <DesignMdSelector
                            variant="visual"
                            selectedId={props.visualStyleId}
                            onSelect={(id, content) => {
                                props.setVisualStyleId(id);
                                props.setVisualStyleContent(content);
                            }}
                            lang={props.lang}
                        />

                        {/* Layout Density Selector */}
                        {isDesigner && (
                            <DesignMdSelector
                                variant="layout"
                                selectedId={props.layoutDensityId}
                                onSelect={(id, content) => {
                                    props.setLayoutDensityId(id);
                                    props.setLayoutDensityContent(content);
                                }}
                                lang={props.lang}
                            />
                        )}
                    </>
                )}

                {!isFree && (
                <>
                {/* 2 Slot Reference Section */}
                <div>
                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
                        {props.lang === 'zh' ? '参考图设定' : 'Reference Inputs'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Slot 1: Color */}
                        <ImageSlot
                            label={props.lang === 'zh' ? '1. 颜色' : '1. Color'}
                            file={props.colorImage}
                            onRemove={() => props.setColorImage(null)}
                            onClick={() => colorInputRef.current?.click()}
                            placeholderIcon="palette"
                        />
                        <input type="file" ref={colorInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, props.setColorImage)} />

                        {/* Slot 2: Layout */}
                        <ImageSlot
                            label={props.lang === 'zh' ? '2. 布局' : '2. Layout'}
                            file={null}
                            customContent={
                                props.layoutImage ? (
                                    <>
                                        <img src={props.layoutImage} className="w-full h-full object-contain p-1" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <button
                                                onClick={() => props.onOpenPageBuilder(null)}
                                                className="text-white text-[10px] bg-stone-700 px-2 py-1 rounded hover:bg-stone-600 w-16"
                                            >
                                                {props.lang === 'zh' ? '构建器' : 'Builder'}
                                            </button>
                                            <button
                                                onClick={() => layoutInputRef.current?.click()}
                                                className="text-white text-[10px] bg-stone-700 px-2 py-1 rounded hover:bg-stone-600 w-16"
                                            >
                                                {props.lang === 'zh' ? '换图' : 'Replace'}
                                            </button>
                                            <button
                                                onClick={() => { props.setLayoutImage(null); props.setLayoutElements([]); }}
                                                className="text-red-300 text-[10px] hover:text-red-200 mt-1"
                                            >
                                                {props.lang === 'zh' ? '移除' : 'Remove'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-1 gap-1">
                                        <button
                                            onClick={() => props.onOpenPageBuilder(null)}
                                            className="w-full flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[9px] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center justify-center gap-1"
                                        >
                                            <IconLoader name="layout" size={12} /> {props.lang === 'zh' ? '构建器' : 'Builder'}
                                        </button>
                                        <button
                                            onClick={() => layoutInputRef.current?.click()}
                                            className="w-full flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-[9px] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center justify-center gap-1"
                                        >
                                            <IconLoader name="upload" size={12} /> {props.lang === 'zh' ? '上传图' : 'Upload'}
                                        </button>
                                    </div>
                                )
                            }
                        />
                        <input type="file" ref={layoutInputRef} hidden accept="image/*" onChange={handleLayoutUpload} />
                    </div>

                    {/* Analyze Layout Button */}
                    {props.layoutImage && (
                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={props.onAnalyzeLayout}
                                disabled={props.isAnalyzingLayout}
                                className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-colors ${props.layoutAnalysis
                                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                                    : 'bg-teal-50 text-teal-500 hover:text-teal-600 dark:bg-teal-900/20'
                                    }`}
                            >
                                {props.isAnalyzingLayout ? (
                                    <IconLoader name="refresh" className="animate-spin" size={10} />
                                ) : props.layoutAnalysis ? (
                                    <>
                                        <IconLoader name="check" size={10} />
                                        <span>{props.lang === 'zh' ? '已分析 (点击重试)' : 'Analyzed (Click to redo)'}</span>
                                    </>
                                ) : (
                                    <>
                                        <IconLoader name="search" size={10} />
                                        <span>{props.lang === 'zh' ? 'AI 分析布局结构' : 'AI Analyze Structure'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
                </>)}

                {!isFree && (
                <>
                {/* Reference Images Section */}
                <div>
                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-3">
                        {props.lang === 'zh' ? '参考图 (最多 2 张)' : 'Reference Images (max 2)'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[0, 1].map(idx => (
                            <div key={idx} className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-stone-500 uppercase">
                                    {props.lang === 'zh' ? `参考 ${idx + 1}` : `Ref ${idx + 1}`}
                                </span>
                                <div className="relative group w-full h-24 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg overflow-hidden bg-stone-50 dark:bg-stone-900 hover:border-teal-500 transition-colors">
                                    {props.referenceImages[idx] ? (
                                        <>
                                            <img src={props.referenceImages[idx]} className="w-full h-full object-cover opacity-80" />
                                            <button
                                                onClick={() => removeRefImage(idx)}
                                                className="absolute top-1 right-1 bg-white text-stone-800 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-stone-100"
                                            >
                                                <IconLoader name="close" size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer" onClick={() => props.referenceImages.length <= idx && refImageInputRef.current?.click()}>
                                            <IconLoader name="upload" size={16} className="text-stone-400" />
                                            <span className="text-[9px] text-stone-400">{props.lang === 'zh' ? '上传' : 'Upload'}</span>
                                            {props.copiedImageBase64 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePasteRefImage(); }}
                                                    className="text-[9px] bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded hover:bg-teal-200 dark:hover:bg-teal-900/50 font-bold"
                                                >
                                                    {props.lang === 'zh' ? '粘贴' : 'Paste'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <input type="file" ref={refImageInputRef} hidden accept="image/*" onChange={handleRefImageUpload} />
                </div>
                </>)}

                {!isFree && <div className="h-px bg-stone-100 dark:bg-stone-800"></div>}

                {isDesigner && (
                    <DesignTokenSelector
                        tokens={props.designTokens}
                        onChange={props.setDesignTokens}
                        enabled={props.enableDesignTokens}
                        onToggle={props.setEnableDesignTokens}
                        lang={props.lang}
                    />
                )}

                {/* <BackgroundSelector
                    background={props.background}
                    onChange={props.setBackground}
                    lang={props.lang}
                />

                <div className="h-20"></div> */}
            </div>

            <GenerationFooter
                lang={props.lang}
                activeRole={props.activeRole}
                promptLanguage={props.promptLanguage}
                preferredImageApiId={props.preferredImageApiId}
                setPromptLanguage={props.setPromptLanguage}
                setPreferredImageApiId={props.setPreferredImageApiId}
                onPrepareGeneration={props.onPrepareGeneration}
                isGenerating={props.isGenerating}
                batchProgress={props.batchProgress}
                progressValue={props.progressValue}
                isBatchMode={props.isBatchMode}
                isDesigner={isDesigner}
                isMedia={isMedia}
                isFree={isFree}
                isSkill={isSkill}
                processingLabel={t.processing}
                error={props.error}
            />
        </div>
    );
};

export default AppSidebar;
