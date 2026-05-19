import { useState, useEffect } from 'react';
import { LangType } from '../types';

export const useUIState = () => {
    // --- STATE ---
    const [lang, setLang] = useState<LangType>('zh');
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [devMode, setDevMode] = useState(false);
    const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

    const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000); // Auto close
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Confirmation
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

    const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirm = () => setConfirmDialog(null);

    // Persistence
    useEffect(() => {
        const savedTheme = localStorage.getItem('muse-ui-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);

        const savedDevMode = localStorage.getItem('muse-ui-devmode');
        if (savedDevMode === 'true') setDevMode(true);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') { root.classList.add('dark'); root.style.colorScheme = 'dark'; }
        else { root.classList.remove('dark'); root.style.colorScheme = 'light'; }
        localStorage.setItem('muse-ui-theme', theme);
    }, [theme]);

    // Actions
    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    const toggleDevMode = () => { setDevMode(!devMode); localStorage.setItem('muse-ui-devmode', String(!devMode)); };

    return {
        // State
        lang, theme, devMode, isProjectManagerOpen, isGalleryOpen,
        notifications, confirmDialog,

        // Actions
        setLang, toggleTheme, toggleDevMode, setIsProjectManagerOpen, setIsGalleryOpen,
        addNotification, removeNotification,
        requestConfirm, closeConfirm
    };
};
