
import React, { useEffect, useState, useRef } from 'react';
import { useUIState } from './useUIState';
import { useConfigState } from './useConfigState';
import { useProjectState } from './useProjectState';
import { useCanvasState } from './useCanvasState';
import { useGenerationLogic } from './useGenerationLogic';
import { getAssetDetails } from '../services/idbHistoryService';
import { AppConfigExport, Project } from '../types';
import html2canvas from 'html2canvas';

export const useAppLogic = (initialProjectId?: string) => {

    // 1. UI State
    const ui = useUIState();

    // 2. Canvas State (Needs UI for notifications)
    const canvas = useCanvasState(ui.lang, initialProjectId, ui.addNotification, (msg) => ui.addNotification(msg || 'Error', 'error'));

    // 3. Config State
    const config = useConfigState();

    const hasConfigValue = (source: Record<string, unknown>, key: string) =>
        Object.prototype.hasOwnProperty.call(source, key);

    const restoreConfigSnapshot = (snapshot?: Record<string, any> | null) => {
        if (!snapshot) return;

        if (hasConfigValue(snapshot, 'platform')) config.setPlatform(snapshot.platform);
        if (hasConfigValue(snapshot, 'resolution')) config.setResolution(snapshot.resolution);
        if (hasConfigValue(snapshot, 'customSize')) config.setCustomSize(snapshot.customSize);
        if (hasConfigValue(snapshot, 'customStyles')) config.setCustomStyles(snapshot.customStyles || []);
        if (hasConfigValue(snapshot, 'style')) config.setStyle(snapshot.style);
        if (hasConfigValue(snapshot, 'description')) config.setDescription(snapshot.description || '');
        if (hasConfigValue(snapshot, 'pageName')) config.setPageName(snapshot.pageName || '');
        if (hasConfigValue(snapshot, 'keywords')) config.setKeywords(snapshot.keywords || []);
        if (hasConfigValue(snapshot, 'enableDesignTokens')) config.setEnableDesignTokens(!!snapshot.enableDesignTokens);
        if (hasConfigValue(snapshot, 'designTokens')) config.setDesignTokens(snapshot.designTokens);
        if (hasConfigValue(snapshot, 'background')) config.setBackground(snapshot.background);
        if (hasConfigValue(snapshot, 'highQuality')) config.setHighQuality(!!snapshot.highQuality);
        if (hasConfigValue(snapshot, 'forceChinese')) config.setForceChinese(!!snapshot.forceChinese);
        if (hasConfigValue(snapshot, 'promptLanguage')) config.setPromptLanguage(snapshot.promptLanguage ?? null);
        if (hasConfigValue(snapshot, 'preferredImageApiId')) config.setPreferredImageApiId(snapshot.preferredImageApiId ?? null);
        if (hasConfigValue(snapshot, 'designMdId')) config.setDesignMdId(snapshot.designMdId ?? null);
        if (hasConfigValue(snapshot, 'designMdContent')) config.setDesignMdContent(snapshot.designMdContent ?? null);
        if (hasConfigValue(snapshot, 'visualStyleId')) config.setVisualStyleId(snapshot.visualStyleId ?? null);
        if (hasConfigValue(snapshot, 'visualStyleContent')) config.setVisualStyleContent(snapshot.visualStyleContent ?? null);
        if (hasConfigValue(snapshot, 'layoutDensityId')) config.setLayoutDensityId(snapshot.layoutDensityId ?? null);
        if (hasConfigValue(snapshot, 'layoutDensityContent')) config.setLayoutDensityContent(snapshot.layoutDensityContent ?? null);
        if (hasConfigValue(snapshot, 'isBatchMode')) config.setIsBatchMode(!!snapshot.isBatchMode);
        if (hasConfigValue(snapshot, 'batchOutputMode')) config.setBatchOutputMode(snapshot.batchOutputMode);
        if (hasConfigValue(snapshot, 'specMode')) config.setSpecMode(snapshot.specMode);
        if (hasConfigValue(snapshot, 'pages')) config.setPages(snapshot.pages || []);
        if (hasConfigValue(snapshot, 'mediaAspectRatio')) config.setMediaAspectRatio(snapshot.mediaAspectRatio);
        if (hasConfigValue(snapshot, 'mediaResolution')) config.setMediaResolution(snapshot.mediaResolution);
        if (hasConfigValue(snapshot, 'mediaType')) config.setMediaType(snapshot.mediaType);
        if (hasConfigValue(snapshot, 'activeRole')) config.setActiveRole(snapshot.activeRole);
        if (hasConfigValue(snapshot, 'skillMode')) config.setSkillMode(!!snapshot.skillMode);
        if (hasConfigValue(snapshot, 'activeSkill')) config.setActiveSkill(snapshot.activeSkill ?? null);
        if (hasConfigValue(snapshot, 'skillConfig')) config.setSkillConfig(snapshot.skillConfig ?? null);
        if (hasConfigValue(snapshot, 'layoutImage')) canvas.updateLayoutImage(snapshot.layoutImage ?? null);
        if (hasConfigValue(snapshot, 'layoutElements')) canvas.setLayoutElements(snapshot.layoutElements || []);
    };

    const restoreProjectConfig = (p: Project) => {
        restoreConfigSnapshot(p.config as Record<string, any> | undefined);
    };

    // 4. Project State
    const project = useProjectState(ui.lang, ui.addNotification, canvas.setArtboards, initialProjectId, restoreProjectConfig);

    // 5. Generation Logic (Aggregates everything)
    const gen = useGenerationLogic(ui.lang, config, canvas);

    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [activePageBuilderId, setActivePageBuilderId] = useState<string | null>(null);


    // --- Estimated Tokens Logic (Legacy) ---
    const [estimatedTokens, setEstimatedTokens] = useState(0);
    useEffect(() => {
        let base = 500 + (config.description.length + config.pageName.length + config.keywords.join(' ').length) * 0.5;
        const imgTokens = ((config.colorImage ? 1 : 0) + (config.referenceImages.length) + (canvas.layoutImage ? 1 : 0)) * 258;
        base += imgTokens;
        if (config.isBatchMode) {
            setEstimatedTokens(Math.round(config.batchOutputMode === 'separate' ? base * Math.max(1, config.pages.length) : base + (config.pages.length * 100)));
        } else {
            setEstimatedTokens(Math.round(base));
        }
    }, [config.description, config.pageName, config.keywords, config.colorImage, config.referenceImages, canvas.layoutImage, config.isBatchMode, config.batchOutputMode, config.pages]);

    // --- Auto-Save Logic ---
    const lastSavedRef = useRef<string>('');

    // Define current config object helper
    const currentConfigObject = {
        platform: config.platform, resolution: config.resolution, customSize: config.customSize, style: config.style,
        customStyles: config.customStyles,
        description: config.description, pageName: config.pageName, keywords: config.keywords, enableDesignTokens: config.enableDesignTokens,
        designTokens: config.designTokens, background: config.background, highQuality: config.highQuality,
        forceChinese: config.forceChinese,
        promptLanguage: config.promptLanguage, preferredImageApiId: config.preferredImageApiId,
        designMdId: config.designMdId, designMdContent: config.designMdContent,
        visualStyleId: config.visualStyleId, visualStyleContent: config.visualStyleContent,
        layoutDensityId: config.layoutDensityId, layoutDensityContent: config.layoutDensityContent,
        isBatchMode: config.isBatchMode, batchOutputMode: config.batchOutputMode, specMode: config.specMode, pages: config.pages,
        activeRole: config.activeRole,
        mediaAspectRatio: config.mediaAspectRatio, mediaResolution: config.mediaResolution, mediaType: config.mediaType,
        skillMode: config.skillMode, activeSkill: config.activeSkill, skillConfig: config.skillConfig,
        layoutImage: canvas.layoutImage, layoutElements: canvas.layoutElements,
    };
    const currentConfigString = JSON.stringify(currentConfigObject);

    useEffect(() => {
        if (!project.currentProjectId) return;
        if (project.isLoadingProject) return; 

        const currentStateString = JSON.stringify({
            artboards: canvas.artboards.map(a => ({ id: a.id, x: a.x, y: a.y, w: a.width, h: a.height })),
            config: currentConfigObject
        });

        if (lastSavedRef.current === currentStateString) return;
        
        // Initial set (avoid save on load)
        if (lastSavedRef.current === '') {
            lastSavedRef.current = currentStateString;
            return;
        }

        const timer = setTimeout(async () => {
            let thumb: string | undefined;
            if (canvas.artboards.length > 0) {
                try {
                    const el = document.getElementById('main-canvas-area');
                    if (el) {
                        const c = await html2canvas(el, { useCORS: true, scale: 0.15, logging: false });
                        thumb = c.toDataURL('image/jpeg', 0.6);
                    }
                } catch (_) {}
            }
            project.handleUpdateProjectContent(
                project.currentProjectId!,
                currentConfigObject,
                canvas.artboards,
                thumb,
                true // Silent / Skip State Update
            ).then(() => {
                lastSavedRef.current = currentStateString;
                console.log("Auto-saved");
            });
        }, 3000); // 3 seconds debounce

        return () => clearTimeout(timer);
    }, [
        project.currentProjectId, 
        project.isLoadingProject,
        canvas.artboards,
        currentConfigString
    ]);


    // --- Export / Import Config ---
    const handleExportConfig = async () => {
        const exportData: AppConfigExport = {
            version: 1, timestamp: Date.now(),
            ...currentConfigObject,
            designMdId: currentConfigObject.designMdId || undefined,
            designMdContent: currentConfigObject.designMdContent || undefined,
            visualStyleId: currentConfigObject.visualStyleId || undefined,
            visualStyleContent: currentConfigObject.visualStyleContent || undefined,
            layoutDensityId: currentConfigObject.layoutDensityId || undefined,
            layoutDensityContent: currentConfigObject.layoutDensityContent || undefined,
            styleImages: [], contentImages: [], // TODO: support images
        };
        // Download logic...
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `muse-ui-config-${Date.now()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data: AppConfigExport = JSON.parse(ev.target?.result as string);
                restoreConfigSnapshot(data as unknown as Record<string, any>);

                ui.addNotification(ui.lang === 'zh' ? '配置导入成功' : 'Configuration imported successfully', 'success');
            } catch (error) {
                ui.addNotification(ui.lang === 'zh' ? '配置文件无效' : 'Invalid configuration file', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return {
        state: {
            ...ui, ...config, ...canvas, ...project, ...gen,
            estimatedTokens, isBuilderOpen, activePageBuilderId
        },
        actions: {
            ...ui, ...config, ...canvas, ...project, ...gen,
            startBatchGenerationFlow: gen.startBatchGenerationFlow,
            continueBatchGeneration: () => gen.continueBatchGeneration(project.currentProjectId),
            handlePrepareGeneration: () => gen.handlePrepareGeneration(ui.devMode, project.currentProjectId),
            setIsBuilderOpen, onOpenPageBuilder: (pid: string | null) => { setActivePageBuilderId(pid); setIsBuilderOpen(true); },
            handleExportConfig, handleImportConfig,
            handleSaveProject: (name: string, thumbnail?: string) => project.handleSaveProject(
                name,
                config.description,
                currentConfigObject,
                canvas.artboards,
                thumbnail
            ),
            handleCreateBlankProject: () => project.handleCreateBlankProject(),
            handleUpdateProjectContent: (id: string, thumbnail?: string, configOverride?: any) => project.handleUpdateProjectContent(
                id,
                { ...currentConfigObject, ...(configOverride || {}) },
                canvas.artboards,
                thumbnail,
                false // Explicit Manual Save -> Updates State & Notifies
            ),
            handleUpdateProjectConfig: project.handleUpdateProjectConfig,
            handleCanvasDrop: (file: File, x: number, y: number) => canvas.handleCanvasDrop(file, x, y, config.platform, config.designTokens),

            cancelGeneration: () => { }, // TODO
            handleOpenRegen: (id: string) => gen.handleOpenRegen(id, getAssetDetails),
            onCopyImage: (base64: string) => {
                config.setCopiedImageBase64(base64);
                ui.addNotification(ui.lang === 'zh' ? '已复制，可在左侧参考图粘贴' : 'Copied! Paste in Reference Images on the left', 'success');
            }
        }
    };
};
