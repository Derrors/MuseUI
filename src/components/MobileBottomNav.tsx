import React from 'react';
import IconLoader from './IconLoader';
import { LangType } from '../types';

export type MobilePane = 'config' | 'canvas';

interface Props {
  activePane: MobilePane;
  onChange: (pane: MobilePane) => void;
  lang: LangType;
  hasArtboards: boolean;
}

const MobileBottomNav: React.FC<Props> = ({ activePane, onChange, lang, hasArtboards }) => {
  const items: Array<{ id: MobilePane; icon: 'settings' | 'palette'; zh: string; en: string }> = [
    { id: 'config', icon: 'settings', zh: '配置', en: 'Config' },
    { id: 'canvas', icon: 'palette', zh: '画布', en: 'Canvas' },
  ];

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={lang === 'zh' ? '移动端主导航' : 'Mobile navigation'}
    >
      <div className="grid grid-cols-2 gap-2 px-3 py-2">
        {items.map(item => {
          const active = activePane === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative min-h-11 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <IconLoader name={item.icon} size={16} />
              {lang === 'zh' ? item.zh : item.en}
              {item.id === 'canvas' && hasArtboards && !active && (
                <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-teal-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
