import React, { useRef, useState, useEffect, useLayoutEffect, useCallback, memo } from 'react';
import { Artboard, ArtboardGroup, LangType, DesignSystem, GeneratedImage } from '../types';
import { I18N } from '../constants';
import DesignSpecRenderer from './DesignSpecRenderer';
import IconLoader from './IconLoader';
import DevRequestMonitor from './DevRequestMonitor';
import { Button, ContextMenuShell, DialogShell, Flex, IconButton, Text } from './ui';

interface Props {
    artboards: Artboard[];
    groups: ArtboardGroup[];
    onSelectArtboard: (id: string) => void;
    onInspectArtboard?: (image: GeneratedImage) => void;
    onMoveArtboard: (id: string, x: number, y: number) => void;
    onDeleteArtboard: (id: string) => void;
    onUploadImage: (file: File, x: number, y: number) => void;
    onAutoArrange: () => void;
    onRegenerateArtboard: (id: string) => void;
    onUpdateArtboard?: (id: string, updates: Partial<Artboard>) => void;
    lang: LangType;
    regeneratingId?: string | null;
    onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
    onDeleteHistoryItem?: (artboardId: string, historyItemId: string) => void;
    onCopyImage?: (base64: string) => void;
    devMode?: boolean;
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    position: { x: number; y: number };
    setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}


const SNAP_THRESHOLD = 2;

const CanvasBoard: React.FC<Props> = ({
    artboards, groups, onSelectArtboard, onInspectArtboard,
    onMoveArtboard, onDeleteArtboard, onUploadImage,
    onAutoArrange, onRegenerateArtboard, onUpdateArtboard,
    lang, regeneratingId, onRequestConfirm, onDeleteHistoryItem, onCopyImage,
    devMode,
    scale, setScale, position, setPosition
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const t = I18N[lang];

    const [historyModalOpen, setHistoryModalOpen] = useState<string | null>(null);

    // Interaction State
    const [isPanning, setIsPanning] = useState(false);
    const [movingArtboard, setMovingArtboard] = useState<string | null>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const [isDragOver, setIsDragOver] = useState(false);
    const transformLayerRef = useRef<HTMLDivElement>(null);
    const dotGridRef = useRef<HTMLDivElement>(null);
    const transitionRemovedRef = useRef(false);
    const isPanningRef = useRef(false);
    const lastTouchDistance = useRef<number | null>(null);
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(0 as any);
    const [guides, setGuides] = useState<{ type: 'v' | 'h'; pos: number }[]>([]);

    const [editingLabel, setEditingLabel] = useState<{ id: string, text: string } | null>(null);

    const handleSaveLabel = () => {
        if (editingLabel && onUpdateArtboard) {
            onUpdateArtboard(editingLabel.id, { label: editingLabel.text });
            setEditingLabel(null);
        }
    };

    // Refs for Event Listeners (to avoid stale closures without re-binding)
    const scaleRef = useRef(scale);
    const posRef = useRef(position);
    useEffect(() => { scaleRef.current = scale; }, [scale]);
    useEffect(() => { posRef.current = position; }, [position]);

    // Direct DOM update — bypasses React render for smooth panning/zooming
    const applyTransformToDOM = (pos: { x: number; y: number }, s: number) => {
        if (transformLayerRef.current) {
            transformLayerRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${s})`;
        }
        if (dotGridRef.current) {
            dotGridRef.current.style.opacity = '0';
        }
    };

    // Guard: if React re-renders during panning, re-apply the ref-based transform
    // so React's stale inline style doesn't overwrite our DOM position
    useLayoutEffect(() => {
        if (isPanningRef.current && transformLayerRef.current) {
            transformLayerRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) scale(${scaleRef.current})`;
        }
    });

    // Sync React state after interaction ends (debounced)
    const scheduleSyncToReact = (pos: { x: number; y: number }, s: number) => {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            setScale(s);
            setPosition(pos);
            if (dotGridRef.current) {
                dotGridRef.current.style.opacity = '';
            }
        }, 300);
    };

    // ... (Keep existing Wheel, toWorld, Mouse handlers same as before) ...
    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;
        const handleNativeWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const zoomSensitivity = 0.001;
                const delta = -e.deltaY * zoomSensitivity;
                const prevScale = scaleRef.current;
                const prevPos = posRef.current;

                const nextScale = Math.min(Math.max(0.1, prevScale + delta), 5);

                const rect = node.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - prevPos.x) / prevScale;
                const worldY = (mouseY - prevPos.y) / prevScale;

                const newX = mouseX - worldX * nextScale;
                const newY = mouseY - worldY * nextScale;

                const newPos = { x: newX, y: newY };
                scaleRef.current = nextScale;
                posRef.current = newPos;
                applyTransformToDOM(newPos, nextScale);
                scheduleSyncToReact(newPos, nextScale);
            } else {
                const prevPos = posRef.current;
                const newPos = { x: prevPos.x - e.deltaX, y: prevPos.y - e.deltaY };
                posRef.current = newPos;
                applyTransformToDOM(newPos, scaleRef.current);
                scheduleSyncToReact(newPos, scaleRef.current);
            }
        };
        node.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => node.removeEventListener('wheel', handleNativeWheel);
    }, []);


    const toWorld = (screenX: number, screenY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return { x: (screenX - rect.left - position.x) / scale, y: (screenY - rect.top - position.y) / scale };
    };

    const handleMouseDown = (e: React.MouseEvent, artboardId?: string) => {
        if (e.button !== 0 && e.button !== 1) return;
        if (artboardId) {
            e.stopPropagation();
            setMovingArtboard(artboardId);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            // Clear isNew flag when user clicks the artboard
            const board = artboards.find(a => a.id === artboardId);
            if (board?.isNew && onUpdateArtboard) {
                onUpdateArtboard(artboardId, { isNew: false });
            }
        } else {
            setIsPanning(true);
            isPanningRef.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            if (transformLayerRef.current) {
                transformLayerRef.current.style.transition = 'none';
                transformLayerRef.current.style.pointerEvents = 'none';
                transitionRemovedRef.current = true;
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        if (movingArtboard) {
            const deltaX = dx / scale;
            const deltaY = dy / scale;
            const target = artboards.find(a => a.id === movingArtboard);
            if (target) {
                let newX = target.x + deltaX;
                let newY = target.y + deltaY;
                const activeGuides: { type: 'v' | 'h'; pos: number }[] = [];
                const edgesX = [newX, newX + target.width / 2, newX + target.width];
                const edgesY = [newY, newY + target.height / 2, newY + target.height];
                let snappedX = false, snappedY = false;

                for (const other of artboards) {
                    if (other.id === movingArtboard) continue;
                    const otherEdgesX = [other.x, other.x + other.width / 2, other.x + other.width];
                    const otherEdgesY = [other.y, other.y + other.height / 2, other.y + other.height];
                    if (!snappedX) {
                        for (let i = 0; i < 3; i++) {
                            for (const ox of otherEdgesX) {
                                if (Math.abs(edgesX[i] - ox) < SNAP_THRESHOLD / scale) {
                                    newX = ox - (i === 1 ? target.width / 2 : i === 2 ? target.width : 0);
                                    activeGuides.push({ type: 'v', pos: ox });
                                    snappedX = true; break;
                                }
                            }
                            if (snappedX) break;
                        }
                    }
                    if (!snappedY) {
                        for (let i = 0; i < 3; i++) {
                            for (const oy of otherEdgesY) {
                                if (Math.abs(edgesY[i] - oy) < SNAP_THRESHOLD / scale) {
                                    newY = oy - (i === 1 ? target.height / 2 : i === 2 ? target.height : 0);
                                    activeGuides.push({ type: 'h', pos: oy });
                                    snappedY = true; break;
                                }
                            }
                            if (snappedY) break;
                        }
                    }
                }
                setGuides(activeGuides);
                onMoveArtboard(movingArtboard, newX, newY);
            }
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        } else if (isPanningRef.current) {
            const newPos = { x: posRef.current.x + dx, y: posRef.current.y + dy };
            posRef.current = newPos;
            applyTransformToDOM(newPos, scaleRef.current);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        const wasPanning = isPanningRef.current;
        const wasMoving = movingArtboard;
        setIsPanning(false);
        isPanningRef.current = false;
        setMovingArtboard(null);
        setGuides([]);
        // Sync final position to React state after panning
        if (wasPanning) {
            clearTimeout(syncTimeoutRef.current);
            const finalPos = { ...posRef.current };
            const finalScale = scaleRef.current;
            setScale(finalScale);
            setPosition(finalPos);
            // Restore dot grid
            if (dotGridRef.current) {
                dotGridRef.current.style.opacity = '';
            }
        }
        if (transitionRemovedRef.current && transformLayerRef.current) {
            transformLayerRef.current.style.transition = 'transform 0.1s ease-out';
            transformLayerRef.current.style.pointerEvents = '';
            transitionRemovedRef.current = false;
        }
    };
    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    };

    const getTouchCenter = (touches: React.TouchList) => ({
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setIsPanning(true);
            isPanningRef.current = true;
            lastMousePos.current = { x: touch.clientX, y: touch.clientY };
            if (transformLayerRef.current) {
                transformLayerRef.current.style.transition = 'none';
                transformLayerRef.current.style.pointerEvents = 'none';
                transitionRemovedRef.current = true;
            }
        }
        if (e.touches.length === 2) {
            lastTouchDistance.current = getTouchDistance(e.touches);
            isPanningRef.current = false;
            setIsPanning(false);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        e.preventDefault();

        if (e.touches.length === 1 && isPanningRef.current) {
            const touch = e.touches[0];
            const dx = touch.clientX - lastMousePos.current.x;
            const dy = touch.clientY - lastMousePos.current.y;
            const newPos = { x: posRef.current.x + dx, y: posRef.current.y + dy };
            posRef.current = newPos;
            applyTransformToDOM(newPos, scaleRef.current);
            lastMousePos.current = { x: touch.clientX, y: touch.clientY };
            scheduleSyncToReact(newPos, scaleRef.current);
            return;
        }

        if (e.touches.length === 2) {
            const prevDistance = lastTouchDistance.current || getTouchDistance(e.touches);
            const nextDistance = getTouchDistance(e.touches);
            if (prevDistance <= 0) return;

            const ratio = nextDistance / prevDistance;
            const prevScale = scaleRef.current;
            const nextScale = Math.min(Math.max(prevScale * ratio, 0.1), 5);
            const center = getTouchCenter(e.touches);
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = center.x - rect.left;
            const centerY = center.y - rect.top;
            const prevPos = posRef.current;
            const worldX = (centerX - prevPos.x) / prevScale;
            const worldY = (centerY - prevPos.y) / prevScale;
            const newPos = {
                x: centerX - worldX * nextScale,
                y: centerY - worldY * nextScale,
            };

            lastTouchDistance.current = nextDistance;
            scaleRef.current = nextScale;
            posRef.current = newPos;
            applyTransformToDOM(newPos, nextScale);
            scheduleSyncToReact(newPos, nextScale);
        }
    };

    const handleTouchEnd = () => {
        lastTouchDistance.current = null;
        handleMouseUp();
    };

    const handleDoubleClick = (e: React.MouseEvent, artboardId: string) => {
        e.stopPropagation();
        const board = artboards.find(b => b.id === artboardId);
        if (!board || !containerRef.current) return;

        const container = containerRef.current;
        const cW = container.clientWidth;
        const cH = container.clientHeight;

        // Padding around the focused board
        const padding = 60;

        // Calculate scale to fit
        const scaleX = (cW - padding) / board.width;
        const scaleY = (cH - padding) / board.height;
        // Cap scale at 1.5 or 2 (don't zoom in crazy amounts on tiny elements)
        const newScale = Math.min(Math.min(scaleX, scaleY), 2.0);

        // Center it
        // Center of screen X = newPos.x + (board.x + board.width/2) * newScale
        const newX = (cW / 2) - (board.x + board.width / 2) * newScale;
        const newY = (cH / 2) - (board.y + board.height / 2) * newScale;

        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = () => { setIsDragOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
        if (files.length > 0) { const { x, y } = toWorld(e.clientX, e.clientY); onUploadImage(files[0], x, y); }
    };

    const resetView = () => { setPosition({ x: 50, y: 50 }); setScale(0.8); };
    const fitToScreen = () => {
        if (artboards.length === 0) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        artboards.forEach(ab => { minX = Math.min(minX, ab.x); minY = Math.min(minY, ab.y); maxX = Math.max(maxX, ab.x + ab.width); maxY = Math.max(maxY, ab.y + ab.height); });
        if (!containerRef.current) return;
        const cW = containerRef.current.clientWidth, cH = containerRef.current.clientHeight;
        const contentW = maxX - minX + 200, contentH = maxY - minY + 200;
        const newScale = Math.min(cW / contentW, cH / contentH, 1);
        setScale(newScale);
        setPosition({ x: (cW - contentW * newScale) / 2 - minX * newScale + 100 * newScale, y: (cH - contentH * newScale) / 2 - minY * newScale + 100 * newScale });
    };

    const handleSpecUpdate = (id: string, newDs: DesignSystem) => { if (onUpdateArtboard) { const target = artboards.find(a => a.id === id); if (target && target.image.details) { onUpdateArtboard(id, { image: { ...target.image, details: { ...target.image.details, designSystem: newDs } } }); } } };

    return (
        <div className="muse-canvas-surface relative w-full h-full overflow-hidden select-none">
            <div ref={dotGridRef} className="absolute inset-0 opacity-70 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--muse-grid-dot) 1px, transparent 1px)', backgroundSize: `${Math.max(2, 20 * scale)}px ${Math.max(2, 20 * scale)}px`, backgroundPosition: `${position?.x ?? 0}px ${position?.y ?? 0}px`, transition: 'opacity 0.15s ease-out' }} />
            {isDragOver && (<div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center border-4 border-dashed border-[var(--accent-8)] bg-[var(--accent-4)]/35 backdrop-blur-sm"><span className="muse-floating-toolbar rounded-2xl px-5 py-3 text-xl font-bold text-[var(--accent-11)]">{lang === 'zh' ? '释放以上传图片到画布' : 'Drop to add image to canvas'}</span></div>)}

            <div ref={containerRef} className={`w-full h-full touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={(e) => handleMouseDown(e)} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <div
                    ref={transformLayerRef}
                    style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: '0 0', willChange: 'transform' }}
                >
                    {groups.map(group => (
                        <div key={group.id} style={{ position: 'absolute', left: group.x - 20, top: group.y - 40, width: group.width + 40, height: group.height + 60 }} className="pointer-events-none rounded-2xl border-2 border-dashed border-[var(--muse-border-strong)] bg-[var(--muse-surface-muted)]/70">
                            <div className="muse-panel-quiet absolute -top-12 left-0 rounded-xl px-4 py-1.5 text-lg font-bold uppercase tracking-widest text-[var(--gray-10)]">{group.label}</div>
                        </div>
                    ))}
                    {artboards.map(board => (
                        <ContextMenuShell
                            key={board.id}
                            items={[
                                {
                                    label: lang === 'zh' ? '重新生成' : 'Regenerate',
                                    iconName: 'refresh',
                                    onSelect: () => onRegenerateArtboard(board.id),
                                },
                                {
                                    label: lang === 'zh' ? '版本历史' : 'Version History',
                                    iconName: 'clipboard',
                                    disabled: !board.history || board.history.length === 0,
                                    onSelect: () => setHistoryModalOpen(board.id),
                                },
                                {
                                    label: lang === 'zh' ? '从画布移除' : 'Remove from Canvas',
                                    iconName: 'trash',
                                    destructive: true,
                                    onSelect: () => onDeleteArtboard(board.id),
                                },
                            ]}
                        >
                        <div style={{ position: 'absolute', left: board.x, top: board.y, width: board.width, height: board.height, contain: 'layout style' }} className={`group rounded-xl border border-black/5 bg-white shadow-2xl shadow-slate-900/12 dark:border-white/10 dark:bg-stone-950 dark:shadow-black/50 hover:ring-2 ring-[var(--accent-8)]/50 ${movingArtboard === board.id ? 'ring-4 ring-[var(--accent-8)] cursor-grabbing z-50' : 'cursor-grab'} ${board.isNew ? 'flash-new' : ''}`} onMouseDown={(e) => handleMouseDown(e, board.id)} onDoubleClick={(e) => handleDoubleClick(e, board.id)}>

                            {/* Floating Toolbar & Label */}
                            <div
                                className="absolute bottom-full mb-2 left-0 w-full flex items-center justify-start z-[60] pointer-events-auto"
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, board.id); }}
                            >
                                <div
                                    style={{ transform: `scale(${Math.min(5, 1 / Math.max(0.01, scale))})`, transformOrigin: 'bottom left' }}
                                    className="muse-floating-toolbar flex items-center gap-2 rounded-xl p-1.5 opacity-100 translate-y-0 transition-[opacity,transform] duration-200 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0"
                                >
                                    {/* Editable Label */}
                                    <div className="flex items-center">
                                        {editingLabel?.id === board.id ? (
                                            <input
                                                autoFocus
                                                className="bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded px-1 py-0.5 text-xs font-bold text-stone-800 dark:text-stone-200 w-32 outline-none focus:ring-2 ring-teal-500"
                                                value={editingLabel.text}
                                                onChange={e => setEditingLabel({ ...editingLabel, text: e.target.value })}
                                                onBlur={handleSaveLabel}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveLabel()}
                                                onMouseDown={e => e.stopPropagation()}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span
                                                className="text-xs font-bold text-stone-600 dark:text-stone-300 px-1 cursor-text hover:text-teal-500 max-w-[120px] truncate"
                                                onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel({ id: board.id, text: board.label }); }}
                                                title={lang === 'zh' ? '双击重命名' : 'Double click to rename'}
                                            >
                                                {board.label || "Untitled"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="h-3 w-px bg-[var(--muse-border-strong)]"></div>

                                    {/* Toolbar Actions */}
                                    <div className="flex items-center gap-1">
                                        {/* History */}
                                        {board.history && board.history.length > 1 && (
                                            <div className="flex items-center bg-stone-100 dark:bg-stone-700 rounded overflow-hidden">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const hist = board.history!;
                                                        const currIdx = hist.findIndex(h => h.id === board.image.id);
                                                        if (currIdx > 0 && onUpdateArtboard) onUpdateArtboard(board.id, { image: hist[currIdx - 1] });
                                                    }}
                                                    disabled={!onUpdateArtboard || board.history.findIndex(h => h.id === board.image.id) <= 0}
                                                    className="p-2 md:p-1 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-500 disabled:opacity-30"
                                                    title={lang === 'zh' ? '上一版' : 'Previous Version'}
                                                >
                                                    <IconLoader name="chevron-left" size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const hist = board.history!;
                                                        const currIdx = hist.findIndex(h => h.id === board.image.id);
                                                        if (currIdx < hist.length - 1 && onUpdateArtboard) onUpdateArtboard(board.id, { image: hist[currIdx + 1] });
                                                    }}
                                                    disabled={!onUpdateArtboard || board.history.findIndex(h => h.id === board.image.id) >= board.history.length - 1}
                                                    className="p-2 md:p-1 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-500 disabled:opacity-30"
                                                    title={lang === 'zh' ? '下一版' : 'Next Version'}
                                                >
                                                    <IconLoader name="chevron-right" size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {onInspectArtboard && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onInspectArtboard(board.image); }}
                                                className="p-2 md:p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-500 hover:text-teal-500 transition-colors"
                                                title={lang === 'zh' ? '详情' : 'Info'}
                                            >
                                                <IconLoader name="info" size={14} />
                                            </button>
                                        )}

                                        {/* History Modal Toggle */}
                                        {board.history && board.history.length > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setHistoryModalOpen(board.id); }}
                                                className="p-2 md:p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-500 hover:text-cyan-500 transition-colors"
                                                title={lang === 'zh' ? '历史版本' : 'History'}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                        )}

                                        {/* Download Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Download the image
                                                const link = document.createElement('a');
                                                link.href = board.image.url;
                                                link.download = `${board.label || 'artboard'}-${Date.now()}.png`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="p-2 md:p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-500 hover:text-cyan-500 transition-colors"
                                            title={lang === 'zh' ? '下载图片' : 'Download Image'}
                                        >
                                            <IconLoader name="download" size={14} />
                                        </button>

                                        {onCopyImage && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onCopyImage(board.image.url); }}
                                                className="p-2 md:p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-500 hover:text-teal-500 transition-colors"
                                                title={lang === 'zh' ? '复制到参考图' : 'Copy to Reference'}
                                            >
                                                <IconLoader name="copy" size={14} />
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRegenerateArtboard(board.id); }}
                                            className="p-2 md:p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-500 hover:text-teal-500 transition-colors"
                                            title={lang === 'zh' ? '重新生成' : 'Regenerate'}
                                        >
                                            <IconLoader name="magic-wand" size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRequestConfirm(
                                                    lang === 'zh' ? '删除画板' : 'Delete Artboard',
                                                    lang === 'zh' ? '确定删除此画板吗？' : 'Delete this artboard?',
                                                    () => onDeleteArtboard(board.id)
                                                );
                                            }}
                                            className="p-2 md:p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-stone-500 hover:text-red-500 transition-colors"
                                            title={lang === 'zh' ? '删除' : 'Delete'}
                                        >
                                            <IconLoader name="trash" size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            {
                                board.image.details?.designSystem ? (
                                    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-[var(--muse-border)] bg-white">
                                        <div
                                            className="h-4 bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors z-20"
                                            onMouseDown={(e) => handleMouseDown(e, board.id)}
                                        >
                                            <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-stone-600 opacity-50"></div>
                                        </div>
                                        <div className="flex-1 overflow-hidden relative cursor-default" onMouseDown={(e) => e.stopPropagation()}>
                                            <DesignSpecRenderer designSystem={board.image.details.designSystem} lang={lang} editable={true} onUpdate={(ds) => handleSpecUpdate(board.id, ds)} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white/70 pointer-events-none dark:bg-stone-950/70">
                                        <img src={board.image.url} alt={board.label} className="w-full h-full object-contain" />
                                    </div>
                                )
                            }

                            {regeneratingId === board.id && (<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-50 rounded-lg"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mb-3"></div><span className="text-xs font-bold animate-pulse">{lang === 'zh' ? '生成中...' : 'Generating...'}</span></div>)}
                        </div>
                        </ContextMenuShell>
                    ))}
                    {guides.map((g, idx) => (<div key={idx} className="absolute bg-red-500 pointer-events-none z-[60]" style={{ left: g.type === 'v' ? g.pos : -10000, top: g.type === 'h' ? g.pos : -10000, width: g.type === 'v' ? 1 : '20000px', height: g.type === 'h' ? 1 : '20000px' }} />))}
                </div>
            </div>

            {/* Controls */}
            <Flex align="center" gap="2" className="muse-floating-toolbar absolute bottom-3 left-3 right-3 flex-wrap rounded-2xl p-2 md:bottom-6 md:left-auto md:right-6 md:flex-nowrap">
                <IconButton iconName="zoom-out" label={lang === 'zh' ? '缩小' : 'Zoom out'} variant="soft" color="gray" onClick={() => setScale(s => Math.max(0.1, s - 0.1))} />
                <Text size="2" weight="bold" className="w-12 text-center font-mono">{Math.round(scale * 100)}%</Text>
                <IconButton iconName="zoom-in" label={lang === 'zh' ? '放大' : 'Zoom in'} variant="soft" color="gray" onClick={() => setScale(s => Math.min(5, s + 0.1))} />
                <div className="mx-1 h-5 w-px bg-[var(--gray-5)]" />
                <Button onClick={onAutoArrange} size="2" variant="soft" color="gray" iconName="tidy">{lang === 'zh' ? '整理' : 'Tidy'}</Button>
                <Button onClick={fitToScreen} size="2" variant="soft" color="gray">{t.fitToScreen}</Button>
                <Button onClick={resetView} size="2" variant="soft" color="gray">{t.resetView}</Button>
            </Flex>

            {artboards.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                    <div className="muse-empty-state max-w-md rounded-3xl px-8 py-7 text-center">
                        <div className="muse-brand-mark mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white">
                            <IconLoader name="palette" size={34} />
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-[var(--gray-12)]">{t.ready}</h2>
                        <p className="text-sm leading-relaxed text-[var(--gray-10)]">{t.readyDesc}</p>
                    </div>
                </div>
            )}

            {
                historyModalOpen && (() => {
                    const board = artboards.find(b => b.id === historyModalOpen);
                    if (!board || !board.history) return null;
                    const sortedHistory = [...board.history].reverse(); // Newest first

                    return (
                        <DialogShell
                            open
                            onOpenChange={(open) => { if (!open) setHistoryModalOpen(null); }}
                            title={`${lang === 'zh' ? '版本历史' : 'Version History'} (${board.history.length})`}
                            description={lang === 'zh' ? '选择一个历史版本恢复到画布。' : 'Select a previous version to restore it to the canvas.'}
                            size="lg"
                            footer={<Text size="1" color="gray">{lang === 'zh' ? '右键点击图片可快速删除' : 'Right-click an image to delete it quickly'}</Text>}
                            closeLabel={lang === 'zh' ? '关闭历史版本' : 'Close version history'}
                        >
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {sortedHistory.map(img => (
                                    <div
                                        key={img.id}
                                        className={`group relative overflow-hidden rounded-lg border-2 transition-all ${board.image.id === img.id ? 'border-[var(--accent-8)] ring-2 ring-[var(--accent-4)]' : 'border-transparent hover:border-[var(--gray-7)]'}`}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (onDeleteHistoryItem) onDeleteHistoryItem(board.id, img.id);
                                        }}
                                    >
                                        <button
                                            className="relative block aspect-[3/4] w-full cursor-pointer bg-[var(--gray-3)]"
                                            onClick={() => {
                                                if (onUpdateArtboard) onUpdateArtboard(board.id, { image: img });
                                            }}
                                        >
                                            <img src={img.url} className="h-full w-full object-cover" loading="lazy" />
                                            {board.image.id === img.id && (
                                                <div className="absolute left-2 top-2 rounded bg-[var(--accent-9)] px-2 py-0.5 text-[10px] font-bold text-white shadow">Current</div>
                                            )}
                                        </button>
                                        <Flex align="center" justify="between" className="bg-[var(--gray-2)] p-2">
                                            <Text size="1" color="gray" className="truncate">{new Date(img.timestamp).toLocaleTimeString()}</Text>
                                            {onDeleteHistoryItem && (
                                                <IconButton
                                                    iconName="trash"
                                                    label={lang === 'zh' ? '删除此版本' : 'Delete version'}
                                                    size="1"
                                                    variant="ghost"
                                                    color="red"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteHistoryItem(board.id, img.id);
                                                    }}
                                                />
                                            )}
                                        </Flex>
                            </div>
                                ))}
                            </div>
                        </DialogShell>
                    );
                })()
            }

            {devMode && <DevRequestMonitor lang={lang} />}
        </div>
    );
};

export default CanvasBoard;
