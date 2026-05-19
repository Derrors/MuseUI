import { useState, useEffect } from 'react';
import { Project, SavedProject, LangType, Artboard } from '../types';
import { getProjects, createProject, getProjectById, saveProject, deleteProject } from '../services/idbProjectService';
import { getHistory } from '../services/idbHistoryService';

// Helper to hydrate artboards will be needed here or passed in. 
// Since hydrate logic depends on generic 'Artboard' type, we can keep it here or in a util. 
// For now, let's keep a simplified version or assume the service handles deep hydration? 
// Actually, useAppLogic had 'hydrateArtboardsFromProject'. We should duplicate or move it.
// Let's create a utils file later if needed, for now include it.

const hydrateArtboardsFromProject = (project: any): Artboard[] => {
    const dbArtboards = project.artboards || [];
    if (dbArtboards.length === 0) return [];

    const hydrated: Artboard[] = [];
    for (const daItem of dbArtboards) {
        const da = daItem as any;
        if (da.image) {
            hydrated.push({
                id: da.id,
                x: da.x ?? da.positionX ?? 0,
                y: da.y ?? da.positionY ?? 0,
                width: da.width,
                height: da.height,
                image: da.image,
                label: da.label ?? da.name ?? 'Artboard',
                groupId: da.groupId || undefined,
                history: da.history || []
            });
        }
    }
    return hydrated;
};

export const useProjectState = (
    lang: LangType,
    addNotification: (msg: string, type?: 'success' | 'error') => void,
    setArtboards: (val: Artboard[] | ((prev: Artboard[]) => Artboard[])) => void,
    initialProjectId?: string
) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load Projects & auto-load/create
    useEffect(() => {
        const loadData = async () => {
            try {
                const dbProjects = await getProjects();
                setProjects(dbProjects);

                const savedProjectsData = localStorage.getItem('muse-ui-projects');
                if (savedProjectsData) setSavedProjects(JSON.parse(savedProjectsData));

                if (initialProjectId) {
                    handleLoadProject(initialProjectId);
                } else if (dbProjects.length > 0) {
                    const sorted = [...dbProjects].sort((a, b) =>
                        new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
                    );
                    handleLoadProject(sorted[0].id);
                } else {
                    const newProject = await createProject({
                        name: lang === 'zh' ? '未命名项目' : 'Untitled Project',
                    });
                    setProjects([newProject]);
                    setCurrentProjectId(newProject.id);
                }
            } catch (e) {
                console.error("Failed to fetch projects", e);
            }
        };
        loadData();
    }, []);

    const handleLoadProject = async (projectId: string) => {
        setIsLoadingProject(true);
        try {
            const project = await getProjectById(projectId);
            if (!project) return;

            // Return project data so parent can set config
            // We can't set config here easily without circular dep or passing huge object of setters
            // So we will return the Loaded Project config and let the parent (useAppLogic) handle the Config restoration.
            // But we CAN handle Artboards here if we passed setArtboards.

            // Restore Artboards
            const hydrated = hydrateArtboardsFromProject(project);
            setArtboards(hydrated);

            // Update projects list with loaded details
            setProjects(prev => {
                const idx = prev.findIndex(p => p.id === projectId);
                if (idx > -1) {
                    const newPrev = [...prev];
                    newPrev[idx] = project;
                    return newPrev;
                }
                return [...prev, project];
            });

            setCurrentProjectId(projectId);
            addNotification(lang === 'zh' ? '项目已加载' : 'Project Loaded', 'success');
            return project; // Return for further processing
        } catch (e) {
            console.error("Load Project Failed", e);
            addNotification(lang === 'zh' ? '加载失败' : 'Load Failed', 'error');
        } finally {
            setIsLoadingProject(false);
        }
    };

    const handleSaveProject = async (name: string, description: string, configState: any, artboards: Artboard[], thumbnailUrl?: string) => {
        try {
            const newProject = await createProject({
                name,
                description: description.substring(0, 100)
            });

            const savedProject = await saveProject(newProject.id, {
                config: {},
                artboards,
                thumbnailUrl: thumbnailUrl || undefined
            });

            setProjects(prev => [savedProject, ...prev]);
            setCurrentProjectId(savedProject.id);

            if (savedProject.artboards) {
                const hydrated = hydrateArtboardsFromProject(savedProject);
                setArtboards(hydrated);
            }

            addNotification(lang === 'zh' ? '项目已创建' : 'Project Created', 'success');
        } catch (e: any) {
            console.error("Create Project Failed", e);
            addNotification(e.message || 'Failed to create project', 'error');
        }
    };

    const handleCreateBlankProject = async () => {
        try {
            const name = `${lang === 'zh' ? '新项目' : 'New Project'} ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().slice(0, 5)}`;
            const newProject = await createProject({ name });
            setProjects(prev => [newProject, ...prev]);
            setCurrentProjectId(newProject.id);
            setArtboards([]);
            addNotification(lang === 'zh' ? '空白项目已创建' : 'Blank project created', 'success');
        } catch (e: any) {
            console.error("Create Blank Project Failed", e);
            addNotification(e.message || 'Failed to create project', 'error');
        }
    };

    const handleUpdateProjectContent = async (id: string, configState: any, artboards: Artboard[], thumbnail?: string, skipStateUpdate: boolean = false) => {
        if (!id) return;
        try {
            setIsSaving(true); // Always show loading, even for auto-save
            const updatedProject = await saveProject(id, {
                config: configState,
                artboards: artboards,
                thumbnailUrl: thumbnail
            });

            if (!skipStateUpdate && updatedProject.artboards) {
                const hydrated = hydrateArtboardsFromProject(updatedProject);
                setArtboards(hydrated);
            }

            if (!skipStateUpdate) {
                addNotification(lang === 'zh' ? '项目已保存' : 'Project Saved', 'success');
            }
        } catch (e: any) {
            console.error("Save Project Failed", e);
            // Auto-save failures should probably be less intrusive, but sticking to logic generally
            if (!skipStateUpdate) {
                addNotification(lang === 'zh' ? '保存失败' : 'Save Failed', 'error');
            }
        } finally {
            setIsSaving(false); // Always clear loading
        }
    };

    const handleUpdateProjectName = async (id: string, newName: string) => {
        try {
            await saveProject(id, { name: newName });
            setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
        } catch (e) {
            console.error("Update Name Failed", e);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        try {
            await deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            if (currentProjectId === projectId) {
                setCurrentProjectId(null);
                setArtboards([]);
            }
            addNotification(lang === 'zh' ? '项目已删除' : 'Project Deleted', 'success');
        } catch (e) {
            addNotification(lang === 'zh' ? '删除失败' : 'Delete Failed', 'error');
        }
    };

    // Update project config only (for settings modal)
    const handleUpdateProjectConfig = async (id: string, config: any) => {
        setIsSaving(true);
        try {
            // Find project
            const project = projects.find(p => p.id === id);
            if (!project) return;

            // Update project with new config
            const updatedProject = {
                ...project,
                config: config
            };

            // Only pass necessary fields to saveProject
            await saveProject(id, {
                config: config,
                name: updatedProject.name,
                description: updatedProject.description || undefined,
                thumbnailUrl: updatedProject.thumbnailUrl || undefined
            });

            // Update local state
            setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));

            addNotification(lang === 'zh' ? '项目配置已更新' : 'Project config updated', 'success');
        } catch (error) {
            console.error('Failed to update project config:', error);
            addNotification(lang === 'zh' ? '更新失败' : 'Update failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        // State
        projects, savedProjects, currentProjectId, isLoadingProject, isSaving,

        // Actions
        handleLoadProject, handleSaveProject, handleCreateBlankProject, handleUpdateProjectContent, handleUpdateProjectName, handleDeleteProject, handleUpdateProjectConfig, setCurrentProjectId
    };
}
