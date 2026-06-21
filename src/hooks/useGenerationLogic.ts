import { useState } from 'react';
import { GeneratedImage, DesignSystem } from '../types';
import { extractStyleFromImages, generatePageList, constructPrompt, generateDesignSpecJson, generateUIReference, analyzeLayoutImage, optimizeDescription } from '../services/aiGenerationService';
import { LangType } from '../types';
import { addBatchArtboard, addGeneratedArtboard, replaceRegeneratedArtboard, updateBatchGroupBounds } from '../domain/canvas/artboardTransforms';
import { createGenerationConfig, getEffectiveResolution } from '../domain/generation/config';
import { buildDevReviewData } from '../domain/generation/devReview';
import { createGeneratedImage } from '../domain/generation/images';
import { loadSkillPrompting, resolveSkillResolution } from '../domain/generation/skillPrompting';
import { completeGenerationTask, createGenerationTask, failGenerationTask } from '../services/generationTaskService';
import {
    createStickerMetadata,
    getStickerBackgroundStrategy,
    normalizeStickerConfig,
    repairStickerTransparency,
} from '../domain/stickers';
import type { GenerationCanvasState, GenerationConfigState, GenerationReviewData, RegenState } from '../domain/generation/types';
import type { GenerationTask, StickerDesignConfig } from '../types';

export const useGenerationLogic = (
    lang: LangType,
    config: GenerationConfigState,
    canvas: GenerationCanvasState
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
    const [reviewData, setReviewData] = useState<GenerationReviewData | null>(null);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [inspectImage, setInspectImage] = useState<GeneratedImage | null>(null);

    const [regenState, setRegenState] = useState<RegenState>({
        isOpen: false, artboardId: null, targetImage: null, mode: 'refine', prompt: '', referenceImage: null, layoutImage: null, layoutElements: [], maskImage: null
    });

    const effectiveResolution = getEffectiveResolution(config);

    const startGenerationTask = async (input: {
        role: string;
        prompt: string;
        fullPrompt?: string;
        batchId?: string | null;
        projectId?: string | null;
        artboardId?: string | null;
        inputImageIds?: string[];
    }): Promise<GenerationTask | null> => {
        try {
            return await createGenerationTask({
                ...input,
                apiProfileId: config.preferredImageApiId,
            });
        } catch (err) {
            console.warn('Failed to create generation task', err);
            return null;
        }
    };

    const finishGenerationTask = async (task: GenerationTask | null, image: GeneratedImage, asset: any, artboardId?: string | null) => {
        if (!task) return;
        try {
            await completeGenerationTask(task.id, {
                outputImageIds: [image.id],
                outputAssetIds: image.imageId ? [image.imageId] : [],
                apiProfileId: asset?.usedAPI?.id || task.apiProfileId || null,
                imageModel: asset?.usedAPI?.imageModel || task.imageModel || null,
                artboardId: artboardId ?? task.artboardId ?? null,
            });
        } catch (err) {
            console.warn('Failed to complete generation task', err);
        }
    };

    const markGenerationTaskFailed = async (task: GenerationTask | null, err: any) => {
        if (!task) return;
        try {
            await failGenerationTask(task.id, err?.message || String(err));
        } catch (taskErr) {
            console.warn('Failed to mark generation task failed', taskErr);
        }
    };

    const applyStickerWorkflow = async (
        skillType: string,
        skillConfig: any,
        asset: any,
    ): Promise<{ asset: any; stickerDetails?: ReturnType<typeof createStickerMetadata> }> => {
        if (skillType !== 'sticker-design' || !skillConfig?.stickerDesign) {
            return { asset };
        }

        const stickerConfig = normalizeStickerConfig(skillConfig.stickerDesign as StickerDesignConfig);
        const strategy = getStickerBackgroundStrategy(stickerConfig);
        let processedAsset = asset;
        let backgroundRemoved = false;
        let processingError: string | undefined;

        if (strategy.transparentWorkflow) {
            try {
                const repaired = await repairStickerTransparency(asset.base64 || asset.url, {
                    backgroundColor: strategy.promptBackgroundColor,
                });
                processedAsset = {
                    ...asset,
                    url: repaired.url,
                    base64: repaired.url,
                };
                backgroundRemoved = repaired.backgroundRemoved;
            } catch (err: any) {
                processingError = err?.message || String(err);
            }
        }

        return {
            asset: processedAsset,
            stickerDetails: createStickerMetadata(stickerConfig, {
                backgroundRemoved,
                error: processingError,
            }),
        };
    };

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
        const genConfig = createGenerationConfig(config, { pageName: config.pageName || 'Screen' });

        const batchId = `single-${Date.now()}`;
        const promptToUse = overridePrompt || constructPrompt(genConfig, false, !!layoutImageToUse);
        let task: GenerationTask | null = null;

        try {
            task = await startGenerationTask({
                role: config.activeRole || 'designer',
                prompt: promptToUse,
                fullPrompt: promptToUse,
                batchId,
                projectId,
            });

            const asset = await generateUIReference({
                prompt: promptToUse,
                config: genConfig,
                colorImage: config.colorImage || undefined,
                styleImageBase64: config.referenceImages[0] || undefined,
                layoutImageBase64: layoutImageToUse,
                preferredImageApiId: config.preferredImageApiId,
            });

            const dims = await canvas.getImageDimensions(asset.base64);
            const newImage = createGeneratedImage(asset, dims, genConfig, {
                batchId,
                originalDescription: config.description,
                projectId,
            });

            const savedImage = await canvas.handleSaveToHistory(newImage) ?? newImage;

            canvas.setArtboards(prev => addGeneratedArtboard(prev, savedImage, dims, config.pageName || 'UI'));
            await finishGenerationTask(task, savedImage, asset);

            setProgressValue(100);
        } catch (err: any) {
            await markGenerationTaskFailed(task, err);
            if (err?.message === "QUOTA_EXCEEDED") setError(lang === 'zh' ? '配额已耗尽' : 'Quota Exceeded');
            else setError(err.message);
        } finally { setIsGenerating(false); setTimeout(() => setProgressValue(0), 500); }
    };

    const startBatchGenerationFlow = async (feedback: string | null) => {
        setIsGenerating(true); setError(null);
        setBatchProgress(lang === 'zh' ? '正在生成设计规范...' : 'Generating Design Spec...');

        try {
            const genConfig = createGenerationConfig(config, {
                pageName: 'Design System',
                layoutDensity: undefined,
            });

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

        let activeTask: GenerationTask | null = null;
        try {
            for (let i = 0; i < total; i++) {
                const page = config.pages[i];
                setBatchProgress(`${lang === 'zh' ? '正在生成' : 'Generating'} ${i + 1}/${total}: ${page.name}`);

                const pageConfig = createGenerationConfig(config, {
                    resolution: effectiveResolution,
                    description: `${config.description}\n\nSpecific Page: ${page.name} - ${page.description}`,
                    pageName: page.name,
                    keywords: [],
                });

                // Prepare Spec Context
                let designSystemContext: DesignSystem | undefined = undefined;
                let styleRefImage: string | undefined = undefined;

                if (currentSpec?.details?.designSystem) {
                    designSystemContext = currentSpec.details.designSystem;
                } else if (currentSpec?.url) {
                    styleRefImage = currentSpec.url;
                }

                const constructedPrompt = constructPrompt(pageConfig, false, !!page.layoutImage || !!canvas.layoutImage, false, designSystemContext);
                activeTask = await startGenerationTask({
                    role: config.activeRole || 'designer',
                    prompt: constructedPrompt,
                    fullPrompt: constructedPrompt,
                    batchId,
                    projectId: currentProjectId,
                    inputImageIds: [],
                });

                const asset = await generateUIReference({
                    prompt: constructedPrompt, config: pageConfig,
                    colorImage: config.colorImage || undefined,
                    styleImageBase64: (!designSystemContext && styleRefImage) ? styleRefImage : (config.referenceImages[0] || undefined),
                    layoutImageBase64: page.layoutImage || canvas.layoutImage,
                    preferredImageApiId: config.preferredImageApiId,
                });

                const dims = await canvas.getImageDimensions(asset.base64);
                const newImage = createGeneratedImage(asset, dims, pageConfig, {
                    prompt: page.name,
                    batchId,
                    originalDescription: pageConfig.description,
                    projectId: currentProjectId,
                    details: pageConfig as any,
                });

                const savedImage = await canvas.handleSaveToHistory(newImage) ?? newImage;

                // Add to canvas immediately
                canvas.setArtboards(prev => addBatchArtboard(prev, savedImage, dims, page.name, batchId, localX, groupY + 60));
                await finishGenerationTask(activeTask, savedImage, asset);
                activeTask = null;

                // Update group width/height
                const currentWidth = (localX - groupX) + dims.width;
                canvas.setArtboardGroups(prev => updateBatchGroupBounds(prev, batchId, currentWidth, dims.height));

                localX += dims.width + 50;
                completed++;
                setProgressValue((completed / total) * 100);
            }
        } catch (e: any) { await markGenerationTaskFailed(activeTask, e); setError(e.message); }
        finally { setIsGenerating(false); setBatchProgress(''); setProgressValue(0); }
    };

    // --- Skill Mode: Single Image Generation ---
    const handleSkillSingleGeneration = async (skillType: string, skillConfig: any, currentProjectId: string | null) => {
        setIsGenerating(true); setProgressValue(20); setError(null);

        const skillResolution = resolveSkillResolution(config, skillType, skillConfig);
        const batchId = `skill-${skillType}-${Date.now()}`;
        let task: GenerationTask | null = null;

        try {
            const { buildSkillPrompt, constants } = await loadSkillPrompting();
            const prompt = buildSkillPrompt(skillType as any, config.description, skillConfig, constants);
            const promptStr = typeof prompt === 'string' ? prompt : prompt.prompt;
            const stickerConfig = skillType === 'sticker-design' && skillConfig.stickerDesign
                ? normalizeStickerConfig(skillConfig.stickerDesign as StickerDesignConfig)
                : null;

            const genConfig = createGenerationConfig(config, {
                resolution: skillResolution,
                customSize: { width: skillResolution.width, height: skillResolution.height, active: true },
                pageName: config.pageName || 'Skill Output',
                enableDesignTokens: false,
                batchOutputMode: 'separate',
                specMode: 'image',
                skillMode: true,
                skillConfig,
            });

            const inputImageIds: string[] = [];
            task = await startGenerationTask({
                role: skillType,
                prompt: promptStr,
                fullPrompt: promptStr,
                batchId,
                projectId: currentProjectId,
                inputImageIds,
            });

            const asset = await generateUIReference({
                prompt: promptStr,
                config: genConfig,
                colorImage: config.colorImage || undefined,
                styleImageBase64: config.referenceImages[0] || undefined,
                editImageBase64: stickerConfig?.referenceImage || undefined,
                preferredImageApiId: config.preferredImageApiId,
            });

            const stickerResult = await applyStickerWorkflow(skillType, skillConfig, asset);
            const dims = await canvas.getImageDimensions(stickerResult.asset.base64);
            const newImage = createGeneratedImage(stickerResult.asset, dims, genConfig, {
                batchId,
                originalDescription: config.description,
                projectId: currentProjectId,
                details: stickerResult.stickerDetails ? {
                    sticker: stickerResult.stickerDetails,
                    referenceImages: stickerConfig?.referenceImage ? [{ label: 'Sticker reference', url: stickerConfig.referenceImage }] : undefined,
                } : undefined,
            });

            const savedImage = await canvas.handleSaveToHistory(newImage) ?? newImage;
            canvas.setArtboards(prev => addGeneratedArtboard(prev, savedImage, dims, skillType));
            await finishGenerationTask(task, savedImage, stickerResult.asset);

            setProgressValue(100);
        } catch (err: any) {
            await markGenerationTaskFailed(task, err);
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

        let activeTask: GenerationTask | null = null;
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

                const genConfig = createGenerationConfig(config, {
                    resolution: effectiveResolution,
                    description: pageContent,
                    pageName,
                    enableDesignTokens: false,
                    batchOutputMode: 'separate',
                    specMode: 'image',
                    skillMode: true,
                    skillConfig,
                });

                activeTask = await startGenerationTask({
                    role: skillType,
                    prompt: promptStr,
                    fullPrompt: promptStr,
                    batchId,
                    projectId: currentProjectId,
                    inputImageIds: [],
                });

                const asset = await generateUIReference({
                    prompt: promptStr,
                    config: genConfig,
                    colorImage: config.colorImage || undefined,
                    styleImageBase64: refImage || config.referenceImages[0] || undefined,
                    editImageBase64: skillType === 'sticker-design' && skillConfig.stickerDesign?.referenceImage
                        ? skillConfig.stickerDesign.referenceImage
                        : undefined,
                    preferredImageApiId: config.preferredImageApiId,
                });

                const stickerResult = await applyStickerWorkflow(skillType, skillConfig, asset);
                const dims = await canvas.getImageDimensions(stickerResult.asset.base64);
                const newImage = createGeneratedImage(stickerResult.asset, dims, genConfig, {
                    batchId,
                    originalDescription: pageContent,
                    projectId: currentProjectId,
                    details: stickerResult.stickerDetails ? { sticker: stickerResult.stickerDetails } : undefined,
                });

                const savedImage = await canvas.handleSaveToHistory(newImage) ?? newImage;
                canvas.setArtboards(prev => addBatchArtboard(prev, savedImage, dims, pageName, batchId, localX, groupY + 60));
                await finishGenerationTask(activeTask, savedImage, stickerResult.asset);
                activeTask = null;

                const currentWidth = (localX - groupX) + dims.width;
                canvas.setArtboardGroups(prev => updateBatchGroupBounds(prev, batchId, currentWidth, dims.height));

                localX += dims.width + 50;
                refImage = asset.url; // Use previous image as reference for next
            }
            setProgressValue(100);
        } catch (err: any) {
            await markGenerationTaskFailed(activeTask, err);
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
            setReviewData(buildDevReviewData(config, canvas, currentProjectId, handleConfirmGeneration));
        } else {
            handleConfirmGeneration(constructed, false, currentProjectId);
        }
    };

    const handleRegenerateArtboard = async (id: string, prompt: string, ref: string | null, layout: string | null, mask: string | null) => {
        const targetBoard = canvas.artboards.find(a => a.id === id);
        if (!targetBoard) return;

        setIsGenerating(true); setRegeneratingId(id); setError(null);
        const oldDetails = targetBoard.image.details;

        const genConfig = createGenerationConfig(config, {
            resolution: effectiveResolution,
            description: oldDetails?.originalDescription || config.description,
            pageName: targetBoard.label,
            batchOutputMode: 'separate',
            specMode: 'image',
        });

        let finalPrompt = '';
        if (!prompt.trim()) { finalPrompt = constructPrompt(genConfig, !!ref, !!layout); }
        else { finalPrompt = `**PRIMARY EDIT INSTRUCTION**: ${prompt}\n\n**CONTEXT (Background Info)**: ${genConfig.description}`; }
        if (mask) finalPrompt += "\n\n**INSTRUCTION**: Edit ONLY the area designated by the provided mask. Keep the rest of the UI exactly the same.";
        let task: GenerationTask | null = null;

        try {
            let editBase = ref;
            if (!editBase && regenState.mode === 'refine' && targetBoard.image.url) { editBase = targetBoard.image.url; }

            task = await startGenerationTask({
                role: config.activeRole || 'designer',
                prompt: finalPrompt,
                fullPrompt: finalPrompt,
                batchId: oldDetails?.batchId || 'regen',
                projectId: oldDetails?.projectId || null,
                artboardId: id,
                inputImageIds: targetBoard.image.imageId ? [targetBoard.image.imageId] : [],
            });

            const asset = await generateUIReference({
                prompt: finalPrompt, config: genConfig,
                styleImageBase64: config.referenceImages[0] || undefined,
                layoutImageBase64: layout, editImageBase64: editBase || undefined, maskImageBase64: mask || undefined,
                preferredImageApiId: config.preferredImageApiId,
            });

            const dims = await canvas.getImageDimensions(asset.base64);
            const newImage: GeneratedImage = {
                id: asset.id,
                url: asset.url,
                prompt: asset.prompt,
                timestamp: asset.timestamp,
                details: {
                    ...oldDetails,
                    platform: config.platform,
                    style: config.style.name,
                    tokens: config.designTokens,
                    fullPrompt: finalPrompt,
                    resolution: `${dims.width}x${dims.height}`,
                    batchId: oldDetails?.batchId || 'regen'
                }
            };

            const savedImage = await canvas.handleSaveToHistory(newImage) ?? newImage;
            canvas.setArtboards(prev => replaceRegeneratedArtboard(prev, id, savedImage, dims));
            await finishGenerationTask(task, savedImage, asset, id);
        } catch (err: any) { await markGenerationTaskFailed(task, err); setError(err.message || 'Regeneration failed'); }
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
