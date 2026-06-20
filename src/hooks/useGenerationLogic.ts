import { useState } from 'react';
import { GeneratedImage, GenerationConfig, LayoutElement, DesignSystem } from '../types';
import { extractStyleFromImages, generatePageList, constructPrompt, generateDesignSpecJson, generateUIReference, analyzeLayoutImage, optimizeDescription } from '../services/aiGenerationService';
import { DEFAULT_IMAGE_MODEL, getEnabledImageAPIs } from '../services/apiKeyStore';
import { LangType } from '../types';
import type { SkillConstants } from '../skills/promptBuilders';

const getAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    if (ratio >= 1.7) return '16:9';
    if (ratio >= 1.3) return '4:3';
    if (ratio >= 0.9) return '1:1';
    if (ratio >= 0.7) return '3:4';
    return '9:16';
};

// Interfaces for dependencies to ensure type safety
interface ConfigState {
    platform: any; resolution: any; customSize: any; style: any; description: string; pageName: string; keywords: any;
    enableDesignTokens: boolean; designTokens: any; background: any; highQuality: boolean; forceChinese: boolean;
    promptLanguage: string | null; preferredImageApiId: string | null;
    batchOutputMode: any; specMode: any; pages: any[]; colorImage: File | null; referenceImages: string[]; isBatchMode: boolean;
    designMdContent: string | null;
    visualStyleContent: string | null;
    layoutDensityContent: string | null;
    activeRole?: string;
    mediaAspectRatio?: string;
    mediaResolution?: { id: string; name: string; width: number; height: number; ratio: string };
    mediaType?: string;
    skillMode?: boolean;
    activeSkill?: string | null;
    skillConfig?: any;
    setDescription: (s: string) => void;
    setPages: (p: any[]) => void;
    setCustomStyles: (cb: (prev: any[]) => any[]) => void;
    setStyle: (s: any) => void;
    setIsAutoGeneratingPages: (b: boolean) => void;
}

interface CanvasState {
    layoutImage: string | null;
    layoutElements: LayoutElement[];
    layoutAnalysis: string | null;
    setLayoutAnalysis: (s: string | null) => void;
    setArtboards: (cb: (prev: any[]) => any[]) => void;
    setArtboardGroups: (cb: (prev: any[]) => any[]) => void;
    handleSaveToHistory: (img: GeneratedImage) => Promise<void>;
    getImageDimensions: (b: string) => Promise<{ width: number, height: number }>;
    artboardGroups: any[];
    artboards: any[]; // Added for regen finding
}

export const useGenerationLogic = (
    lang: LangType,
    config: ConfigState,
    canvas: CanvasState
) => {
    // State
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [batchProgress, setBatchProgress] = useState<string>('');
    const [progressValue, setProgressValue] = useState<number>(0);

    const [isExtractingStyle, setIsExtractingStyle] = useState(false);
    const [isAnalyzingLayout, setIsAnalyzingLayout] = useState(false);
    const [isAiGeneratingDescription, setIsAiGeneratingDescription] = useState(false);

    // Modals & Flows
    const [specReviewImage, setSpecReviewImage] = useState<GeneratedImage | null>(null);
    const [specFeedback, setSpecFeedback] = useState('');
    const [batchConfirmation, setBatchConfirmation] = useState<{ resolve: (p: string | null) => void, prompt: string, pageName: string, index: number, total: number } | null>(null);
    const [reviewData, setReviewData] = useState<{
        prompt: string;
        config: GenerationConfig;
        pendingAction: () => void;
        images: { label: string, url: string }[];
        layoutAnalysis?: string | null;
        apiRequestInfo?: {
            targetAPI: {
                provider: string;
                baseUrl: string;
                model: string;
                name: string;
            };
            requestParams: {
                prompt: string;
                aspectRatio: string;
                preferredApiId?: string | null;
                images: {
                    hasColorImage: boolean;
                    hasStyleImage: boolean;
                    hasLayoutImage: boolean;
                    hasEditImage: boolean;
                    hasMaskImage: boolean;
                    contentImageCount: number;
                };
            };
        };
    } | null>(null);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [inspectImage, setInspectImage] = useState<GeneratedImage | null>(null);

    const [regenState, setRegenState] = useState<{
        isOpen: boolean; artboardId: string | null; targetImage: string | null; mode: 'refine' | 'new';
        prompt: string; referenceImage: string | null; layoutImage: string | null; layoutElements: LayoutElement[]; maskImage: string | null;
    }>({
        isOpen: false, artboardId: null, targetImage: null, mode: 'refine', prompt: '', referenceImage: null, layoutImage: null, layoutElements: [], maskImage: null
    });

    const isMediaMode = config.activeRole === 'media';
    const effectiveResolution = isMediaMode && config.mediaResolution
        ? { id: config.mediaResolution.id, name: config.mediaResolution.name, width: config.mediaResolution.width, height: config.mediaResolution.height, type: config.platform as any }
        : config.resolution;
    const mediaFields = { activeRole: config.activeRole as any, mediaAspectRatio: config.mediaAspectRatio as any, mediaType: config.mediaType as any };

    // Actions
    const handleExtractStyle = async (files: File[]) => {
        setIsExtractingStyle(true); setError(null);
        try {
            const s = await extractStyleFromImages(files);
            config.setCustomStyles((prev: any[]) => [...prev, s]);
            config.setStyle(s);
        } catch (err: any) { setError(err.message || 'Extraction failed'); }
        finally { setIsExtractingStyle(false); }
    };

    const handleAnalyzeLayout = async () => {
        if (!canvas.layoutImage) return;
        if (canvas.layoutAnalysis) return;

        setIsAnalyzingLayout(true); setError(null);
        try {
            const result = await analyzeLayoutImage(canvas.layoutImage, config.description);
            config.setDescription(result);
            canvas.setLayoutAnalysis(result);
        } catch (err: any) {
            setError(err.message || 'Layout analysis failed');
        } finally {
            setIsAnalyzingLayout(false);
        }
    };

    const handleAutoGeneratePages = async () => {
        if (!config.description.trim()) { setError(lang === 'zh' ? '请填写描述' : 'Enter description'); return; }
        config.setIsAutoGeneratingPages(true); setError(null);
        try {
            const list = await generatePageList(config.description, config.platform, lang);
            config.setPages(list);
        } catch (err: any) { setError(err.message); }
        finally { config.setIsAutoGeneratingPages(false); }
    };

    const handleAiGenerateDescription = async () => {
        if (!config.description.trim()) return;
        setIsAiGeneratingDescription(true); setError(null);
        try {
            const desc = await optimizeDescription(config.description, config.platform, lang, {
                activeRole: config.activeRole,
                skillMode: config.skillMode,
                skillType: config.activeSkill || undefined,
            });
            if (desc) config.setDescription(desc);
        } catch (err: any) { setError(err.message); }
        finally { setIsAiGeneratingDescription(false); }
    };

    const handleConfirmGeneration = async (overridePrompt?: string, ignoreLayoutImage: boolean = false, projectId?: string | null) => {
        setIsGenerating(true); setProgressValue(20); setError(null); setReviewData(null);

        const layoutImageToUse = ignoreLayoutImage ? null : canvas.layoutImage;
        const genConfig: GenerationConfig = {
            platform: config.platform, resolution: effectiveResolution, customSize: config.customSize,
            style: config.style, description: config.description, pageName: config.pageName || 'Screen',
            keywords: config.keywords, highQuality: config.highQuality, enableDesignTokens: config.enableDesignTokens,
            designTokens: config.designTokens, background: config.background, forceChinese: config.forceChinese,
            promptLanguage: config.promptLanguage, preferredImageApiId: config.preferredImageApiId,
            batchOutputMode: config.batchOutputMode, specMode: config.specMode,
            designMd: config.designMdContent || undefined,
            visualStyle: config.visualStyleContent || undefined,
            layoutDensity: config.layoutDensityContent || undefined,
            ...mediaFields
        };

        const batchId = `single-${Date.now()}`;
        const promptToUse = overridePrompt || constructPrompt(genConfig, false, !!layoutImageToUse);

        try {
            const asset = await generateUIReference({
                prompt: promptToUse,
                config: genConfig,
                colorImage: config.colorImage || undefined,
                styleImageBase64: config.referenceImages[0] || undefined,
                layoutImageBase64: layoutImageToUse,
                preferredImageApiId: config.preferredImageApiId,
            });

            const dims = await canvas.getImageDimensions(asset.base64);
            const newImage: GeneratedImage = {
                id: asset.id, url: asset.url, prompt: asset.prompt, timestamp: asset.timestamp,
                details: {
                    platform: config.platform, resolution: `${dims.width}x${dims.height}`, style: config.style.name,
                    tokens: config.designTokens, fullPrompt: asset.prompt, batchId: batchId, originalDescription: config.description,
                    projectId: projectId || undefined
                }
            };

            await canvas.handleSaveToHistory(newImage);

            canvas.setArtboards(prev => {
                const x = 50 + (prev.length * 50);
                const y = 50 + (prev.length * 50);
                return [...prev, { id: newImage.id, x, y, width: dims.width, height: dims.height, image: newImage, history: [newImage], label: config.pageName || 'UI', groupId: undefined, isNew: true }];
            });

            setProgressValue(100);
        } catch (err: any) {
            if (err?.message === "QUOTA_EXCEEDED") setError(lang === 'zh' ? '配额已耗尽' : 'Quota Exceeded');
            else setError(err.message);
        } finally { setIsGenerating(false); setTimeout(() => setProgressValue(0), 500); }
    };

    const startBatchGenerationFlow = async (feedback: string | null) => {
        setIsGenerating(true); setError(null);
        setBatchProgress(lang === 'zh' ? '正在生成设计规范...' : 'Generating Design Spec...');

        try {
            const genConfig: GenerationConfig = {
                platform: config.platform, resolution: effectiveResolution, customSize: config.customSize,
                style: config.style, description: config.description, pageName: 'Design System',
                keywords: config.keywords, highQuality: config.highQuality, enableDesignTokens: config.enableDesignTokens,
                designTokens: config.designTokens, background: config.background, forceChinese: config.forceChinese,
                promptLanguage: config.promptLanguage, preferredImageApiId: config.preferredImageApiId,
                batchOutputMode: config.batchOutputMode, specMode: config.specMode,
                    designMd: config.designMdContent || undefined,
                visualStyle: config.visualStyleContent || undefined,
                ...mediaFields
            };

            if (config.specMode === 'code') {
                const designSystem = await generateDesignSpecJson(genConfig, feedback || undefined);
                const resultImage: GeneratedImage = {
                    id: `spec-json-${Date.now()}`, url: '', prompt: "Design System (JSON)", timestamp: Date.now(),
                    details: { ...genConfig as any, isDesignSpec: true, designSystem, batchId: `batch-pending-${Date.now()}` }
                };
                setSpecReviewImage(resultImage);
            } else {
                let prompt = `**DESIGN SYSTEM SPECIFICATION TASK**\nApp Name: ${config.pageName || 'App'}\nDescription: ${config.description}\n\n`;
                if (feedback) prompt += `\n**REFINEMENT INSTRUCTIONS**: ${feedback}\n`;
                prompt += "\nCreate a comprehensive visual Design System.";

                const asset = await generateUIReference({
                    prompt: constructPrompt({ ...genConfig, pageName: 'Design System', description: prompt }, false, false),
                    config: genConfig, colorImage: config.colorImage || undefined, styleImageBase64: config.referenceImages[0] || undefined,
                    preferredImageApiId: config.preferredImageApiId,
                });
                const dims = await canvas.getImageDimensions(asset.base64);
                const resultImage: GeneratedImage = {
                    id: asset.id, url: asset.url, prompt: "Design System Specification", timestamp: asset.timestamp,
                    details: { ...genConfig as any, resolution: `${dims.width}x${dims.height}`, isDesignSpec: true, batchId: `batch-pending-${Date.now()}` }
                };
                setSpecReviewImage(resultImage);
            }
        } catch (e: any) { setError(e.message); }
        finally { setIsGenerating(false); setBatchProgress(''); }
    };

    const continueBatchGeneration = async (currentProjectId: string | null) => {
        if (config.pages.length === 0) return;
        const currentSpec = specReviewImage;
        setSpecReviewImage(null); setSpecFeedback('');
        setIsGenerating(true); setError(null); setProgressValue(0);

        const total = config.pages.length;
        let completed = 0;
        const batchId = `batch-${Date.now()}`;
        const groupX = 50 + (canvas.artboardGroups.length * 100);
        const groupY = 50 + (canvas.artboardGroups.length * 100);
        let localX = groupX;

        // Add Spec to Canvas if exists
        if (currentSpec && currentSpec.details) {
            const specImgWithBatch: GeneratedImage = { ...currentSpec, id: `${batchId}-spec`, details: { ...currentSpec.details, batchId } };
            if (!specImgWithBatch.url) await canvas.handleSaveToHistory(specImgWithBatch);

            canvas.setArtboards(prev => [...prev, {
                id: specImgWithBatch.id, x: localX, y: groupY + 60, width: 1000, height: 1200, image: specImgWithBatch, history: [specImgWithBatch], label: 'Design System', groupId: batchId
            }]);
            localX += 1050;
        }

        canvas.setArtboardGroups(prev => [...prev, { id: batchId, label: config.description.substring(0, 20) || `Batch`, x: groupX, y: groupY, width: 0, height: 0 }]);

        try {
            for (let i = 0; i < total; i++) {
                const page = config.pages[i];
                setBatchProgress(`${lang === 'zh' ? '正在生成' : 'Generating'} ${i + 1}/${total}: ${page.name}`);

                const pageConfig: GenerationConfig = {
                    platform: config.platform, resolution: effectiveResolution, customSize: config.customSize, style: config.style,
                    description: `${config.description}\n\nSpecific Page: ${page.name} - ${page.description}`,
                    pageName: page.name, keywords: [], highQuality: config.highQuality, enableDesignTokens: config.enableDesignTokens,
                    designTokens: config.designTokens, background: config.background, forceChinese: config.forceChinese,
                    promptLanguage: config.promptLanguage, preferredImageApiId: config.preferredImageApiId,
                    batchOutputMode: config.batchOutputMode, specMode: config.specMode,
                            designMd: config.designMdContent || undefined,
                    visualStyle: config.visualStyleContent || undefined,
                    ...mediaFields
                };

                // Prepare Spec Context
                let designSystemContext: DesignSystem | undefined = undefined;
                let styleRefImage: string | undefined = undefined;

                if (currentSpec?.details?.designSystem) {
                    designSystemContext = currentSpec.details.designSystem;
                } else if (currentSpec?.url) {
                    styleRefImage = currentSpec.url;
                }

                const constructedPrompt = constructPrompt(pageConfig, false, !!page.layoutImage || !!canvas.layoutImage, false, designSystemContext);

                const asset = await generateUIReference({
                    prompt: constructedPrompt, config: pageConfig,
                    colorImage: config.colorImage || undefined,
                    styleImageBase64: (!designSystemContext && styleRefImage) ? styleRefImage : (config.referenceImages[0] || undefined),
                    layoutImageBase64: page.layoutImage || canvas.layoutImage,
                    preferredImageApiId: config.preferredImageApiId,
                });

                const dims = await canvas.getImageDimensions(asset.base64);
                const newImage: GeneratedImage = {
                    id: asset.id, url: asset.url, prompt: page.name, timestamp: asset.timestamp,
                    details: { ...pageConfig as any, resolution: `${dims.width}x${dims.height}`, batchId, originalDescription: pageConfig.description, projectId: currentProjectId || undefined }
                };

                // Add to canvas immediately
                canvas.setArtboards(prev => [...prev, {
                    id: newImage.id, x: localX, y: groupY + 60, width: dims.width, height: dims.height, image: newImage, label: page.name, groupId: batchId, history: [newImage], isNew: true
                }]);

                // Update group width/height
                const currentWidth = (localX - groupX) + dims.width;
                canvas.setArtboardGroups(prev => prev.map(g => g.id === batchId ? { ...g, width: currentWidth, height: Math.max(g.height, dims.height) } : g));

                localX += dims.width + 50;
                completed++;
                setProgressValue((completed / total) * 100);
            }
        } catch (e: any) { setError(e.message); }
        finally { setIsGenerating(false); setBatchProgress(''); setProgressValue(0); }
    };

    // --- Skill Constants Aggregator ---
    const loadSkillPrompting = async () => {
        const [
            promptBuilders,
            CoverConstants,
            InfographicConstants,
            XHSConstants,
            ComicConstants,
            ArticleConstants,
            SlideConstants,
            LogoConstants,
            StickerConstants,
        ] = await Promise.all([
            import('../skills/promptBuilders'),
            import('../skills/cover-image/constants'),
            import('../skills/infographic/constants'),
            import('../skills/xhs-images/constants'),
            import('../skills/comic/constants'),
            import('../skills/article-illustrator/constants'),
            import('../skills/slide-deck/constants'),
            import('../skills/logo/constants'),
            import('../skills/sticker-design/constants'),
        ]);

        const constants: SkillConstants = {
            coverImage: {
                types: CoverConstants.COVER_TYPES,
                palettes: CoverConstants.COVER_PALETTES,
                renderings: CoverConstants.COVER_RENDERINGS,
                texts: CoverConstants.COVER_TEXTS,
                moods: CoverConstants.COVER_MOODS,
                fonts: CoverConstants.COVER_FONTS,
            },
            infographic: {
                layouts: InfographicConstants.INFOGRAPHIC_LAYOUTS,
                styles: InfographicConstants.INFOGRAPHIC_STYLES,
            },
            xhsImages: {
                styles: XHSConstants.XHS_STYLES,
                layouts: XHSConstants.XHS_LAYOUTS,
                strategies: XHSConstants.XHS_STRATEGIES,
            },
            comic: {
                artStyles: ComicConstants.COMIC_ART_STYLES,
                tones: ComicConstants.COMIC_TONES,
                layouts: ComicConstants.COMIC_LAYOUTS,
                presets: ComicConstants.COMIC_PRESETS,
            },
            articleIllustrator: {
                types: ArticleConstants.ARTICLE_TYPES,
                styles: ArticleConstants.ARTICLE_STYLES,
                densities: ArticleConstants.ARTICLE_DENSITIES,
            },
            slideDeck: {
                presets: SlideConstants.SLIDE_PRESETS,
                audiences: SlideConstants.SLIDE_AUDIENCES,
            },
            logo: {
                types: LogoConstants.LOGO_TYPES,
                styles: LogoConstants.LOGO_STYLES,
                palettes: LogoConstants.LOGO_PALETTES,
                industries: LogoConstants.LOGO_INDUSTRIES,
                moods: LogoConstants.LOGO_MOODS,
            },
            stickerDesign: {
                styles: StickerConstants.STICKER_STYLES,
                shapes: StickerConstants.STICKER_SHAPES,
                themes: StickerConstants.STICKER_THEMES,
                sizes: StickerConstants.STICKER_SIZES,
                backgrounds: StickerConstants.STICKER_BACKGROUNDS,
            },
        };

        return { buildSkillPrompt: promptBuilders.buildSkillPrompt, constants };
    };

    // --- Skill Mode: Single Image Generation ---
    const handleSkillSingleGeneration = async (skillType: string, skillConfig: any, currentProjectId: string | null) => {
        setIsGenerating(true); setProgressValue(20); setError(null);

        // Resolve skill-specific resolution override
        let skillResolution = effectiveResolution;
        if (skillType === 'logo' && skillConfig.logo?.size) {
            const logoSizeMap: Record<string, { width: number; height: number }> = {
                '1:1': { width: 500, height: 500 },
                '4:3': { width: 600, height: 450 },
                '16:9': { width: 800, height: 450 },
                '3:4': { width: 450, height: 600 },
                '2:1': { width: 800, height: 400 },
            };
            const dims = logoSizeMap[skillConfig.logo.size] || logoSizeMap['1:1'];
            skillResolution = { id: `logo-${skillConfig.logo.size}`, name: `Logo ${skillConfig.logo.size}`, width: dims.width, height: dims.height, type: config.platform as any };
        } else if (skillType === 'sticker-design' && skillConfig.stickerDesign?.aspect) {
            const stickerSizeMap: Record<string, { width: number; height: number }> = {
                '1:1': { width: 512, height: 512 },
                '3:4': { width: 450, height: 600 },
                '4:3': { width: 600, height: 450 },
                '9:16': { width: 450, height: 800 },
                '16:9': { width: 800, height: 450 },
            };
            const dims = stickerSizeMap[skillConfig.stickerDesign.aspect] || stickerSizeMap['1:1'];
            skillResolution = { id: `sticker-${skillConfig.stickerDesign.aspect}`, name: `Sticker ${skillConfig.stickerDesign.aspect}`, width: dims.width, height: dims.height, type: config.platform as any };
        }

        try {
            const { buildSkillPrompt, constants } = await loadSkillPrompting();
            const prompt = buildSkillPrompt(skillType as any, config.description, skillConfig, constants);
            const promptStr = typeof prompt === 'string' ? prompt : prompt.prompt;

            const genConfig: GenerationConfig = {
                platform: config.platform, resolution: skillResolution, customSize: { width: skillResolution.width, height: skillResolution.height, active: true },
                style: config.style, description: config.description, pageName: config.pageName || 'Skill Output',
                keywords: config.keywords, highQuality: config.highQuality, enableDesignTokens: false,
                designTokens: config.designTokens, background: config.background, forceChinese: config.forceChinese,
                promptLanguage: config.promptLanguage, preferredImageApiId: config.preferredImageApiId,
                batchOutputMode: 'separate', specMode: 'image',
                    skillMode: true, skillConfig,
                ...mediaFields
            };

            const asset = await generateUIReference({
                prompt: promptStr,
                config: genConfig,
                colorImage: config.colorImage || undefined,
                styleImageBase64: config.referenceImages[0] || undefined,
                preferredImageApiId: config.preferredImageApiId,
            });

            const dims = await canvas.getImageDimensions(asset.base64);
            const newImage: GeneratedImage = {
                id: asset.id, url: asset.url, prompt: asset.prompt, timestamp: asset.timestamp,
                details: {
                    platform: config.platform, resolution: `${dims.width}x${dims.height}`, style: config.style.name,
                    tokens: config.designTokens, fullPrompt: asset.prompt, batchId: `skill-${skillType}-${Date.now()}`,
                    originalDescription: config.description, projectId: currentProjectId || undefined
                }
            };

            await canvas.handleSaveToHistory(newImage);
            canvas.setArtboards(prev => {
                const x = 50 + (prev.length * 50);
                const y = 50 + (prev.length * 50);
                return [...prev, { id: newImage.id, x, y, width: dims.width, height: dims.height, image: newImage, history: [newImage], label: skillType, groupId: undefined }];
            });

            setProgressValue(100);
        } catch (err: any) {
            if (err?.message === "QUOTA_EXCEEDED") setError(lang === 'zh' ? '配额已耗尽' : 'Quota Exceeded');
            else setError(err.message);
        } finally { setIsGenerating(false); setTimeout(() => setProgressValue(0), 500); }
    };

    // --- Skill Mode: Multi-Image Sequence Generation ---
    const handleSkillSequenceGeneration = async (skillType: string, skillConfig: any, currentProjectId: string | null) => {
        setIsGenerating(true); setError(null); setProgressValue(0);

        const pages = config.pages;
        const pageCount = pages.length;
        if (pageCount === 0) {
            setError(lang === 'zh' ? '请先在批量模式下添加页面内容' : 'Please add pages in batch mode first');
            setIsGenerating(false);
            return;
        }

        const batchId = `skill-${skillType}-${Date.now()}`;
        let refImage: string | undefined = undefined;
        const groupX = 50 + (canvas.artboardGroups.length * 100);
        const groupY = 50 + (canvas.artboardGroups.length * 100);
        let localX = groupX;

        const groupLabel = pages[0]?.name || config.description.substring(0, 20) || skillType;
        canvas.setArtboardGroups(prev => [...prev, { id: batchId, label: `${skillType} - ${groupLabel}`, x: groupX, y: groupY, width: 0, height: 0 }]);

        try {
            const { buildSkillPrompt, constants } = await loadSkillPrompting();

            for (let i = 0; i < pageCount; i++) {
                const page = pages[i];
                const pageContent = page.description || config.description;
                const pageName = page.name || `${skillType} ${i + 1}`;

                setBatchProgress(`${lang === 'zh' ? '正在生成' : 'Generating'} ${i + 1}/${pageCount}: ${pageName}`);
                setProgressValue((i / pageCount) * 100);

                const pageType = i === 0 ? 'cover' : (i === pageCount - 1 ? 'ending' : 'content');
                const promptResult = buildSkillPrompt(skillType as any, pageContent, skillConfig, constants, {
                    pageIndex: i, refImage, pageType, slideIndex: i
                });
                const promptStr = typeof promptResult === 'string' ? promptResult : promptResult.prompt;

                const genConfig: GenerationConfig = {
                    platform: config.platform, resolution: effectiveResolution, customSize: config.customSize,
                    style: config.style, description: pageContent, pageName,
                    keywords: config.keywords, highQuality: config.highQuality, enableDesignTokens: false,
                    designTokens: config.designTokens, background: config.background, forceChinese: config.forceChinese,
                    promptLanguage: config.promptLanguage, preferredImageApiId: config.preferredImageApiId,
                    batchOutputMode: 'separate', specMode: 'image',
                            skillMode: true, skillConfig,
                    ...mediaFields
                };

                const asset = await generateUIReference({
                    prompt: promptStr,
                    config: genConfig,
                    colorImage: config.colorImage || undefined,
                    styleImageBase64: refImage || config.referenceImages[0] || undefined,
                    preferredImageApiId: config.preferredImageApiId,
                });

                const dims = await canvas.getImageDimensions(asset.base64);
                const newImage: GeneratedImage = {
                    id: asset.id, url: asset.url, prompt: asset.prompt, timestamp: asset.timestamp,
                    details: {
                        platform: config.platform, resolution: `${dims.width}x${dims.height}`, style: config.style.name,
                        tokens: config.designTokens, fullPrompt: asset.prompt, batchId,
                        originalDescription: pageContent, projectId: currentProjectId || undefined
                    }
                };

                await canvas.handleSaveToHistory(newImage);
                canvas.setArtboards(prev => [...prev, {
                    id: newImage.id, x: localX, y: groupY + 60, width: dims.width, height: dims.height,
                    image: newImage, label: pageName, groupId: batchId, history: [newImage], isNew: true
                }]);

                const currentWidth = (localX - groupX) + dims.width;
                canvas.setArtboardGroups(prev => prev.map(g => g.id === batchId ? { ...g, width: currentWidth, height: Math.max(g.height, dims.height) } : g));

                localX += dims.width + 50;
                refImage = asset.url; // Use previous image as reference for next
            }
            setProgressValue(100);
        } catch (err: any) {
            if (err?.message === "QUOTA_EXCEEDED") setError(lang === 'zh' ? '配额已耗尽' : 'Quota Exceeded');
            else setError(err.message);
        } finally { setIsGenerating(false); setBatchProgress(''); setProgressValue(0); }
    };

    const handlePrepareGeneration = (devMode: boolean, currentProjectId: string | null) => {
        // Skill Mode Branch — reuses isBatchMode + pages for multi-image skills
        if (config.skillMode && config.skillConfig) {
            const skillType = config.skillConfig.type;
            if (config.isBatchMode) {
                handleSkillSequenceGeneration(skillType, config.skillConfig, currentProjectId);
            } else {
                handleSkillSingleGeneration(skillType, config.skillConfig, currentProjectId);
            }
            return;
        }

        // Traditional Mode
        if (config.pages.length > 0 && config.isBatchMode) {
            if (config.enableDesignTokens) startBatchGenerationFlow(null);
            else { setSpecReviewImage(null); continueBatchGeneration(currentProjectId); }
            return;
        }

        const constructed = constructPrompt({
            ...config,
            designMd: config.designMdContent || undefined,
            visualStyle: config.visualStyleContent || undefined,
            layoutDensity: config.layoutDensityContent || undefined,
        } as any, false, !!canvas.layoutImage);
        if (devMode) {
            const enabledImageAPIs = getEnabledImageAPIs();
            let targetAPI = enabledImageAPIs[0];
            if (config.preferredImageApiId) {
                const preferred = enabledImageAPIs.find(a => a.id === config.preferredImageApiId);
                if (preferred) targetAPI = preferred;
            }

            const width = config.customSize.active ? config.customSize.width : config.resolution.width;
            const height = config.customSize.active ? config.customSize.height : config.resolution.height;
            const aspectRatio = getAspectRatio(width, height);

            setReviewData({
                prompt: constructed,
                config: config as any,
                pendingAction: () => handleConfirmGeneration(constructed, false, currentProjectId),
                images: [],
                apiRequestInfo: targetAPI ? {
                    targetAPI: {
                        provider: targetAPI.provider,
                        baseUrl: targetAPI.baseUrl,
                        model: targetAPI.imageModel || DEFAULT_IMAGE_MODEL,
                        name: targetAPI.name,
                    },
                    requestParams: {
                        prompt: constructed,
                        aspectRatio,
                        preferredApiId: config.preferredImageApiId,
                        images: {
                            hasColorImage: !!config.colorImage,
                            hasStyleImage: !!config.referenceImages[0],
                            hasLayoutImage: !!canvas.layoutImage,
                            hasEditImage: false,
                            hasMaskImage: false,
                            contentImageCount: 0,
                        },
                    },
                } : undefined,
            });
        } else {
            handleConfirmGeneration(constructed, false, currentProjectId);
        }
    };

    const handleRegenerateArtboard = async (id: string, prompt: string, ref: string | null, layout: string | null, mask: string | null) => {
        const targetBoard = canvas.artboards.find(a => a.id === id);
        if (!targetBoard) return;

        setIsGenerating(true); setRegeneratingId(id); setError(null);
        const oldDetails = targetBoard.image.details;

        const genConfig: GenerationConfig = {
            platform: config.platform, resolution: effectiveResolution, customSize: config.customSize, style: config.style,
            description: oldDetails?.originalDescription || config.description,
            pageName: targetBoard.label, keywords: config.keywords, highQuality: config.highQuality, enableDesignTokens: config.enableDesignTokens,
            designTokens: config.designTokens, background: config.background, forceChinese: config.forceChinese,
            promptLanguage: config.promptLanguage, preferredImageApiId: config.preferredImageApiId,
            batchOutputMode: 'separate', specMode: 'image',
            designMd: config.designMdContent || undefined,
            visualStyle: config.visualStyleContent || undefined,
            layoutDensity: config.layoutDensityContent || undefined,
            ...mediaFields,
        };

        let finalPrompt = '';
        if (!prompt.trim()) { finalPrompt = constructPrompt(genConfig, !!ref, !!layout); }
        else { finalPrompt = `**PRIMARY EDIT INSTRUCTION**: ${prompt}\n\n**CONTEXT (Background Info)**: ${genConfig.description}`; }
        if (mask) finalPrompt += "\n\n**INSTRUCTION**: Edit ONLY the area designated by the provided mask. Keep the rest of the UI exactly the same.";

        try {
            let editBase = ref;
            if (!editBase && regenState.mode === 'refine' && targetBoard.image.url) { editBase = targetBoard.image.url; }

            const asset = await generateUIReference({
                prompt: finalPrompt, config: genConfig,
                styleImageBase64: config.referenceImages[0] || undefined,
                layoutImageBase64: layout, editImageBase64: editBase || undefined, maskImageBase64: mask || undefined,
                preferredImageApiId: config.preferredImageApiId,
            });

            const dims = await canvas.getImageDimensions(asset.base64);
            const newImage: GeneratedImage = {
                id: asset.id, url: asset.url, prompt: asset.prompt, timestamp: asset.timestamp,
                details: { ...oldDetails, fullPrompt: finalPrompt, resolution: `${dims.width}x${dims.height}`, batchId: oldDetails?.batchId || 'regen' }
            };

            canvas.setArtboards(prev => prev.map(b => {
                if (b.id === id) {
                    const newHistory = [...(b.history || (b.image ? [b.image] : [])), newImage];
                    return { ...b, image: newImage, history: newHistory, width: dims.width, height: dims.height, isNew: true };
                }
                return b;
            }));
        } catch (err: any) { setError(err.message || 'Regeneration failed'); }
        finally { setIsGenerating(false); setRegeneratingId(null); }
    };

    // Open Regen
    const handleOpenRegen = async (artboardId: string, getAssetDetails: any) => {
        const ab = canvas.artboards.find(a => a.id === artboardId);
        if (!ab) return;

        let targetImg = ab.image;
        if (targetImg.prompt === 'Loading...' || (targetImg.details as any)?.isLazy) {
            // Assume we need to load
            // This part might need dependency injection for fetching details
            if (getAssetDetails) {
                const full = await getAssetDetails(targetImg.id);
                if (full) {
                    canvas.setArtboards(prev => prev.map(item => item.id === artboardId ? { ...item, image: full } : item));
                    targetImg = full;
                }
            }
        }

        setRegenState({
            isOpen: true, artboardId: artboardId, targetImage: targetImg.url, mode: 'refine',
            prompt: '', referenceImage: null, layoutImage: null, layoutElements: [], maskImage: null
        });
    };

    return {
        // State
        isGenerating, error, batchProgress, progressValue, isExtractingStyle, isAnalyzingLayout, isAiGeneratingDescription,
        specReviewImage, specFeedback, batchConfirmation, reviewData, regeneratingId, inspectImage, regenState,

        // Actions
        handleExtractStyle, handleAnalyzeLayout, handleAutoGeneratePages, handleAiGenerateDescription, handleConfirmGeneration,
        startBatchGenerationFlow, continueBatchGeneration, handlePrepareGeneration, handleRegenerateArtboard, handleOpenRegen,

        // Setters
        setSpecReviewImage, setSpecFeedback, setBatchConfirmation, setReviewData, setRegenState, setInspectImage
    };
}
