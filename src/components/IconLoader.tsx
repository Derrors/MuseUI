
import React from 'react';


export type IconName =
    | 'settings' | 'upload' | 'refresh' | 'close' | 'check' | 'chevron-down' | 'chevron-left' | 'chevron-right' | 'plus' | 'trash'
    | 'edit' | 'zoom-in' | 'zoom-out' | 'tidy' | 'fit' | 'reset' | 'download' | 'share'
    | 'grid' | 'list' | 'code' | 'image' | 'moon' | 'sun' | 'palette' | 'layout' | 'magic-wand' | 'info' | 'menu' | 'search' | 'drag'
    | 'save' | 'refresh-cw' | 'x' | 'loader' | 'logout' | 'copy' | 'clipboard'
    | 'smartphone' | 'tablet' | 'monitor' | 'globe' | 'camera';

interface Props {
    name: IconName;
    size?: number | string;
    className?: string;
    style?: React.CSSProperties;
}

const ICONS: Record<IconName, React.ReactNode> = {
    settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
    refresh: <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    check: <path d="M20 6 9 17l-5-5" />,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
    'zoom-in': <path d="m21 21-4.343-4.343M11 8v6M8 11h6M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />,
    'zoom-out': <path d="m21 21-4.343-4.343M8 11h6M19 11a8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8Z" />,
    tidy: <path d="M3 6h18M3 12h18M3 18h18" />, // List-like icon for Tidy
    fit: <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />,
    reset: <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />, // Similar to refresh but often used for reset view
    download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
    share: <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />,
    grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    code: <path d="m16 18 6-6-6-6M8 6 2 12l6 6" />,
    image: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />, // Same as upload? Let's use image icon
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
    sun: <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />,
    palette: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />, // Shield-like? No, let's use circle logic or paintbrush in update.
    layout: <path d="M3 3h18v18H3zM3 9h18M9 21V9" />,
    'magic-wand': <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />,
    info: <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01" />,
    menu: <path d="M3 12h18M3 6h18M3 18h18" />,
    search: <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    drag: <path d="M9 17h6M9 13h6M9 9h6" />,
    save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8V3" />,
    'refresh-cw': <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    loader: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />,
    smartphone: <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />,
    tablet: <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
    copy: <><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
    clipboard: <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></>,
    camera: (
        <>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </>
    ),
};

const IconLoader: React.FC<Props> = ({ name, size = 16, className = "", style }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 ${className}`}
            style={style}
        >
            {ICONS[name] || <circle cx="12" cy="12" r="10" />}
        </svg>
    );
};

export default IconLoader;
