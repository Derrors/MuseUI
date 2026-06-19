
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAppLogic } from '@/hooks/useAppLogic';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectService from '../../services/idbProjectService';

// Mock services
vi.mock('../../services/idbProjectService', () => ({
    getProjects: vi.fn().mockResolvedValue([]),
    getProjectById: vi.fn(),
    saveProject: vi.fn(),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
}));

vi.mock('@/services/idbHistoryService', () => ({
    getHistory: vi.fn().mockResolvedValue([]),
    saveImageToHistory: vi.fn(),
    getAssetDetails: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key: string) => { delete store[key]; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAppLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        (projectService.createProject as any).mockResolvedValue({ id: 'new-id-1', name: 'Untitled Project', artboards: [] });
    });

    it('should initialize with default values', async () => {
        const { result } = renderHook(() => useAppLogic());

        // Check key logic state initialization
        expect(result.current.state.platform).toBe('mobile');
        expect(result.current.state.artboards).toEqual([]);
        await waitFor(() => {
            expect(result.current.state.currentProjectId).toBe('new-id-1');
        });
    });

    it('should load project and hydrate artboards', async () => {
        const mockProject = {
            id: 'p-1',
            config: { platform: 'pc', description: 'Restored description' },
            artboards: [
                {
                    id: 'ab-1',
                    name: 'Test AB',
                    image: { id: 'img-1', url: 'http://test.com/img.png' },
                    history: []
                }
            ]
        };
        (projectService.getProjectById as any).mockResolvedValue(mockProject);

        const { result } = renderHook(() => useAppLogic());

        await act(async () => {
            await result.current.actions.handleLoadProject('p-1');
        });

        await waitFor(() => {
            expect(result.current.state.platform).toBe('pc');
            expect(result.current.state.description).toBe('Restored description');
            expect(result.current.state.artboards).toHaveLength(1);
        });
    });


    it('should save project', async () => {
        // Mock createProject response for handleSaveProject
        (projectService.createProject as any).mockResolvedValue({ id: 'new-id-1' });
        (projectService.saveProject as any).mockResolvedValue({ id: 'new-id-1', artboards: [] });

        const { result } = renderHook(() => useAppLogic());

        await act(async () => {
            await result.current.actions.handleSaveProject('My New Project');
        });

        expect(projectService.createProject).toHaveBeenCalledWith(expect.objectContaining({ name: 'My New Project' }));
        expect(projectService.saveProject).toHaveBeenCalled();
    });

    it('should update project name', async () => {
        // Setup initial state mocked (or just call action)
        // Since it's a hook, we just call the action.
        // We assume artboards are empty for simplicity or mocked.

        const { result } = renderHook(() => useAppLogic());

        await act(async () => {
            await result.current.actions.handleUpdateProjectName('proj-1', 'New Name');
        });

        expect(projectService.saveProject).toHaveBeenCalledWith('proj-1', { name: 'New Name' });
    });

    it('should delete project and clear state', async () => {
        const { result } = renderHook(() => useAppLogic());

        await waitFor(() => {
            expect(result.current.state.currentProjectId).toBe('new-id-1');
        });

        (projectService.deleteProject as any).mockResolvedValue(undefined);

        await act(async () => {
            await result.current.actions.handleDeleteProject('new-id-1');
        });

        expect(projectService.deleteProject).toHaveBeenCalledWith('new-id-1');
        expect(result.current.state.currentProjectId).toBe(null);
    });
});
