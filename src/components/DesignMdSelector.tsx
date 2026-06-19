import React, { useState, useEffect, useMemo } from 'react';
import { LangType } from '../types';

// ─── Generic Option Type ───
export interface SelectorOption {
    id: string;
    name: string;
    name_zh: string;
    description: string;
    description_zh: string;
    content?: string;
    category?: string;
}

// ─── Props ───
interface Props {
    selectedId: string | null;
    onSelect: (id: string | null, content: string | null) => void;
    lang: LangType;
    variant?: 'design' | 'visual' | 'layout';
    // ── Generic mode (overrides variant when provided) ──
    options?: SelectorOption[];
    label?: string;
    label_zh?: string;
    modalTitle?: string;
    modalTitle_zh?: string;
    modalSubtitle?: string;
    modalSubtitle_zh?: string;
    showPreview?: boolean;
    showFavorites?: boolean;
    showSearch?: boolean;
    showClear?: boolean;
    confirmOnSelect?: boolean; // true = click card directly selects; false = preview then confirm
    favoritesKey?: string; // custom localStorage key for favorites in generic mode
}

const getFavorites = (key: string): string[] => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const setFavorites = (key: string, ids: string[]) => {
    localStorage.setItem(key, JSON.stringify(ids));
};

const toggleFavorite = (key: string, id: string): boolean => {
    const favs = getFavorites(key);
    if (favs.includes(id)) {
        setFavorites(key, favs.filter(f => f !== id));
        return false;
    }
    setFavorites(key, [id, ...favs]);
    return true;
};

const DesignMdSelector: React.FC<Props> = ({
    selectedId, onSelect, lang, variant = 'design',
    options: customOptions,
    label: customLabel, label_zh: customLabelZh,
    modalTitle: customModalTitle, modalTitle_zh: customModalTitleZh,
    modalSubtitle: customModalSubtitle, modalSubtitle_zh: customModalSubtitleZh,
    showPreview = true, showFavorites = true, showSearch = true, showClear = true,
    confirmOnSelect = false,
    favoritesKey: customFavoritesKey,
}) => {
    const isGeneric = !!customOptions && customOptions.length > 0;
    const isZh = lang === 'zh';
    const [loadedTemplates, setLoadedTemplates] = useState<SelectorOption[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    // ── Data source ──
    const templates: SelectorOption[] = useMemo(() => {
        if (isGeneric) return customOptions!;
        return loadedTemplates;
    }, [isGeneric, customOptions, loadedTemplates]);

    const getById = (id: string): SelectorOption | null => {
        return templates.find(t => t.id === id) || null;
    };

    // ── Labels ──
    const label = isGeneric
        ? (isZh ? (customLabelZh || customLabel || '选择') : (customLabel || 'Select'))
        : variant === 'design'
            ? (isZh ? '设计系统模板' : 'Design System')
            : variant === 'visual'
                ? (isZh ? '视觉风格模板' : 'Visual Style')
                : (isZh ? '布局密度策略' : 'Layout Density');

    const subLabel = isGeneric ? ''
        : variant === 'design' ? 'DESIGN.md'
        : variant === 'visual' ? 'STYLE.md'
        : 'LAYOUT.md';

    const modalTitleText = isGeneric
        ? (isZh ? (customModalTitleZh || customModalTitle || label) : (customModalTitle || label))
        : variant === 'design'
            ? (isZh ? '选择设计系统模板' : 'Select Design System Template')
            : variant === 'visual'
                ? (isZh ? '选择视觉风格模板' : 'Select Visual Style Template')
                : (isZh ? '选择布局密度策略' : 'Select Layout Density Strategy');

    const modalSubtitleText = isGeneric
        ? (isZh ? (customModalSubtitleZh || customModalSubtitle || '') : (customModalSubtitle || ''))
        : variant === 'design'
            ? (isZh ? '选择一个模板来指导 AI 生成符合该品牌设计规范的 UI' : 'Choose a template to guide AI in generating UI that follows the brand design spec')
            : variant === 'visual'
                ? (isZh ? '选择一种视觉美学风格，为生成的 UI 注入整体氛围和艺术质感' : 'Choose a visual aesthetic style to infuse the generated UI with overall mood and artistic texture')
                : (isZh ? '选择一种布局密度策略，控制元素间距、屏幕信息量和结构组织方式' : 'Choose a layout density strategy to control element spacing, screen information density, and structural organization');

    const sourceText = isZh ? '来自于开源项目' : 'From open source project';
    const sourceLink = isGeneric ? null
        : variant === 'design'
            ? { text: 'Design.md', href: 'https://github.com/VoltAgent/awesome-design-md' }
            : { text: 'baoyu-skills', href: 'https://github.com/tao-bio/awesome-baoyu-skills' };

    // ── Favorites ──
    const favoritesKey = customFavoritesKey
        ? customFavoritesKey
        : isGeneric || !showFavorites
            ? ''
            : variant === 'design'
                ? 'design-md-favorites'
                : variant === 'visual'
                    ? 'visual-style-favorites'
                    : 'layout-density-favorites';

    // ── State ──
    const [isOpen, setIsOpen] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState<SelectorOption | null>(null);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'all' | 'favorites'>('all');
    const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
        favoritesKey ? getFavorites(favoritesKey) : []
    );
    const selected = selectedId ? getById(selectedId) : null;

    useEffect(() => {
        if (isGeneric || (!isOpen && !selectedId)) return;

        let isCancelled = false;
        const loadTemplates = async () => {
            setIsLoadingTemplates(true);
            try {
                const mod: any = variant === 'design'
                    ? await import('../skills/designs')
                    : variant === 'visual'
                        ? await import('../skills/styles')
                        : await import('../skills/layouts');
                const list = variant === 'design'
                    ? mod.DESIGN_MD_TEMPLATES
                    : variant === 'visual'
                        ? mod.VISUAL_STYLE_TEMPLATES
                        : mod.LAYOUT_DENSITY_TEMPLATES;

                if (!isCancelled) {
                    setLoadedTemplates(list.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        name_zh: t.name_zh,
                        description: t.description,
                        description_zh: t.description_zh,
                        content: t.content,
                        category: t.category,
                    })));
                }
            } finally {
                if (!isCancelled) setIsLoadingTemplates(false);
            }
        };

        loadTemplates();
        return () => {
            isCancelled = true;
        };
    }, [isGeneric, isOpen, selectedId, variant]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setIsOpen(false); setActiveTemplate(null); }
        };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen]);

    const handleConfirm = (t: SelectorOption) => {
        onSelect(t.id, t.content || null);
        setIsOpen(false);
        setActiveTemplate(null);
        setSearch('');
        setTab('all');
    };

    const handleClear = () => {
        onSelect(null, null);
        setIsOpen(false);
        setActiveTemplate(null);
    };

    const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!favoritesKey) return;
        const isNowFav = toggleFavorite(favoritesKey, id);
        setFavoriteIds(getFavorites(favoritesKey));
        if (activeTemplate?.id === id && !isNowFav && tab === 'favorites') {
            setActiveTemplate(null);
        }
    };

    const filteredTemplates = useMemo(() => {
        let list = [...templates];

        if (showFavorites && tab === 'favorites') {
            list = list.filter(t => favoriteIds.includes(t.id));
        }

        if (showSearch && search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.name_zh.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.description_zh.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => {
            if (showFavorites) {
                const aFav = favoriteIds.includes(a.id) ? 1 : 0;
                const bFav = favoriteIds.includes(b.id) ? 1 : 0;
                if (aFav !== bFav) return bFav - aFav;
            }
            return (isZh ? a.name_zh : a.name).localeCompare(isZh ? b.name_zh : b.name);
        });
    }, [search, tab, favoriteIds, isZh, templates, showFavorites, showSearch]);

    // ── Card click handler ──
    const handleCardClick = (t: SelectorOption) => {
        if (confirmOnSelect) {
            handleConfirm(t);
        } else {
            setActiveTemplate(t);
        }
    };

    return (
        <div className="space-y-2 relative">
            <label className="block text-sm font-medium text-stone-400 dark:text-stone-500">
                {label}
                {subLabel && <span className="ml-1 text-xs text-stone-500 dark:text-stone-600">{subLabel}</span>}
            </label>

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-between p-3 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 hover:border-stone-400 dark:hover:border-stone-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            >
                <div className="flex flex-col items-start pr-8 text-left">
                    <span className="text-sm font-medium">
                        {selected ? (isZh ? selected.name_zh : selected.name) : (isZh ? '未选择' : 'None')}
                    </span>
                    {selected && (
                        <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                            {isZh ? (selected.description_zh || selected.description) : selected.description}
                        </span>
                    )}
                </div>
                <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => { setIsOpen(false); setActiveTemplate(null); }}
                    />

                    {/* Modal Content */}
                    <div className={`relative z-10 ${showPreview ? 'w-[1300px]' : 'w-[720px]'} max-w-[97vw] max-h-[85vh] h-auto bg-white dark:bg-stone-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                    {modalTitleText}
                                </h2>
                                {modalSubtitleText && (
                                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                        {modalSubtitleText}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {showClear && selected && (
                                    <button
                                        onClick={handleClear}
                                        className="text-xs px-3 py-1.5 rounded-lg text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        {isZh ? '清除选择' : 'Clear'}
                                    </button>
                                )}
                                <button
                                    onClick={() => { setIsOpen(false); setActiveTemplate(null); }}
                                    className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Toolbar: Search + Tabs */}
                        <div className="px-6 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-4 bg-stone-50/50 dark:bg-stone-950/50 shrink-0">
                            {/* Search */}
                            {showSearch && (
                                <div className="relative flex-1 max-w-md">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder={isZh ? '搜索...' : 'Search...'}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Tabs */}
                            {showFavorites && (
                                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setTab('all')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            tab === 'all'
                                                ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-sm'
                                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                                        }`}
                                    >
                                        {isZh ? '全部' : 'All'}
                                    </button>
                                    <button
                                        onClick={() => setTab('favorites')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                            tab === 'favorites'
                                                ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-sm'
                                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill={tab === 'favorites' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        {isZh ? '收藏' : 'Favorites'}
                                        {favoriteIds.length > 0 && (
                                            <span className="text-[10px] px-1 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
                                                {favoriteIds.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* sourceLink hidden */}
                        </div>

                        {/* Body */}
                        <div className={`flex-1 overflow-hidden ${showPreview ? 'flex' : ''}`}>
                            {/* Left: Template Grid */}
                            <div className={`overflow-y-auto p-6 ${showPreview ? 'flex-1' : 'w-full h-full'}`}>
                                {isLoadingTemplates ? (
                                    <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-600">
                                        <svg className="w-10 h-10 mb-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364-2.121 2.121M7.757 16.243l-2.121 2.121m12.728 0-2.121-2.121M7.757 7.757 5.636 5.636" />
                                        </svg>
                                        <p className="text-sm font-medium">{isZh ? '正在加载模板' : 'Loading templates'}</p>
                                    </div>
                                ) : filteredTemplates.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-600">
                                        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-medium">{isZh ? '没有找到匹配项' : 'No matches found'}</p>
                                        <p className="text-xs mt-1">{isZh ? '尝试其他关键词' : 'Try different keywords'}</p>
                                    </div>
                                ) : (
                                    <div className={`grid gap-3 ${showPreview ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                        {filteredTemplates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleCardClick(t)}
                                                className={`relative text-left p-4 rounded-xl border transition-all duration-200 group ${
                                                    activeTemplate?.id === t.id || selectedId === t.id
                                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md'
                                                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md'
                                                }`}
                                            >
                                                {/* Favorite Star */}
                                                {showFavorites && (
                                                    <button
                                                        onClick={(e) => handleToggleFavorite(e, t.id)}
                                                        className="absolute top-3 right-3 p-1 rounded-full transition-colors z-10 hover:bg-stone-100 dark:hover:bg-stone-700"
                                                        title={favoriteIds.includes(t.id) ? (isZh ? '取消收藏' : 'Unfavorite') : (isZh ? '收藏' : 'Favorite')}
                                                    >
                                                        <svg
                                                            className={`w-4 h-4 transition-colors ${
                                                                favoriteIds.includes(t.id)
                                                                    ? 'text-teal-400 fill-teal-400'
                                                                    : 'text-stone-300 dark:text-stone-600 hover:text-teal-300'
                                                            }`}
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={favoriteIds.includes(t.id) ? 0 : 2}
                                                            fill={favoriteIds.includes(t.id) ? 'currentColor' : 'none'}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {/* Selected Checkmark */}
                                                {(activeTemplate?.id === t.id || selectedId === t.id) && (
                                                    <div className={`absolute top-3 ${showFavorites ? 'right-10' : 'right-3'}`}>
                                                        <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}

                                                <h3 className={`text-sm font-semibold mb-1.5 pr-14 ${
                                                    activeTemplate?.id === t.id || selectedId === t.id
                                                        ? 'text-teal-700 dark:text-teal-400'
                                                        : 'text-stone-800 dark:text-stone-200 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                                                }`}>
                                                    {isZh ? t.name_zh : t.name}
                                                </h3>
                                                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                                                    {isZh ? (t.description_zh || t.description) : t.description}
                                                </p>
                                                {t.category && (
                                                    <div className="mt-3 flex items-center gap-1.5">
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
                                                            {t.category}
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: Preview Panel */}
                            {showPreview && (
                                <div className="w-[380px] border-l border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col shrink-0">
                                    <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
                                        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                            {isZh ? '内容预览' : 'Content Preview'}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4">
                                        {activeTemplate ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">
                                                        {isZh ? activeTemplate.name_zh : activeTemplate.name}
                                                    </h4>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">
                                                        {isZh ? (activeTemplate.description_zh || activeTemplate.description) : activeTemplate.description}
                                                    </p>
                                                </div>
                                                <div className="relative">
                                                    <pre className="text-[11px] text-stone-600 dark:text-stone-400 whitespace-pre-wrap font-mono leading-relaxed bg-white dark:bg-stone-900 rounded-lg p-3 border border-stone-200 dark:border-stone-800 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                                        {(activeTemplate.content || '').slice(0, 1200)}
                                                        {(activeTemplate.content || '').length > 1200 ? '\n...' : ''}
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-stone-400 dark:text-stone-600">
                                                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span className="text-xs">
                                                    {isZh ? '点击左侧卡片预览内容' : 'Click a card on the left to preview'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {activeTemplate && (
                                        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
                                            <button
                                                onClick={() => handleConfirm(activeTemplate)}
                                                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
                                            >
                                                {isZh ? '使用此模板' : 'Use This Template'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignMdSelector;
