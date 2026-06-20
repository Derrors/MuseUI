
import { renderHook, act } from '@testing-library/react';
import { useGenerationLogic } from '../useGenerationLogic';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as aiGenerationService from '../../services/aiGenerationService';

vi.mock('../../services/aiGenerationService');

describe('useGenerationLogic', () => {
    const lang = 'zh';
    const mockAddNotification = vi.fn();

    // Mock Config State
    const mockConfig: any = {
        platform: 'mobile',
        resolution: { width: 375, height: 667 },
        customSize: { width: 375, height: 667, active: false },
        style: { name: 'Modern' },
        description: 'Test Desc',
        pageName: 'Home',
        keywords: [],
        enableDesignTokens: false,
        designTokens: {},
        background: { type: 'color', value: '#fff' },
        highQuality: false,
        forceChinese: false,
        batchOutputMode: 'separate',
        specMode: 'image',
        pages: [],
        colorImage: null,
        referenceImages: [],
        promptLanguage: null,
        preferredImageApiId: null,
        designMdContent: null,
        visualStyleContent: null,
        layoutDensityContent: null,
        activeRole: 'designer',
        skillMode: false,
        activeSkill: null,
        skillConfig: null,
        isBatchMode: false,
        setDescription: vi.fn(),
        setPages: vi.fn(),
        setCustomStyles: vi.fn(),
        setStyle: vi.fn(),
        setIsAutoGeneratingPages: vi.fn(),
    };

    // Mock Canvas State
    const mockCanvas: any = {
        layoutImage: null,
        layoutElements: [],
        layoutAnalysis: null,
        setLayoutAnalysis: vi.fn(),
        setArtboards: vi.fn(),
        setArtboardGroups: vi.fn(),
        handleSaveToHistory: vi.fn(),
        getImageDimensions: vi.fn().mockResolvedValue({ width: 375, height: 667 }),
        artboardGroups: [],
        artboards: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useGenerationLogic(lang, mockConfig, mockCanvas));
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle auto generate pages', async () => {
        const { result } = renderHook(() => useGenerationLogic(lang, mockConfig, mockCanvas));
        const mockPages = [{ name: 'P1', description: 'D1' }];
        (aiGenerationService.generatePageList as any).mockResolvedValue(mockPages);

        await act(async () => {
            await result.current.handleAutoGeneratePages();
        });

        expect(mockConfig.setIsAutoGeneratingPages).toHaveBeenCalledWith(true);
        expect(aiGenerationService.generatePageList).toHaveBeenCalled();
        expect(mockConfig.setPages).toHaveBeenCalledWith(mockPages);
        expect(mockConfig.setIsAutoGeneratingPages).toHaveBeenCalledWith(false);
    });

    it('should handle confirm generation (single)', async () => {
        const { result } = renderHook(() => useGenerationLogic(lang, mockConfig, mockCanvas));
        const mockAsset = { id: 'a1', url: 'test.png', prompt: 'prompt', timestamp: 123, base64: 'b64' };

        (aiGenerationService.constructPrompt as any).mockReturnValue('Constructed Prompt');
        (aiGenerationService.generateUIReference as any).mockResolvedValue(mockAsset);
        mockCanvas.getImageDimensions.mockResolvedValue({ width: 375, height: 667 });

        await act(async () => {
            await result.current.handleConfirmGeneration();
        });

        expect(result.current.isGenerating).toBe(false);
        expect(aiGenerationService.generateUIReference).toHaveBeenCalled();
        expect(mockCanvas.setArtboards).toHaveBeenCalled();
    });

    it('should preserve the latest prompt when regenerating an artboard', async () => {
        const oldImage: any = {
            id: 'old-img',
            url: 'old.png',
            prompt: 'old prompt',
            timestamp: 1,
            details: {
                platform: 'mobile',
                resolution: '375x667',
                style: 'Modern',
                tokens: {},
                fullPrompt: 'old full prompt',
                batchId: 'batch-1',
                originalDescription: 'Original description',
            },
        };
        const artboards: any[] = [{
            id: 'board-1',
            x: 0,
            y: 0,
            width: 375,
            height: 667,
            image: oldImage,
            history: [oldImage],
            label: 'Home',
        }];
        const canvas = {
            ...mockCanvas,
            artboards,
            setArtboards: vi.fn(),
            getImageDimensions: vi.fn().mockResolvedValue({ width: 400, height: 700 }),
        };
        const mockAsset = {
            id: 'new-img',
            url: 'new.png',
            prompt: 'new prompt',
            timestamp: 2,
            base64: 'new-b64',
        };

        (aiGenerationService.generateUIReference as any).mockResolvedValue(mockAsset);

        const { result } = renderHook(() => useGenerationLogic(lang, mockConfig, canvas));

        await act(async () => {
            await result.current.handleRegenerateArtboard('board-1', 'Make it brighter', null, null, null);
        });

        const updater = canvas.setArtboards.mock.calls[0][0];
        const nextArtboards = updater(artboards);

        expect(nextArtboards[0].image.details.fullPrompt).toContain('Make it brighter');
        expect(nextArtboards[0].image.details.fullPrompt).not.toBe('old full prompt');
        expect(nextArtboards[0].image.details.batchId).toBe('batch-1');
        expect(nextArtboards[0].image.details.resolution).toBe('400x700');
    });
});
