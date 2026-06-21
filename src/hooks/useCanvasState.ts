import { useState, useEffect } from 'react';
import { Artboard, ArtboardGroup, GeneratedImage, LayoutElement } from '../types';
import { getHistory, saveImageToHistory, deleteFromHistory, clearHistory as clearDbHistory } from '../services/idbHistoryService';
import { LangType } from '../types';

export const useCanvasState = (
    lang: LangType,
    initialProjectId: string | undefined,
    addNotification: (msg: string, type?: 'success' | 'error') => void,
    setError: (msg: string | null) => void
) => {
    const [history, setHistory] = useState<GeneratedImage[]>([]);
    const [artboards, setArtboards] = useState<Artboard[]>([]);
    const [artboardGroups, setArtboardGroups] = useState<ArtboardGroup[]>([]);

    // View State
    const [scale, setScale] = useState(0.8);
    const [position, setPosition] = useState({ x: 50, y: 50 });

    // Config related to Canvas (partially)
    const [layoutImage, setLayoutImage] = useState<string | null>(null);
    const [layoutElements, setLayoutElements] = useState<LayoutElement[]>([]);
    const [layoutAnalysis, setLayoutAnalysis] = useState<string | null>(null);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            // Removed: const savedHistory = await getHistory();
            // History is now loaded on-demand when opening GalleryManager
            // setHistory(savedHistory);

            // Restore canvas only if not loading a project
            if (!initialProjectId) {
                const savedLayout = localStorage.getItem('muse-ui-canvas-layout');
                const savedGroups = localStorage.getItem('muse-ui-canvas-groups');

                if (savedLayout) {
                    const layoutItems = JSON.parse(savedLayout) as { id: string, x: number, y: number, width: number, height: number, groupId?: string, label: string }[];
                    // Note: We can't restore images from history since we don't load it initially
                    // Images will be loaded from project data instead
                    // const restored = layoutItems.map(item => {
                    //     const img = savedHistory.find(h => h.id === item.id);
                    //     if (img) {
                    //         return { ...item, image: img } as Artboard;
                    //     }
                    //     return null;
                    // }).filter((item): item is Artboard => item !== null);

                    // if (restored.length > 0) setArtboards(restored);
                }
                if (savedGroups) setArtboardGroups(JSON.parse(savedGroups));
            }
        };
        loadData();
    }, [initialProjectId]);

    // Auto-save Canvas State
    useEffect(() => {
        const layoutToSave = artboards.map(({ id, x, y, width, height, groupId, label }) => ({ id, x, y, width, height, groupId, label }));
        localStorage.setItem('muse-ui-canvas-layout', JSON.stringify(layoutToSave));
        localStorage.setItem('muse-ui-canvas-groups', JSON.stringify(artboardGroups));
    }, [artboards, artboardGroups]);


    // Actions
    const handleSaveToHistory = async (img: GeneratedImage): Promise<GeneratedImage> => {
        try {
            const saved = await saveImageToHistory(img);
            const updated = await getHistory();
            setHistory(updated);
            return saved;
        } catch (e) {
            console.error("DB Save Failed", e);
            setHistory(prev => [img, ...prev]);
            return img;
        }
    };

    const handleDeleteHistory = async (id: string) => {
        await deleteFromHistory(id);
        setHistory(await getHistory());
    };

    const handleClearHistory = async () => {
        await clearDbHistory();
        setHistory([]);
    };

    const handleDeleteHistoryItem = (artboardId: string, historyItemId: string) => {
        setArtboards(prev => prev.map(board => {
            if (board.id !== artboardId) return board;

            const newHistory = (board.history || []).filter(h => h.id !== historyItemId);
            let newImage = board.image;
            if (board.image?.id === historyItemId) {
                newImage = newHistory.length > 0 ? newHistory[newHistory.length - 1] : board.image;
            }
            return { ...board, history: newHistory, image: newImage };
        }));
    };

    const updateLayoutImage = (newImage: string | null) => {
        if (newImage !== layoutImage) {
            setLayoutAnalysis(null);
        }
        setLayoutImage(newImage);
    };

    // ... Copy handleCanvasDrop and handleAutoArrange logic ...

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
    };

    const getImageDimensions = (base64: string): Promise<{ width: number, height: number }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => resolve({ width: 1000, height: 1000 }); // Fallback
            img.src = base64;
        });
    };

    const handleCanvasDrop = async (file: File, x: number, y: number, platform: string, designTokens: any) => {
        try {
            const base64 = await fileToBase64(file);
            const dims = await getImageDimensions(base64);
            const newImage: GeneratedImage = {
                id: `upload-${Date.now()}`,
                url: base64,
                prompt: file.name,
                timestamp: Date.now(),
                details: {
                    platform: platform as any, // casting for now
                    resolution: `${dims.width}x${dims.height}`,
                    style: 'Custom',
                    tokens: designTokens,
                    fullPrompt: 'User Upload',
                    batchId: 'upload'
                }
            };
            const savedImage = await handleSaveToHistory(newImage);

            setArtboards(prev => [...prev, {
                id: savedImage.id,
                x, y,
                width: dims.width,
                height: dims.height,
                image: savedImage,
                history: [savedImage],
                label: file.name
            }]);
        } catch (e) {
            console.error("Upload failed", e);
            setError(lang === 'zh' ? '图片加载失败' : 'Failed to load image');
        }
    };

    const handleAutoArrange = () => {
        const gap = 100;
        const startX = 50;
        let startY = 50;

        const grouped: Record<string, Artboard[]> = {};
        const singles: Artboard[] = [];
        artboards.forEach(ab => {
            if (ab.groupId) {
                if (!grouped[ab.groupId]) grouped[ab.groupId] = [];
                grouped[ab.groupId].push(ab);
            } else {
                singles.push(ab);
            }
        });

        // Arrange items in a grid that approximates a square (cols ≈ rows)
        const arrangeInGrid = (items: Artboard[], originX: number, originY: number): { boards: Artboard[], width: number, height: number } => {
            const n = items.length;
            if (n === 0) return { boards: [], width: 0, height: 0 };

            const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
            const rows = Math.ceil(n / cols);

            // Compute max width per column and max height per row
            const colWidths = Array(cols).fill(0);
            const rowHeights = Array(rows).fill(0);

            items.forEach((item, i) => {
                const c = i % cols;
                const r = Math.floor(i / cols);
                colWidths[c] = Math.max(colWidths[c], item.width);
                rowHeights[r] = Math.max(rowHeights[r], item.height);
            });

            // Compute cumulative positions
            const colXs: number[] = [originX];
            for (let c = 1; c < cols; c++) {
                colXs[c] = colXs[c - 1] + colWidths[c - 1] + gap;
            }
            const rowYs: number[] = [originY];
            for (let r = 1; r < rows; r++) {
                rowYs[r] = rowYs[r - 1] + rowHeights[r - 1] + gap;
            }

            const boards = items.map((item, i) => {
                const c = i % cols;
                const r = Math.floor(i / cols);
                return { ...item, x: colXs[c], y: rowYs[r] };
            });

            const totalW = colWidths.reduce((a, b) => a + b + gap, 0) - gap;
            const totalH = rowHeights.reduce((a, b) => a + b + gap, 0) - gap;
            return { boards, width: totalW, height: totalH };
        };

        const newBoards: Artboard[] = [];
        const newGroups: ArtboardGroup[] = [];

        // Arrange grouped artboards
        Object.entries(grouped).forEach(([gid, members]) => {
            members.sort((a, b) => a.id.localeCompare(b.id));
            const { boards, width, height } = arrangeInGrid(members, startX, startY);
            newBoards.push(...boards);
            newGroups.push({
                id: gid,
                label: members[0].label.split(' ')[0] || 'Group',
                x: startX,
                y: startY,
                width,
                height
            });
            startY += height + gap + 100;
        });

        // Arrange single artboards
        if (singles.length > 0) {
            const { boards, width, height } = arrangeInGrid(singles, startX, startY);
            newBoards.push(...boards);
            // Singles don't create a group, but we could track bounding box if needed
        }

        setArtboards(newBoards);
        setArtboardGroups(newGroups);
    };

    return {
        // State
        history, artboards, artboardGroups, layoutImage, layoutElements, layoutAnalysis,

        // View State
        scale, position,

        // Sets
        setHistory, setArtboards, setArtboardGroups, setLayoutImage, setLayoutElements, setLayoutAnalysis,

        // View Setters
        setScale, setPosition,

        // Actions
        handleSaveToHistory, handleDeleteHistory, handleClearHistory, handleDeleteHistoryItem, updateLayoutImage, handleCanvasDrop, handleAutoArrange,
        // Utils
        fileToBase64, getImageDimensions
    };
}
