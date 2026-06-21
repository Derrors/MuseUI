
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GeneratedImage, LangType, Project } from '../types';
import { I18N } from '../constants';
import DesignSpecRenderer from './DesignSpecRenderer';
import JSZip from 'jszip';
import { getHistoryPaginated, saveImageToHistory } from '../services/idbHistoryService';
import { storeImageAsset } from '../services/imageAssetService';
import {
    buildStickerZipBlob,
    getStickerDownloadItems,
    isStickerImage,
    repairStickerTransparency,
    splitStickerCollectionByGridDetailed,
    splitStickerCollectionDetailed,
    stickerItemToGeneratedImage,
    withStickerCollectionItems,
    withStickerMetadata,
} from '../domain/stickers';
import type { StickerAssetItem } from '../types';

type GalleryAddOptions = { closeGallery?: boolean };
type StickerOperation = 'repair' | 'auto-split' | 'grid-split' | 'zip';
import { Badge, Button, Card, DialogShell, Flex, IconButton, SelectField, Text, TextFieldControl } from './ui';

interface Props {
    history: GeneratedImage[];
    onUpdateHistory: (newHistory: GeneratedImage[]) => void;
    onSelect: (image: GeneratedImage) => void;
    onAddBatch: (images: GeneratedImage[], options?: GalleryAddOptions) => void;
    onClose: () => void; // Function to close the overlay
    lang: LangType;
    onAddNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
    projects: Project[];
    currentProjectId: string | null;
}

const GalleryManager: React.FC<Props> = ({ history, onUpdateHistory, onSelect, onAddBatch, onClose, lang, onAddNotification, projects, currentProjectId }) => {
    const t = I18N[lang];
    const [filterPlatform, setFilterPlatform] = useState<string>('all');
    const [filterStyle, setFilterStyle] = useState<string>('all');
    const [filterProjectId, setFilterProjectId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Stitching State
    const [isStitching, setIsStitching] = useState(false);
    const [stitchConfig, setStitchConfig] = useState<{ mode: 'grid' | 'horizontal' | 'vertical', cols: number }>({ mode: 'grid', cols: 4 });
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [zoomedImage, setZoomedImage] = useState<GeneratedImage | null>(null);
    const [processingStickerId, setProcessingStickerId] = useState<string | null>(null);
    const [stickerOperation, setStickerOperation] = useState<StickerOperation | null>(null);
    const [lastSplitResult, setLastSplitResult] = useState<{ imageId: string; itemIds: string[]; count: number; method: 'auto' | 'manual' } | null>(null);
    const [gridSplit, setGridSplit] = useState({ rows: 2, columns: 3 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Pagination state
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [localHistory, setLocalHistory] = useState<GeneratedImage[]>([]);

    // Load initial history on mount
    useEffect(() => {
        const loadInitialHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const response = await getHistoryPaginated(1, 20);
                setLocalHistory(response.items);
                setHasMore(response.hasMore);
                setCurrentPage(1);
                onUpdateHistory(response.items); // Update parent state
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadInitialHistory();
    }, []);

    // Load more on scroll
    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container || isLoadingMore || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 500) { // Trigger 500px before bottom
            loadMore();
        }
    };

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const response = await getHistoryPaginated(nextPage, 20);
            const newHistory = [...localHistory, ...response.items];
            setLocalHistory(newHistory);
            setHasMore(response.hasMore);
            setCurrentPage(nextPage);
            onUpdateHistory(newHistory); // Update parent state
        } catch (error) {
            console.error('Failed to load more:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [isLoadingMore, hasMore, currentPage, localHistory]);

    // Close zoom on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (zoomedImage) setZoomedImage(null);
                else onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [zoomedImage, onClose]);

    // Helper to safely get style name
    const getStyleName = (style: any): string => {
        if (!style) return '';
        if (typeof style === 'string') return style;
        // Check if it's the UIStyle object
        if (typeof style === 'object' && style.name) return style.name;
        return 'Unknown';
    };

    // Derived filters
    const platforms = useMemo(() => Array.from(new Set(history.map(img => img.details?.platform).filter(Boolean))), [history]);
    const styles = useMemo(() => Array.from(new Set(history.map(img => getStyleName(img.details?.style)).filter(Boolean))), [history]);

    const [expandedBatches, setExpandedBatches] = useState<string[]>([]);

    const filteredImages = useMemo(() => {
        return history.filter(img => {
            const matchPlatform = filterPlatform === 'all'
                || (filterPlatform === 'stickers' && isStickerImage(img))
                || img.details?.platform === filterPlatform;
            const imgStyle = getStyleName(img.details?.style);
            const matchStyle = filterStyle === 'all' || imgStyle === filterStyle;
            const matchProject = filterProjectId === 'all'
                || (filterProjectId === 'unassigned' && !img.details?.projectId)
                || img.details?.projectId === filterProjectId;
            const matchSearch = !searchTerm || img.prompt.toLowerCase().includes(searchTerm.toLowerCase());
            return matchPlatform && matchStyle && matchProject && matchSearch;
        });
    }, [history, filterPlatform, filterStyle, filterProjectId, searchTerm]);

    const displayImages = useMemo(() => {
        const result: { item: GeneratedImage, isStack: boolean, count: number, batchId?: string, isExpandedBlock?: boolean, batchItems?: GeneratedImage[] }[] = [];
        const processedBatches = new Set<string>();

        filteredImages.forEach(img => {
            const batchId = img.details?.batchId;

            if (!batchId) {
                result.push({ item: img, isStack: false, count: 1 });
                return;
            }

            if (processedBatches.has(batchId)) return;

            const batchInFilter = filteredImages.filter(i => i.details?.batchId === batchId);

            if (batchInFilter.length <= 1) {
                result.push({ item: img, isStack: false, count: 1 });
            } else {
                if (expandedBatches.includes(batchId)) {
                    // Expanded: Render as a single block containing all items
                    result.push({ item: batchInFilter[0], isStack: false, count: batchInFilter.length, batchId, isExpandedBlock: true, batchItems: batchInFilter });
                } else {
                    result.push({ item: batchInFilter[0], isStack: true, count: batchInFilter.length, batchId });
                }
            }
            processedBatches.add(batchId);
        });

        return result;
    }, [filteredImages, expandedBatches]);

    const toggleBatchExpand = (e: React.MouseEvent, batchId: string) => {
        e.stopPropagation();
        setExpandedBatches(prev => prev.includes(batchId) ? prev.filter(b => b !== batchId) : [...prev, batchId]);
    };



    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };



    const handleBatchDelete = () => {
        const newHistory = history.filter(img => !selectedIds.includes(img.id));
        onUpdateHistory(newHistory);
        setSelectedIds([]);
        setIsSelectMode(false);
    };

    const handleBatchDownload = async () => {
        if (selectedIds.length === 0) return;

        const zip = new JSZip();
        let count = 0;

        for (const id of selectedIds) {
            const img = history.find(i => i.id === id);
            if (img && img.url) {
                const files = isStickerImage(img)
                    ? getStickerDownloadItems(img)
                    : [{ filename: `muse-ui-${id}.png`, url: img.url }];
                for (const file of files) {
                    const base64Data = file.url.split(',')[1];
                    if (!base64Data) continue;
                    zip.file(`${id}-${file.filename}`, base64Data, { base64: true });
                    count++;
                }
            }
        }

        if (count > 0) {
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `muse-ui-batch-${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }

        setSelectedIds([]);
        setIsSelectMode(false);
    };

    const handleBatchAdd = () => {
        const selected = history.filter(img => selectedIds.includes(img.id));
        if (selected.length > 0) {
            onAddBatch(selected);
            setSelectedIds([]);
            setIsSelectMode(false);
        }
    };

    // Stitch Logic
    const handleStitch = async () => {
        if (selectedIds.length === 0) return;
        setIsStitching(true);
        const imagesToProcess = history.filter(img => selectedIds.includes(img.id));

        // Sort by selection order
        const sortedImages = imagesToProcess.sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));

        const count = sortedImages.length;
        let cols = stitchConfig.cols;
        if (stitchConfig.mode === 'horizontal') cols = count;
        if (stitchConfig.mode === 'vertical') cols = 1;

        cols = Math.max(1, cols);
        const rows = Math.ceil(count / cols);

        const gap = 40;
        const padding = 60;

        const loadedImages = await Promise.all(sortedImages.map(img => {
            return new Promise<{ el: HTMLImageElement, w: number, h: number }>((resolve) => {
                const image = new Image();
                image.crossOrigin = "Anonymous";
                image.onload = () => resolve({ el: image, w: image.width, h: image.height });
                image.src = img.url;
            });
        }));

        if (loadedImages.length === 0) { setIsStitching(false); return; }

        const maxW = Math.max(...loadedImages.map(i => i.w));
        const maxH = Math.max(...loadedImages.map(i => i.h));

        const canvas = document.createElement('canvas');
        canvas.width = (maxW * cols) + (gap * (cols - 1)) + (padding * 2);
        canvas.height = (maxH * rows) + (gap * (rows - 1)) + (padding * 2);

        const ctx = canvas.getContext('2d');
        if (!ctx) { setIsStitching(false); return; }

        ctx.fillStyle = '#f5f5f4'; // Stone 100
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        loadedImages.forEach((imgObj, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;

            const x = padding + col * (maxW + gap);
            const y = padding + row * (maxH + gap);

            const xOffset = (maxW - imgObj.w) / 2;
            const yOffset = (maxH - imgObj.h) / 2;

            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;

            ctx.drawImage(imgObj.el, x + xOffset, y + yOffset, imgObj.w, imgObj.h);
        });

        const stitchedDataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = stitchedDataUrl;
        link.download = `stitch-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsStitching(false);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const promises = files.map((file: File) => new Promise<GeneratedImage>((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const newImg: GeneratedImage = {
                            id: `imported-${Date.now()}-${Math.random()}`,
                            url: ev.target?.result as string,
                            prompt: file.name,
                            timestamp: Date.now(),
                            details: {
                                platform: 'Imported',
                                resolution: `${img.width}x${img.height}`,
                                style: 'Imported',
                                tokens: {} as any,
                                fullPrompt: 'Imported from Gallery',
                                batchId: `import-${Date.now()}`
                            }
                        };
                        resolve(newImg);
                    };
                    img.src = ev.target?.result as string;
                };
                reader.readAsDataURL(file);
            }));

            Promise.all(promises).then(async (newImages) => {
                const savedImages = await Promise.all(newImages.map(image => saveImageToHistory(image)));
                onUpdateHistory([...savedImages, ...history]);
            });
        }
    };

    const notify = (message: string, type: 'success' | 'error' | 'info') => {
        onAddNotification?.(message, type);
    };

    const updateGalleryImage = async (updated: GeneratedImage) => {
        const saved = await saveImageToHistory(updated);
        const replace = (items: GeneratedImage[]) => items.map(img => img.id === updated.id ? saved : img);
        const nextHistory = replace(history);
        const nextLocalHistory = replace(localHistory);
        setLocalHistory(nextLocalHistory);
        onUpdateHistory(nextHistory);
        setZoomedImage(prev => prev?.id === updated.id ? saved : prev);
    };

    const persistStickerItems = async (items: StickerAssetItem[]): Promise<StickerAssetItem[]> => (
        Promise.all(items.map(async item => {
            if (item.imageId) return item;
            const asset = await storeImageAsset(item.url, 'sticker');
            return { ...item, imageId: asset.id };
        }))
    );

    const handleRepairZoomedSticker = async () => {
        if (!zoomedImage || !isStickerImage(zoomedImage)) return;
        setProcessingStickerId(zoomedImage.id);
        setStickerOperation('repair');
        try {
            const sticker = zoomedImage.details!.sticker!;
            const repaired = await repairStickerTransparency(zoomedImage.url, {
                backgroundColor: sticker.backgroundColor ?? 'white',
            });
            const updated = withStickerMetadata({
                ...zoomedImage,
                url: repaired.url,
            }, {
                ...sticker,
                backgroundRemoved: repaired.backgroundRemoved || sticker.backgroundRemoved,
                error: repaired.reason && !repaired.changed ? undefined : sticker.error,
            });
            await updateGalleryImage(updated);
            notify(
                repaired.changed
                    ? (lang === 'zh' ? '透明背景已修复' : 'Transparency repaired')
                    : (lang === 'zh' ? '图片已是透明背景' : 'Image is already transparent'),
                'success',
            );
        } catch (err: any) {
            notify(err?.message || (lang === 'zh' ? '透明修复失败' : 'Transparency repair failed'), 'error');
        } finally {
            setProcessingStickerId(null);
            setStickerOperation(null);
        }
    };

    const handleAutoSplitZoomedSticker = async () => {
        if (!zoomedImage || !isStickerImage(zoomedImage)) return;
        setProcessingStickerId(zoomedImage.id);
        setStickerOperation('auto-split');
        try {
            const result = await splitStickerCollectionDetailed(zoomedImage.url);
            if (result.items.length === 0) {
                throw new Error(lang === 'zh' ? '没有检测到可拆分的贴纸' : 'No separable stickers detected');
            }
            const items = await persistStickerItems(result.items);
            const updated = withStickerCollectionItems(zoomedImage, items, 'auto');
            await updateGalleryImage(updated);
            setLastSplitResult({ imageId: updated.id, itemIds: items.map(item => item.id), count: items.length, method: 'auto' });
            notify(lang === 'zh' ? `已拆分 ${items.length} 个贴纸` : `Split ${items.length} stickers`, 'success');
        } catch (err: any) {
            notify(err?.message || (lang === 'zh' ? '自动拆分失败' : 'Auto split failed'), 'error');
        } finally {
            setProcessingStickerId(null);
            setStickerOperation(null);
        }
    };

    const handleGridSplitZoomedSticker = async () => {
        if (!zoomedImage || !isStickerImage(zoomedImage)) return;
        setProcessingStickerId(zoomedImage.id);
        setStickerOperation('grid-split');
        try {
            const result = await splitStickerCollectionByGridDetailed(zoomedImage.url, gridSplit.rows, gridSplit.columns);
            const items = await persistStickerItems(result.items);
            const updated = withStickerCollectionItems(zoomedImage, items, 'manual');
            await updateGalleryImage(updated);
            setLastSplitResult({ imageId: updated.id, itemIds: items.map(item => item.id), count: items.length, method: 'manual' });
            notify(lang === 'zh' ? `已按网格拆分 ${items.length} 个贴纸` : `Grid split ${items.length} stickers`, 'success');
        } catch (err: any) {
            notify(err?.message || (lang === 'zh' ? '网格拆分失败' : 'Grid split failed'), 'error');
        } finally {
            setProcessingStickerId(null);
            setStickerOperation(null);
        }
    };

    const handleStickerZipDownload = async () => {
        if (!zoomedImage || !isStickerImage(zoomedImage)) return;
        setProcessingStickerId(zoomedImage.id);
        setStickerOperation('zip');
        try {
            const blob = await buildStickerZipBlob(zoomedImage);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `sticker-assets-${zoomedImage.id}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err: any) {
            notify(err?.message || (lang === 'zh' ? 'ZIP 下载失败' : 'ZIP download failed'), 'error');
        } finally {
            setProcessingStickerId(null);
            setStickerOperation(null);
        }
    };

    const handleAddStickerItem = (item: StickerAssetItem) => {
        if (!zoomedImage) return;
        onAddBatch([stickerItemToGeneratedImage(zoomedImage, item)], { closeGallery: false });
        notify(lang === 'zh' ? '子贴纸已加入画布' : 'Sticker item added to canvas', 'success');
    };

    const handleDownloadStickerItem = (item: StickerAssetItem) => {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = `${item.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isStickerActionRunning = (operation: StickerOperation) => (
        Boolean(zoomedImage && processingStickerId === zoomedImage.id && stickerOperation === operation)
    );

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--gray-1)]/95 text-[var(--gray-12)] backdrop-blur-md animate-in fade-in duration-300">

            {/* Top Bar: Filters & Controls */}
            <div className="flex flex-col gap-3 border-b border-[var(--gray-5)] bg-[var(--color-panel-solid)] px-3 py-3 shadow-sm sm:px-6 sm:py-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                <div className="flex w-full lg:w-auto flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                    <Flex align="center" gap="2">
                        <Text size="5" weight="bold">{t.gallery}</Text>
                        <Badge color="ruby" variant="soft">{filteredImages.length}</Badge>
                    </Flex>
                    <div className="hidden lg:block h-6 w-px bg-[var(--gray-5)] mx-2"></div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2">
                        <SelectField
                            value={filterPlatform}
                            onValueChange={setFilterPlatform}
                            options={[
                                { value: 'all', label: `${t.platform}: ${t.all}` },
                                { value: 'stickers', label: lang === 'zh' ? '贴纸资产' : 'Stickers' },
                                ...platforms.map(p => ({ value: p as string, label: p as string })),
                            ]}
                        />
                        <SelectField
                            value={filterProjectId}
                            onValueChange={setFilterProjectId}
                            options={[
                                { value: 'all', label: lang === 'zh' ? '所有项目' : 'All Projects' },
                                { value: 'unassigned', label: lang === 'zh' ? '未分配' : 'Unassigned' },
                                ...projects.map(p => ({ value: p.id, label: p.name })),
                            ]}
                        />
                        <SelectField
                            value={filterStyle}
                            onValueChange={setFilterStyle}
                            options={[
                                { value: 'all', label: `${t.designStyle}: ${t.all}` },
                                ...styles.map(s => ({ value: s as string, label: s as string })),
                            ]}
                        />
                        <TextFieldControl
                            placeholder={t.searchPrompt}
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            className="w-full lg:w-48"
                        />
                    </div>
                </div>

                <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-3">
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="soft"
                        color="ruby"
                        iconName="upload"
                    >
                        {lang === 'zh' ? '导入图片' : 'Import'}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        hidden
                        multiple
                        accept="image/*"
                        onChange={handleImport}
                    />

                    <Button
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            setSelectedIds([]);
                        }}
                        variant={isSelectMode ? 'solid' : 'soft'}
                        color={isSelectMode ? 'ruby' : 'gray'}
                    >
                        {isSelectMode ? t.cancel : t.selectMode}
                    </Button>

                    <IconButton
                        onClick={onClose}
                        iconName="x"
                        label={lang === 'zh' ? '关闭图库' : 'Close gallery'}
                        variant="soft"
                        color="gray"
                    />
                </div>
            </div>

            {/* Masonry Grid Content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <svg className="animate-spin h-12 w-12 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-stone-500">{lang === 'zh' ? '加载中...' : 'Loading...'}</p>
                    </div>
                ) : displayImages.length > 0 ? (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
                        {displayImages.map(({ item: img, isStack, count, batchId, isExpandedBlock, batchItems }) => (
                            <div
                                key={img.id}
                                className={`relative break-inside-avoid mb-6 rounded-xl overflow-hidden shadow-md transition-all duration-300 group ${isExpandedBlock
                                    ? 'bg-stone-100 dark:bg-stone-800 p-2 ring-1 ring-stone-300 dark:ring-stone-600' // Block style
                                    : 'bg-stone-200 dark:bg-stone-900 group hover:shadow-xl hover:-translate-y-1' // Card style
                                    } ${isSelectMode && selectedIds.includes(img.id) && !isExpandedBlock ? 'ring-4 ring-teal-500 opacity-90' : ''}`}
                                onClick={() => {
                                    if (isExpandedBlock) return;
                                    if (isSelectMode) toggleSelection(img.id);
                                    else if (isStack && batchId) toggleBatchExpand({ stopPropagation: () => { } } as any, batchId);
                                    else setZoomedImage(img);
                                }}
                            >
                                {isExpandedBlock && batchItems ? (
                                    // EXPANDED BATCH BLOCK VIEW
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center px-2 py-1 border-b border-stone-200 dark:border-stone-700 mb-1">
                                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                                {lang === 'zh' ? '分组' : 'Group'} ({count})
                                            </span>
                                            <button
                                                onClick={(e) => toggleBatchExpand(e, batchId!)}
                                                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                                                title={lang === 'zh' ? '折叠' : 'Collapse'}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {batchItems.map(bImg => (
                                                <div
                                                    key={bImg.id}
                                                    className={`relative rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer ${isSelectMode && selectedIds.includes(bImg.id) ? 'ring-2 ring-teal-500' : ''}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (isSelectMode) toggleSelection(bImg.id);
                                                        else setZoomedImage(bImg);
                                                    }}
                                                >
                                                    <img src={bImg.url} className="w-full h-auto object-cover block" loading="lazy" />
                                                    {/* Selection Checkbox */}
                                                    {isSelectMode && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white bg-black/40 flex items-center justify-center">
                                                            {selectedIds.includes(bImg.id) && <div className="w-3 h-3 bg-teal-500 rounded-full"></div>}
                                                        </div>
                                                    )}
                                                    {/* Hover Info */}
                                                    {!isSelectMode && (
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                                                            <p className="text-[10px] text-white truncate">{bImg.prompt}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-full relative bg-white">
                                            {img.details?.designSystem ? (
                                                <div className="w-full aspect-[3/4] overflow-hidden transform scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none">
                                                    <DesignSpecRenderer designSystem={img.details.designSystem} lang={lang} />
                                                </div>
                                            ) : (
                                                <img src={img.url} alt="gallery" loading="lazy" className="w-full h-auto object-cover block" />
                                            )}
                                        </div>

                                        {/* Stack Indicator */}
                                        {isStack && batchId && (
                                            <div
                                                className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full cursor-pointer hover:bg-black/80 transition-colors"
                                                onClick={(e) => toggleBatchExpand(e, batchId)}
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                <span>{count}</span>
                                            </div>
                                        )}

                                        {/* Select Checkbox */}
                                        {isSelectMode && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white bg-black/40 flex items-center justify-center transition-colors z-20">
                                                {selectedIds.includes(img.id) && <div className="w-4 h-4 bg-teal-500 rounded-full"></div>}
                                            </div>
                                        )}

                                        {!isSelectMode && !isStack && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-20 pointer-events-none">
                                                <p className="text-white text-xs font-bold line-clamp-1">{img.details?.resolution}</p>
                                                <p className="text-stone-300 text-[10px] line-clamp-2 mt-1">{img.prompt}</p>
                                            </div>
                                        )}

                                        {/* Type Badge */}
                                        {img.details?.isDesignSpec && (
                                            <div className="absolute top-2 right-2 bg-cyan-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow z-10">SPEC</div>
                                        )}

                                        {isStickerImage(img) && (
                                            <div className="absolute bottom-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow z-10">
                                                {img.details?.sticker?.isCollection ? (lang === 'zh' ? '贴纸集合' : 'SHEET') : (lang === 'zh' ? '贴纸' : 'STICKER')}
                                            </div>
                                        )}

                                        {/* Visual Stacking Effect at bottom if isStack */}
                                        {isStack && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-400/50 dark:bg-stone-700/50 backdrop-blur-sm mx-2 rounded-t-sm block translate-y-1"></div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-stone-400">
                        <span className="text-4xl mb-4">🔍</span>
                        <p>{lang === 'zh' ? '没有找到图片' : 'No images found'}</p>
                    </div>
                )}

                {isLoadingMore && (
                    <div className="flex justify-center items-center py-8">
                        <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3 text-stone-500">{lang === 'zh' ? '加载更多...' : 'Loading more...'}</span>
                    </div>
                )}

                {!isLoadingHistory && !hasMore && displayImages.length > 0 && (
                    <div className="text-center py-8 text-stone-400 text-sm">
                        {lang === 'zh' ? '已加载全部内容' : 'All content loaded'}
                    </div>
                )}
            </div>

            {/* Bottom Action Bar (Select Mode) */}
            {isSelectMode && (
                <div className="z-50 flex flex-col items-stretch gap-3 border-t border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4 shadow-lg animate-in slide-in-from-bottom-10 sm:flex-row sm:items-center sm:justify-center">
                    <Text size="2" weight="bold" className="mr-2">
                        {selectedIds.length} {t.selected}
                    </Text>

                    {/* Stitch Controls */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                        <div className="flex bg-white dark:bg-stone-800 rounded p-1 shadow-sm">
                            <button title="Grid" onClick={() => setStitchConfig({ ...stitchConfig, mode: 'grid' })} className={`p-1.5 rounded ${stitchConfig.mode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-stone-400 hover:text-stone-600'}`}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            </button>
                            <button title="Horizontal" onClick={() => setStitchConfig({ ...stitchConfig, mode: 'horizontal' })} className={`p-1.5 rounded ${stitchConfig.mode === 'horizontal' ? 'bg-teal-100 text-teal-600' : 'text-stone-400 hover:text-stone-600'}`}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /></svg>
                            </button>
                            <button title="Vertical" onClick={() => setStitchConfig({ ...stitchConfig, mode: 'vertical' })} className={`p-1.5 rounded ${stitchConfig.mode === 'vertical' ? 'bg-teal-100 text-teal-600' : 'text-stone-400 hover:text-stone-600'}`}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /></svg>
                            </button>
                        </div>
                        {stitchConfig.mode === 'grid' && (
                            <input
                                type="number" min="1" max="10"
                                value={stitchConfig.cols} onChange={(e) => setStitchConfig({ ...stitchConfig, cols: parseInt(e.target.value) || 1 })}
                                className="w-12 text-sm p-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-center focus:ring-1 focus:ring-teal-500 outline-none"
                                title="Columns"
                            />
                        )}
                        <Button
                            onClick={handleStitch}
                            disabled={selectedIds.length === 0 || isStitching}
                            size="1"
                            variant="soft"
                            color="ruby"
                            iconName={isStitching ? 'loader' : 'grid'}
                            className={isStitching ? 'animate-pulse' : undefined}
                        >
                            {lang === 'zh' ? '拼图' : 'Stitch'}
                        </Button>
                    </div>

                    <div className="hidden h-6 w-px bg-[var(--gray-5)] sm:block"></div>

                    <Button
                        onClick={handleBatchAdd}
                        disabled={selectedIds.length === 0}
                        color="ruby"
                        variant="soft"
                        iconName="plus"
                    >
                        {lang === 'zh' ? '添加到画布' : 'Add to Canvas'}
                    </Button>
                    <Button
                        onClick={handleBatchDelete}
                        disabled={selectedIds.length === 0}
                        color="red"
                        variant="soft"
                        iconName="trash"
                    >
                        {t.deleteSelected}
                    </Button>
                    <Button
                        onClick={handleBatchDownload}
                        disabled={selectedIds.length === 0}
                        color="gray"
                        iconName="download"
                    >
                        {t.downloadSelected}
                    </Button>
                </div>
            )}

            {/* Lightbox / Zoom View */}
            {zoomedImage && (
                <DialogShell
                    open={!!zoomedImage}
                    onOpenChange={(open) => { if (!open) setZoomedImage(null); }}
                    title={lang === 'zh' ? '设计详情' : 'Design Details'}
                    description={zoomedImage.prompt}
                    size="full"
                    closeLabel={lang === 'zh' ? '关闭设计详情' : 'Close design details'}
                >
                    <div className="flex max-h-[calc(100dvh-190px)] flex-col overflow-hidden rounded-xl border border-[var(--gray-5)] bg-[var(--gray-2)] md:flex-row">
                        {/* Image Area */}
                        <div className="flex flex-1 items-center justify-center overflow-auto bg-black p-4">
                            {zoomedImage.details?.designSystem ? (
                                <div className="w-full h-full bg-white overflow-auto rounded shadow-lg">
                                    <DesignSpecRenderer designSystem={zoomedImage.details.designSystem} lang={lang} />
                                </div>
                            ) : (
                                <img
                                    src={zoomedImage.url}
                                    className="max-w-full max-h-[85vh] object-contain rounded shadow-lg"
                                    alt="Zoomed"
                                />
                            )}
                        </div>

                        {/* Sidebar Info */}
                        <div className="flex w-full flex-col border-t border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-6 md:w-80 md:border-l md:border-t-0">
                            <div className="space-y-4 text-sm flex-1 overflow-y-auto">
                                <div>
                                    <Text as="span" size="1" color="gray">{lang === 'zh' ? '设备' : 'Device'}</Text>
                                    <Text as="p" size="2">{zoomedImage.details?.resolution}</Text>
                                </div>
                                <div>
                                    <Text as="span" size="1" color="gray">{lang === 'zh' ? '风格' : 'Style'}</Text>
                                    <Text as="p" size="2">{getStyleName(zoomedImage.details?.style)}</Text>
                                </div>
                                <div>
                                    <Text as="span" size="1" color="gray">{lang === 'zh' ? '提示词' : 'Prompt'}</Text>
                                    <p className="text-xs italic leading-relaxed text-[var(--gray-11)]">
                                        {zoomedImage.prompt}
                                    </p>
                                </div>

                                {isStickerImage(zoomedImage) && (
                                    <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3 space-y-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-1 rounded bg-teal-500/15 text-teal-300 text-[10px] font-bold">
                                                {zoomedImage.details?.sticker?.layoutMode}
                                            </span>
                                            {zoomedImage.details?.sticker?.transparentWorkflow && (
                                                <span className="px-2 py-1 rounded bg-sky-500/15 text-sky-300 text-[10px] font-bold">
                                                    {zoomedImage.details?.sticker?.backgroundRemoved ? (lang === 'zh' ? '已透明' : 'Transparent') : (lang === 'zh' ? '待修复' : 'Needs Alpha')}
                                                </span>
                                            )}
                                            {zoomedImage.details?.sticker?.hasStickerBorder && (
                                                <span className="px-2 py-1 rounded bg-white/10 text-white text-[10px] font-bold">
                                                    {lang === 'zh' ? '白边' : 'Border'}
                                                </span>
                                            )}
                                            {zoomedImage.details?.sticker?.hasText && (
                                                <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold">
                                                    {lang === 'zh' ? '文字' : 'Text'}
                                                </span>
                                            )}
                                            {zoomedImage.details?.sticker?.hasReferenceImage && (
                                                <span className="px-2 py-1 rounded bg-purple-500/15 text-purple-300 text-[10px] font-bold">
                                                    {lang === 'zh' ? '参考图' : 'Ref'}
                                                </span>
                                            )}
                                        </div>

                                        {zoomedImage.details?.sticker?.error && (
                                            <p className="text-[11px] text-red-300 leading-relaxed">{zoomedImage.details.sticker.error}</p>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={handleRepairZoomedSticker}
                                                disabled={processingStickerId === zoomedImage.id}
                                                className="px-3 py-2 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-200 hover:bg-sky-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                {isStickerActionRunning('repair') && <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
                                                {isStickerActionRunning('repair') ? (lang === 'zh' ? '修复中' : 'Repairing') : (lang === 'zh' ? '修复透明' : 'Repair Alpha')}
                                            </button>
                                            <button
                                                onClick={handleAutoSplitZoomedSticker}
                                                disabled={processingStickerId === zoomedImage.id}
                                                className="px-3 py-2 rounded-lg text-xs font-bold bg-teal-500/15 text-teal-200 hover:bg-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                {isStickerActionRunning('auto-split') && <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
                                                {isStickerActionRunning('auto-split') ? (lang === 'zh' ? '拆分中' : 'Splitting') : (lang === 'zh' ? '自动拆分' : 'Auto Split')}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={8}
                                                value={gridSplit.rows}
                                                onChange={(e) => setGridSplit(prev => ({ ...prev, rows: Number(e.target.value) || 1 }))}
                                                className="px-2 py-2 text-xs rounded-lg border border-stone-700 bg-stone-900 text-stone-200"
                                                aria-label={lang === 'zh' ? '行数' : 'Rows'}
                                            />
                                            <input
                                                type="number"
                                                min={1}
                                                max={8}
                                                value={gridSplit.columns}
                                                onChange={(e) => setGridSplit(prev => ({ ...prev, columns: Number(e.target.value) || 1 }))}
                                                className="px-2 py-2 text-xs rounded-lg border border-stone-700 bg-stone-900 text-stone-200"
                                                aria-label={lang === 'zh' ? '列数' : 'Columns'}
                                            />
                                            <button
                                                onClick={handleGridSplitZoomedSticker}
                                                disabled={processingStickerId === zoomedImage.id}
                                                className="px-3 py-2 rounded-lg text-xs font-bold bg-stone-800 text-stone-200 hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                {isStickerActionRunning('grid-split') && <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
                                                {isStickerActionRunning('grid-split') ? (lang === 'zh' ? '拆分中' : 'Splitting') : (lang === 'zh' ? '网格' : 'Grid')}
                                            </button>
                                        </div>

                                        {(zoomedImage.details?.sticker?.collectionItems?.length ?? 0) > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-stone-400 uppercase">
                                                        {lang === 'zh' ? '子贴纸' : 'Items'} ({zoomedImage.details?.sticker?.collectionItems?.length})
                                                    </span>
                                                    <button
                                                        onClick={handleStickerZipDownload}
                                                        disabled={processingStickerId === zoomedImage.id}
                                                        className="text-[11px] font-bold text-teal-300 hover:text-teal-200 disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {isStickerActionRunning('zip') && <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
                                                        {isStickerActionRunning('zip') ? (lang === 'zh' ? '打包中' : 'Zipping') : 'ZIP'}
                                                    </button>
                                                </div>
                                                {lastSplitResult?.imageId === zoomedImage.id && (
                                                    <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-1 text-[11px] font-bold text-teal-200">
                                                        {lang === 'zh'
                                                            ? `刚新增 ${lastSplitResult.count} 个子贴纸`
                                                            : `${lastSplitResult.count} new items added`}
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                                                    {zoomedImage.details?.sticker?.collectionItems?.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className={`rounded-lg border bg-stone-900 overflow-hidden transition-all ${
                                                                lastSplitResult?.imageId === zoomedImage.id && lastSplitResult.itemIds.includes(item.id)
                                                                    ? 'border-teal-400 ring-2 ring-teal-400/30'
                                                                    : 'border-stone-800'
                                                            }`}
                                                        >
                                                            <img src={item.url} alt="" className="w-full aspect-square object-contain bg-black/30" />
                                                            <div className="grid grid-cols-2 gap-1 p-1">
                                                                <button
                                                                    onClick={() => handleAddStickerItem(item)}
                                                                    className="px-2 py-1.5 rounded text-[10px] font-bold bg-white text-black hover:bg-stone-200"
                                                                >
                                                                    {lang === 'zh' ? '画布' : 'Canvas'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadStickerItem(item)}
                                                                    className="px-2 py-1.5 rounded text-[10px] font-bold bg-stone-800 text-stone-200 hover:bg-stone-700"
                                                                >
                                                                    PNG
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <Button
                                    onClick={() => {
                                        onAddBatch([zoomedImage]);
                                        setZoomedImage(null);
                                        onClose();
                                    }}
                                    color="ruby"
                                    iconName="plus"
                                >
                                    {lang === 'zh' ? '还原到画布' : 'Restore to Canvas'}
                                </Button>

                                {/* Only show image download if not a code spec */}
                                {!zoomedImage.details?.designSystem && (
                                    <Button asChild color="gray" variant="soft" iconName="download">
                                        <a href={zoomedImage.url} download={`muse-ui-${zoomedImage.id}.png`}>
                                            {t.download}
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                </DialogShell>
            )}
        </div>
    );
};

export default GalleryManager;
