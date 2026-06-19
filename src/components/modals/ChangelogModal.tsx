import React from 'react';
import { CHANGELOG, getLatestVersion, getChangelogByMonth, ChangelogEntry } from '../../data/changelog';
import { LangType } from '../../types';

interface Props {
  lang: LangType;
  onClose: () => void;
}

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  feature: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', label: '新功能' },
  fix: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', label: '修复' },
  improvement: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: '优化' },
  breaking: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: '破坏性变更' },
};

const ChangelogModal: React.FC<Props> = ({ lang, onClose }) => {
  const latestVersion = getLatestVersion();
  const grouped = getChangelogByMonth();
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split('-');
    return lang === 'zh' ? `${y}年${parseInt(m)}月` : `${y}-${m}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return lang === 'zh'
      ? `${d.getMonth() + 1}月${d.getDate()}日`
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-2xl shadow-2xl w-full max-w-lg h-[100dvh] sm:h-auto sm:max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600 dark:text-teal-400">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                {lang === 'zh' ? '更新日志' : 'Changelog'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {lang === 'zh' ? '当前版本' : 'Current'} <span className="font-mono font-bold text-teal-600 dark:text-teal-400">v{latestVersion}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {months.map((month) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {formatMonth(month)}
                </h3>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              </div>

              <div className="space-y-3">
                {grouped[month].map((entry) => (
                  <EntryCard key={entry.version} entry={entry} lang={lang} formatDate={formatDate} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 border-t border-stone-200 dark:border-stone-700 text-center shrink-0">
          <p className="text-xs text-stone-400">
            {lang === 'zh' ? '持续更新中，敬请期待更多功能 ✨' : 'More features coming soon ✨'}
          </p>
        </div>
      </div>
    </div>
  );
};

const EntryCard: React.FC<{
  entry: ChangelogEntry;
  lang: LangType;
  formatDate: (d: string) => string;
}> = ({ entry, lang, formatDate }) => {
  const typeStyle = typeColors[entry.type || 'feature'];

  return (
    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4 border border-stone-100 dark:border-stone-700/50">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-sm font-bold text-stone-700 dark:text-stone-200">
            v{entry.version}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeStyle.bg} ${typeStyle.text}`}>
            {lang === 'zh' ? typeStyle.label : entry.type}
          </span>
        </div>
        <span className="text-xs text-stone-400">{formatDate(entry.date)}</span>
      </div>

      <ul className="space-y-1.5">
        {entry.changes.map((change, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
            <span className="text-teal-500 mt-1 shrink-0">•</span>
            <span>{change}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChangelogModal;
