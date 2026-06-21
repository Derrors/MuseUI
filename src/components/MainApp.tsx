

import React, { useEffect, useRef, useState } from 'react';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import LayoutBuilder from './LayoutBuilder';
import GalleryManager from './GalleryManager';
import CanvasBoard from './CanvasBoard';
import MobileBottomNav, { MobilePane } from './MobileBottomNav';
import RegenModal from './modals/RegenModal';
import SpecReviewModal from './modals/SpecReviewModal';
import BatchConfirmationModal from './modals/BatchConfirmationModal';
import DevReviewModal from './modals/DevReviewModal';
import ImageDetailsModal from './modals/ImageDetailsModal';
import ProjectManagerModal from './modals/ProjectManagerModal';
import ChangelogModal from './modals/ChangelogModal';
import { ToastContainer, ConfirmationDialog } from './Toast';
import { Button, Card, Heading, Text, ThemeProvider } from './ui';

import { useAppLogic } from '@/hooks/useAppLogic';

interface Props {
    projectId?: string;
}

const FIRST_USE_TIPS_KEY = 'muse-ui-first-use-tips-dismissed';

const MainApp: React.FC<Props> = ({ projectId }) => {
    const { state, actions } = useAppLogic(projectId);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [showFirstUseTips, setShowFirstUseTips] = useState(false);
    const [activeMobilePane, setActiveMobilePane] = useState<MobilePane>('config');
    const previousArtboardCount = useRef(state.artboards.length);

    useEffect(() => {
        if (localStorage.getItem(FIRST_USE_TIPS_KEY) !== 'true') {
            setShowFirstUseTips(true);
        }
    }, []);

    const closeFirstUseTips = () => {
        localStorage.setItem(FIRST_USE_TIPS_KEY, 'true');
        setShowFirstUseTips(false);
    };

    useEffect(() => {
        if (state.artboards.length > previousArtboardCount.current) {
            setActiveMobilePane('canvas');
        }
        previousArtboardCount.current = state.artboards.length;
    }, [state.artboards.length]);

    // --- Global Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore shortcuts when typing in inputs/textareas/contenteditable
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            const isMod = e.ctrlKey || e.metaKey;
            if (!isMod) return;

            // Ctrl/Cmd + S → Save Project
            if (e.key === 's') {
                e.preventDefault();
                if (state.currentProjectId) {
                    actions.handleUpdateProjectContent(state.currentProjectId);
                }
            }

            // Ctrl/Cmd + + → Zoom In
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                actions.setScale((s: number) => Math.min(5, s + 0.1));
            }

            // Ctrl/Cmd + - → Zoom Out
            if (e.key === '-') {
                e.preventDefault();
                actions.setScale((s: number) => Math.max(0.1, s - 0.1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.currentProjectId, actions.handleUpdateProjectContent, actions.setScale]);

    // Determine context description for LayoutBuilder
    let currentContextDescription = state.description; // Default to global

    if (state.activePageBuilderId) {
        if (state.activePageBuilderId.startsWith('REGEN_')) {
            // If in regen mode, maybe use the regen prompt or original description?
            // Using current prompt state for now if available, or just global context
            currentContextDescription = state.regenState.prompt || state.description;
        } else if (state.activePageBuilderId !== 'global') {
            // Find specific page
            const targetPage = state.pages.find(p => p.id === state.activePageBuilderId);
            if (targetPage) {
                // Combine Page Name + Description + Global Context
                currentContextDescription = `App: ${state.description}\nPage: ${targetPage.name} - ${targetPage.description}`;
            }
        }
    }

    // Helper to find image URL for Regen Modal
    const getRegenTargetImage = () => {
        if (state.regenState.artboardId) {
            const ab = state.artboards.find(a => a.id === state.regenState.artboardId);
            return ab ? ab.image.url : null;
        }
        return null;
    };

    return (
        <ThemeProvider appearance={state.theme}>
        <div className={`muse-app-shell w-full h-[100dvh] flex flex-col overflow-hidden ${state.theme} text-[var(--gray-12)]`}>
            <AppHeader
                lang={state.lang}
                setLang={actions.setLang}
                theme={state.theme}
                toggleTheme={actions.toggleTheme}
                devMode={state.devMode}
                toggleDevMode={actions.toggleDevMode}
                onOpenGallery={() => actions.setIsGalleryOpen(true)}
                onExportConfig={actions.handleExportConfig}
                onImportConfig={actions.handleImportConfig}

                currentProject={state.currentProjectId ? state.projects.find(p => p.id === state.currentProjectId) : undefined}
                isSaving={state.isSaving}
                onUpdateCurrentProject={() => state.currentProjectId && actions.handleUpdateProjectContent(state.currentProjectId)}
                onRenameProject={(newName) => state.currentProjectId && actions.handleUpdateProjectName(state.currentProjectId, newName)}
                onOpenProjectManager={() => actions.setIsProjectManagerOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden min-h-0 pb-16 md:gap-3 md:p-3 md:pb-3">
                <div className={`${activeMobilePane === 'config' ? 'flex' : 'hidden'} md:flex w-full md:w-auto min-w-0`}>
                    <AppSidebar
                    // Role
                    activeRole={state.activeRole}
                    setActiveRole={actions.setActiveRole}

                    // Skill Mode
                    skillMode={state.skillMode}
                    skillConfig={state.skillConfig}
                    onSkillConfigChange={actions.setSkillConfig}

                    // Props mapping from state
                    lang={state.lang} platform={state.platform} resolution={state.resolution} customSize={state.customSize}
                    description={state.description} pageName={state.pageName} keywords={state.keywords}
                    style={state.style} customStyles={state.customStyles} enableDesignTokens={state.enableDesignTokens}
                    designTokens={state.designTokens} background={state.background} highQuality={state.highQuality} forceChinese={state.forceChinese}
                    promptLanguage={state.promptLanguage} preferredImageApiId={state.preferredImageApiId}
                    designMdId={state.designMdId} setDesignMdId={actions.setDesignMdId} setDesignMdContent={actions.setDesignMdContent}
                    visualStyleId={state.visualStyleId} setVisualStyleId={actions.setVisualStyleId} setVisualStyleContent={actions.setVisualStyleContent}
                    layoutDensityId={state.layoutDensityId} setLayoutDensityId={actions.setLayoutDensityId} setLayoutDensityContent={actions.setLayoutDensityContent}
                    isBatchMode={state.isBatchMode} batchOutputMode={state.batchOutputMode} specMode={state.specMode} pages={state.pages} isAutoGeneratingPages={state.isAutoGeneratingPages}

                    // Media Mode Props
                    mediaAspectRatio={state.mediaAspectRatio}
                    mediaResolution={state.mediaResolution}
                    mediaType={state.mediaType}

                    // New Image Props
                    colorImage={state.colorImage} referenceImages={state.referenceImages} copiedImageBase64={state.copiedImageBase64} layoutImage={state.layoutImage}

                    // Handlers from actions
                    setPlatform={actions.setPlatform} setResolution={actions.setResolution} setCustomSize={actions.setCustomSize}
                    setDescription={actions.setDescription} setPageName={actions.setPageName} setKeywords={actions.setKeywords}
                    setStyle={actions.setStyle} setCustomStyles={actions.setCustomStyles} setEnableDesignTokens={actions.setEnableDesignTokens}
                    setDesignTokens={actions.setDesignTokens} setBackground={actions.setBackground} setHighQuality={actions.setHighQuality} setForceChinese={actions.setForceChinese}
                    setPromptLanguage={actions.setPromptLanguage} setPreferredImageApiId={actions.setPreferredImageApiId}
                    setIsBatchMode={actions.setIsBatchMode} setBatchOutputMode={actions.setBatchOutputMode} setSpecMode={actions.setSpecMode} setPages={actions.setPages}

                    // Media Mode Setters
                    setMediaAspectRatio={actions.setMediaAspectRatio}
                    setMediaResolution={actions.setMediaResolution}
                    setMediaType={actions.setMediaType}

                    // New Setters
                    setColorImage={actions.setColorImage} setReferenceImages={actions.setReferenceImages} setCopiedImageBase64={actions.setCopiedImageBase64}
                    setLayoutImage={actions.setLayoutImage} setLayoutElements={actions.setLayoutElements}

                    onAutoGeneratePages={actions.handleAutoGeneratePages}
                    onOpenPageBuilder={actions.onOpenPageBuilder}
                    onExtractStyle={actions.handleExtractStyle}
                    onAnalyzeLayout={actions.handleAnalyzeLayout}
                    isAnalyzingLayout={state.isAnalyzingLayout}
                    isExtractingStyle={state.isExtractingStyle}
                    onPrepareGeneration={actions.handlePrepareGeneration}
                    isGenerating={state.isGenerating}
                    batchProgress={state.batchProgress}
                    progressValue={state.progressValue}
                    error={state.error}
                    onAddNotification={actions.addNotification}
                    onOpenProjectManager={() => actions.setIsProjectManagerOpen(true)}
                    onAiGenerateDescription={actions.handleAiGenerateDescription}
                    isAiGeneratingDescription={state.isAiGeneratingDescription}
                    />
                </div>

                {/* Main Canvas Area */}
                <div id="main-canvas-area" className={`${activeMobilePane === 'canvas' ? 'flex' : 'hidden'} md:flex flex-1 w-full relative flex-col min-w-0 overflow-hidden border border-[var(--muse-border)] bg-[var(--muse-surface)] shadow-[var(--muse-shadow-soft)] md:rounded-[20px]`}>
                    <CanvasBoard
                        artboards={state.artboards} groups={state.artboardGroups}
                        onSelectArtboard={(id) => actions.handleOpenRegen(id)}
                        onInspectArtboard={(img) => actions.setInspectImage(img)}
                        onMoveArtboard={(id, x, y) => actions.setArtboards(prev => prev.map(ab => ab.id === id ? { ...ab, x, y } : ab))}
                        onDeleteArtboard={(id) => actions.setArtboards(prev => prev.filter(ab => ab.id !== id))}
                        onUploadImage={(file, x, y) => actions.handleCanvasDrop(file, x, y)}
                        onAutoArrange={actions.handleAutoArrange}
                        onRegenerateArtboard={(id) => actions.handleOpenRegen(id)}
                        onUpdateArtboard={(id, updates) => actions.setArtboards(prev => prev.map(ab => ab.id === id ? { ...ab, ...updates } : ab))}
                        lang={state.lang}
                        regeneratingId={state.regeneratingId}
                        devMode={state.devMode}
                        onRequestConfirm={actions.requestConfirm}
                        onDeleteHistoryItem={actions.handleDeleteHistoryItem}
                        onCopyImage={actions.onCopyImage}
                        scale={state.scale}
                        setScale={actions.setScale}
                        position={state.position}
                        setPosition={actions.setPosition}
                    />
                    <button
                        type="button"
                        onClick={() => setActiveMobilePane('config')}
                        className="md:hidden absolute left-1/2 bottom-4 z-30 -translate-x-1/2 rounded-full border border-teal-200 bg-white/95 px-4 py-2 text-xs font-bold text-teal-700 shadow-lg shadow-stone-900/10 backdrop-blur hover:bg-teal-50 dark:border-teal-800 dark:bg-stone-900/95 dark:text-teal-300 dark:hover:bg-stone-800"
                    >
                        {state.lang === 'zh' ? '继续编辑' : 'Continue editing'}
                    </button>
                </div>
            </div>

            <MobileBottomNav
                activePane={activeMobilePane}
                onChange={setActiveMobilePane}
                lang={state.lang}
                artboardCount={state.artboards.length}
            />

            {/* OVERLAYS */}
            <ToastContainer notifications={state.notifications} onClose={actions.removeNotification} />
            <ConfirmationDialog
                isOpen={!!state.confirmDialog}
                title={state.confirmDialog?.title || ''}
                message={state.confirmDialog?.message || ''}
                onConfirm={() => {
                    const cb = state.confirmDialog?.onConfirm;
                    actions.closeConfirm();
                    if (cb) cb();
                }}
                onCancel={actions.closeConfirm}
                lang={state.lang}
            />
            {state.isGalleryOpen && (
                <GalleryManager
                    history={state.history} onUpdateHistory={actions.setHistory} onSelect={() => { }}
                    onAddBatch={(imgs, options) => {
                        const newBoards = imgs.map((img, i) => {
                            // Check if image details has resolution info to prevent whitespace
                            let w = 1000, h = 1000;
                            if (img.details?.resolution) {
                                const parts = img.details.resolution.split('x');
                                if (parts.length === 2) {
                                    const pw = parseInt(parts[0]);
                                    const ph = parseInt(parts[1]);
                                    if (!isNaN(pw) && !isNaN(ph)) {
                                        w = pw;
                                        h = ph;
                                    }
                                }
                            }
                            return {
                                id: `${img.id}-${Date.now()}`,
                                x: 100 + i * 50,
                                y: 100 + i * 50,
                                width: w,
                                height: h,
                                image: img,
                                label: img.prompt
                            };
                        });
                        actions.setArtboards(prev => [...prev, ...newBoards]);
                        if (options?.closeGallery !== false) {
                            actions.setIsGalleryOpen(false);
                        }
                    }}
                    onClose={() => actions.setIsGalleryOpen(false)}
                    lang={state.lang}
                    onAddNotification={actions.addNotification}
                    projects={state.projects}
                    currentProjectId={state.currentProjectId}
                />
            )}

            {state.isBuilderOpen && (
                <div className="fixed inset-0 z-50 bg-white dark:bg-stone-900">
                    <LayoutBuilder
                        device={state.resolution} lang={state.lang} theme={state.theme} contentImages={[]}
                        initialElements={state.activePageBuilderId ? (state.activePageBuilderId.startsWith('REGEN_') ? state.regenState.layoutElements : (state.activePageBuilderId === 'global' ? state.layoutElements : state.pages.find(p => p.id === state.activePageBuilderId)?.layoutElements || [])) : state.layoutElements}
                        contextDescription={currentContextDescription}
                        onAddNotification={actions.addNotification}
                        onSave={(base64, elements) => {
                            if (state.activePageBuilderId) {
                                if (state.activePageBuilderId.startsWith('REGEN_')) actions.setRegenState(prev => ({ ...prev, layoutImage: base64, layoutElements: elements, isOpen: true }));
                                else actions.setPages(state.pages.map(p => p.id === state.activePageBuilderId ? { ...p, layoutImage: base64, layoutElements: elements } : p));
                            } else { actions.setLayoutImage(base64); actions.setLayoutElements(elements); }
                            actions.setIsBuilderOpen(false);
                        }}
                        onCancel={() => { actions.setIsBuilderOpen(false); if (state.activePageBuilderId?.startsWith('REGEN_')) actions.setRegenState(prev => ({ ...prev, isOpen: true })); }}
                    />
                </div>
            )}

            <SpecReviewModal
                specReviewImage={state.specReviewImage} onClose={() => actions.setSpecReviewImage(null)} lang={state.lang}
                specFeedback={state.specFeedback} setSpecFeedback={actions.setSpecFeedback}
                onRefine={() => actions.startBatchGenerationFlow(state.specFeedback)} onConfirm={actions.continueBatchGeneration}
            />

            <RegenModal
                isOpen={state.regenState.isOpen} onClose={() => actions.setRegenState(prev => ({ ...prev, isOpen: false }))} lang={state.lang}
                mode={state.regenState.mode} setMode={(m) => actions.setRegenState(prev => ({ ...prev, mode: m }))}
                prompt={state.regenState.prompt} setPrompt={(s) => actions.setRegenState(prev => ({ ...prev, prompt: s }))}
                referenceImage={state.regenState.referenceImage}
                onReferenceUpload={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => actions.setRegenState(prev => ({ ...prev, referenceImage: ev.target?.result as string }));
                        reader.readAsDataURL(file);
                    }
                }}
                onRemoveReference={() => actions.setRegenState(prev => ({ ...prev, referenceImage: null }))}
                layoutImage={state.regenState.layoutImage}
                onOpenBuilder={() => { actions.setRegenState(prev => ({ ...prev, isOpen: false })); actions.onOpenPageBuilder(`REGEN_${state.regenState.artboardId || 'new'}`); }}
                onRemoveLayout={() => actions.setRegenState(prev => ({ ...prev, layoutImage: null }))}
                onConfirm={(mask) => {
                    if (state.regenState.artboardId) {
                        actions.handleRegenerateArtboard(state.regenState.artboardId, state.regenState.prompt, state.regenState.referenceImage, state.regenState.layoutImage, mask);
                    }
                    actions.setRegenState(prev => ({ ...prev, isOpen: false }));
                }}
                targetImage={getRegenTargetImage()}
            />

            <BatchConfirmationModal batchConfirmation={state.batchConfirmation} setBatchConfirmation={actions.setBatchConfirmation} lang={state.lang} />
            <DevReviewModal reviewData={state.reviewData} onClose={() => actions.setReviewData(null)} />

            <ImageDetailsModal image={state.inspectImage} onClose={() => actions.setInspectImage(null)} lang={state.lang} />

            <ProjectManagerModal
                isOpen={state.isProjectManagerOpen}
                onClose={() => actions.setIsProjectManagerOpen(false)}
                projects={state.projects}
                onSaveProject={actions.handleSaveProject}
                onCreateBlankProject={actions.handleCreateBlankProject}
                onUpdateProjectName={actions.handleUpdateProjectName}
                onUpdateProjectContent={actions.handleUpdateProjectContent}
                onLoadProject={actions.handleLoadProject}
                onDeleteProject={actions.handleDeleteProject}
                currentProjectId={state.currentProjectId}
                lang={state.lang}
                onRequestConfirm={actions.requestConfirm}
            />

            {isChangelogOpen && (
                <ChangelogModal lang={state.lang} onClose={() => setIsChangelogOpen(false)} />
            )}

            {showFirstUseTips && (
                <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={closeFirstUseTips}>
                    <Card className="w-full max-w-md p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="mb-5">
                            <Heading size="4" as="h2">
                                {state.lang === 'zh' ? '开始使用' : 'Getting Started'}
                            </Heading>
                            <Text as="p" size="2" color="gray" mt="1">
                                {state.lang === 'zh'
                                    ? '按这三步走，第一次生成会更顺。'
                                    : 'Follow these three steps for a smoother first run.'}
                            </Text>
                        </div>
                        <div className="space-y-3">
                            {[
                                state.lang === 'zh' ? '配置 API：打开右上角 API，填入 Key、Base URL 和模型。' : 'Configure API: open API settings, then enter the key, Base URL, and models.',
                                state.lang === 'zh' ? '填写提示词：在配置页写清楚主题、场景和想要的风格。' : 'Write the prompt: describe the subject, scenario, and desired style.',
                                state.lang === 'zh' ? '生成并检查画布：生成后会自动切到画布，可点“继续编辑”返回配置。' : 'Generate and check canvas: after generation, review the canvas and tap Continue editing when needed.',
                            ].map((tip, index) => (
                                <Card key={tip}>
                                    <div className="flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-full bg-[var(--accent-9)] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        {index + 1}
                                    </span>
                                    <Text as="p" size="2" className="leading-relaxed">{tip}</Text>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={closeFirstUseTips} color="ruby">
                                {state.lang === 'zh' ? '知道了' : 'Got it'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Global Loading Overlay */}
            {state.isLoadingProject && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center flex-col gap-4 text-white">
                    <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-bold text-lg">{state.lang === 'zh' ? '正在加载项目...' : 'Loading Project...'}</span>
                </div>
            )}
        </div>
        </ThemeProvider>
    );
};

export default MainApp;
