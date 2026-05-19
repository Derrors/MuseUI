import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../useUIState';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useUIState', () => {
    beforeEach(() => {
        localStorage.clear();
        // Mock documentElement
        document.documentElement.className = '';
        document.documentElement.style.colorScheme = '';
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useUIState());
        expect(result.current.lang).toBe('zh'); // Default is zh
        expect(result.current.theme).toBe('light');
        expect(result.current.devMode).toBe(false);
        expect(result.current.isProjectManagerOpen).toBe(false);
        expect(result.current.isGalleryOpen).toBe(false);
    });

    it('should toggle theme', () => {
        const { result } = renderHook(() => useUIState());

        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should toggle dev mode', () => {
        const { result } = renderHook(() => useUIState());

        act(() => {
            result.current.toggleDevMode();
        });
        expect(result.current.devMode).toBe(true);
        expect(localStorage.getItem('muse-ui-devmode')).toBe('true');
    });

    it('should handle notifications', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useUIState());

        act(() => {
            result.current.addNotification('Test Message', 'success');
        });

        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].message).toBe('Test Message');
        expect(result.current.notifications[0].type).toBe('success');

        // Fast-forward time to test auto-close
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.notifications).toHaveLength(0);
        vi.useRealTimers();
    });
});
