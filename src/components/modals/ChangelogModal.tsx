import React from 'react';
import { CHANGELOG, getLatestVersion, getChangelogByMonth, ChangelogEntry } from '../../data/changelog';
import { LangType } from '../../types';
import { Badge, Card, DialogShell, Flex, Text } from '../ui';

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
    <DialogShell
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={lang === 'zh' ? '更新日志' : 'Changelog'}
      description={(
        <>
          {lang === 'zh' ? '当前版本 ' : 'Current '}
          <Text as="span" weight="bold" color="ruby">v{latestVersion}</Text>
        </>
      )}
      size="sm"
      closeLabel={lang === 'zh' ? '关闭更新日志' : 'Close changelog'}
      footer={<Text size="1" color="gray">{lang === 'zh' ? '持续更新中，敬请期待更多功能' : 'More features coming soon'}</Text>}
    >
        <div className="space-y-6">
          {months.map((month) => (
            <div key={month}>
              <Flex align="center" gap="3" mb="3">
                <Text size="1" weight="bold" color="gray">
                  {formatMonth(month)}
                </Text>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              </Flex>

              <div className="space-y-3">
                {grouped[month].map((entry) => (
                  <EntryCard key={entry.version} entry={entry} lang={lang} formatDate={formatDate} />
                ))}
              </div>
            </div>
          ))}
        </div>
    </DialogShell>
  );
};

const EntryCard: React.FC<{
  entry: ChangelogEntry;
  lang: LangType;
  formatDate: (d: string) => string;
}> = ({ entry, lang, formatDate }) => {
  const typeStyle = typeColors[entry.type || 'feature'];

  return (
    <Card>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <Flex className="min-w-0" align="center" gap="2">
          <Text as="span" size="2" weight="bold" className="font-mono">
            v{entry.version}
          </Text>
          <Badge color={entry.type === 'fix' ? 'red' : entry.type === 'improvement' ? 'blue' : entry.type === 'breaking' ? 'amber' : 'ruby'} variant="soft">
            {lang === 'zh' ? typeStyle.label : entry.type}
          </Badge>
        </Flex>
        <Text size="1" color="gray">{formatDate(entry.date)}</Text>
      </div>

      <ul className="space-y-1.5">
        {entry.changes.map((change, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
            <span className="text-teal-500 mt-1 shrink-0">•</span>
            <span>{change}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default ChangelogModal;
