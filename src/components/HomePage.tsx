import React, { useEffect, useState } from 'react';
import { Project, LangType } from '../types';
import { getProjects, createProject, deleteProject, saveProject } from '../services/idbProjectService';
import IconLoader from './IconLoader';
import { I18N } from '../constants';
import { ToastContainer } from './Toast';
import ApiKeyConfig from './ApiKeyConfig';
import { getStudio } from '../studios';
import { Badge, Button, Card, DropdownMenuShell, ThemeProvider, TextFieldControl } from './ui';

const HomePage: React.FC = () => {
    const [lang, setLang] = useState<LangType>(() => (localStorage.getItem('muse-ui-lang') as LangType) || 'zh');
    const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('muse-ui-theme') as any) || 'light');
    const t = I18N[lang];
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
    const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);
    const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const toggleTheme = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('muse-ui-theme', next);
            if (next === 'dark') document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            return next;
        });
    };

    useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        loadProjects();
    }, []);

    useEffect(() => { localStorage.setItem('muse-ui-lang', lang); }, [lang]);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (e) {
            console.error("Failed to load projects", e);
            addNotification(lang === 'zh' ? '加载项目失败' : 'Failed to load projects', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        const name = lang === 'zh' ? '未命名项目' : 'Untitled Project';
        try {
            const newProject = await createProject({ name });
            window.open(`/editor/${newProject.id}`, '_blank');
        } catch (e) {
            console.error("Failed to create project", e);
            addNotification(lang === 'zh' ? '创建项目失败' : 'Failed to create project', 'error');
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm(lang === 'zh' ? '确定删除此项目吗？' : 'Are you sure you want to delete this project?')) return;
        try {
            await deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            addNotification(lang === 'zh' ? '项目已删除' : 'Project deleted', 'success');
        } catch (e) {
            console.error("Delete failed", e);
            addNotification(lang === 'zh' ? '删除失败' : 'Delete failed', 'error');
        }
    };

    const handleRenameProject = async (projectId: string, newName: string) => {
        try {
            await saveProject(projectId, { name: newName });
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
            addNotification(lang === 'zh' ? '已重命名' : 'Renamed', 'success');
        } catch (e) {
            console.error("Rename failed", e);
            addNotification(lang === 'zh' ? '重命名失败' : 'Rename failed', 'error');
        }
    };

    const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
    };

    return (
        <ThemeProvider appearance={theme}>
        <div className={`muse-app-shell min-h-screen text-[var(--gray-12)] flex flex-col font-sans ${theme}`}>
            <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 md:p-8">
                <div className="muse-panel mb-8 flex flex-col gap-5 rounded-[28px] p-4 md:flex-row md:items-center md:justify-between md:p-6">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="relative">
                            <DropdownMenuShell
                                align="start"
                                trigger={(
                                    <button className="muse-brand-mark h-14 w-14 overflow-hidden rounded-2xl p-[2px] transition-transform hover:-translate-y-0.5">
                                        <img src="/logo.png" alt="MuseUI" className="h-full w-full rounded-[14px] object-cover bg-white" />
                                    </button>
                                )}
                                items={[
                                    {
                                        iconName: theme === 'dark' ? 'sun' : 'moon',
                                        label: theme === 'dark' ? (lang === 'zh' ? '浅色模式' : 'Light Mode') : (lang === 'zh' ? '深色模式' : 'Dark Mode'),
                                        onSelect: toggleTheme,
                                    },
                                    {
                                        iconName: 'globe',
                                        label: lang === 'zh' ? 'English' : '中文',
                                        onSelect: () => setLang(lang === 'zh' ? 'en' : 'zh'),
                                    },
                                    {
                                        iconName: 'settings',
                                        label: lang === 'zh' ? 'API Key 设置' : 'API Key Settings',
                                        onSelect: () => setShowApiKeyConfig(true),
                                    },
                                ]}
                            />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">MuseUI</h1>
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-11)]">{lang === 'zh' ? '我的项目' : 'My Projects'}</p>
                            <p className="text-[var(--gray-11)] text-sm">
                                {projects.length} {lang === 'zh' ? '个项目' : 'Projects'} · {lang === 'zh' ? '最近更新' : 'Recently updated'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={() => setShowApiKeyConfig(true)} size="3" variant="soft" color="gray" iconName="settings" className="rounded-full">
                            API
                        </Button>
                        <Button onClick={handleCreateProject} size="3" color="ruby" iconName="plus" className="muse-gradient-action rounded-full">
                            {lang === 'zh' ? '新建项目' : 'New Project'}
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin text-stone-300"><IconLoader name="loader" size={48} /></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 pb-20 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <Card onClick={handleCreateProject} className="muse-panel muse-card-hover group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[var(--muse-border-strong)]">
                            <div className="muse-brand-mark flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-105">
                                <IconLoader name="plus" size={24} />
                            </div>
                            <span className="font-bold text-[var(--gray-11)] transition-colors group-hover:text-[var(--accent-11)]">
                                {lang === 'zh' ? '创建空白项目' : 'Create Blank Project'}
                            </span>
                        </Card>
                        {projects.map(project => {
                            const studio = getStudio(project.studioType);
                            return (
                            <Card key={project.id} onClick={() => window.open(`/editor/${project.id}`, '_blank')} className="muse-panel muse-card-hover group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-3xl p-0">
                                <div className="relative h-2/3 overflow-hidden bg-[var(--gray-4)]">
                                    {project.thumbnailUrl ? (
                                        <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-[var(--muse-canvas-bg)] text-[var(--gray-8)]"><IconLoader name="image" size={34} /></div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                    <Badge color="ruby" variant="soft" className="absolute left-3 top-3 shadow-lg backdrop-blur-sm">
                                        {lang === 'zh' ? studio.name_zh : studio.name}
                                    </Badge>
                                </div>
                                <div className="flex h-1/3 flex-col justify-between p-4">
                                    <div className="flex justify-between items-start">
                                        {renamingProjectId === project.id ? (
                                            <TextFieldControl
                                                value={renameValue}
                                                onValueChange={setRenameValue}
                                                onBlur={() => { handleRenameProject(project.id, renameValue); setRenamingProjectId(null); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProject(project.id, renameValue); setRenamingProjectId(null); } if (e.key === 'Escape') setRenamingProjectId(null); }}
                                                autoFocus
                                                className="font-bold"
                                            />
                                        ) : (
                                            <h3 className="flex-1 truncate pr-2 font-bold text-[var(--gray-12)]" title={project.name}>{project.name}</h3>
                                        )}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); setRenamingProjectId(project.id); setRenameValue(project.name); }} className="text-stone-400 hover:text-teal-500 p-1" title={lang === 'zh' ? '重命名' : 'Rename'}>
                                                <IconLoader name="edit" size={16} />
                                            </button>
                                            <button onClick={(e) => handleDeleteProject(e, project.id)} className="text-stone-400 hover:text-red-500 p-1" title={lang === 'zh' ? '删除' : 'Delete'}>
                                                <IconLoader name="trash" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[var(--gray-9)]">{new Date(project.updatedAt).toLocaleDateString()}</p>
                                </div>
                            </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {showApiKeyConfig && <ApiKeyConfig onConfigured={() => setShowApiKeyConfig(false)} onClose={() => setShowApiKeyConfig(false)} lang={lang} />}

            <ToastContainer notifications={notifications} onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
        </div>
        </ThemeProvider>
    );
};

export default HomePage;
