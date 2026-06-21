import React, { useState } from 'react';
import { OptionCard } from './OptionCard';
import { Card, Text } from '../../ui';

interface Option {
  id: string;
  name: string;
  name_zh: string;
  description?: string;
  promptModifier?: string;
}

interface Props {
  label: string;
  label_zh: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  lang: 'en' | 'zh';
  recommendedId?: string;
  columns?: number;
  showDetailOnHover?: boolean;
}

export const DimensionSelector: React.FC<Props> = ({
  label, label_zh, options, value, onChange, lang, recommendedId, columns = 2, showDetailOnHover = true
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredOption = options.find(o => o.id === hoveredId);

  return (
    <div className="space-y-2">
      <Text as="label" size="1" weight="bold" color="gray">
        {lang === 'zh' ? label_zh : label}
      </Text>
      <div className={`grid gap-1.5 ${columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : columns === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {options.map(opt => (
          <div
            key={opt.id}
            onMouseEnter={() => showDetailOnHover && setHoveredId(opt.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <OptionCard
              id={opt.id}
              name={opt.name}
              name_zh={opt.name_zh}
              description={opt.description}
              isSelected={value === opt.id}
              isRecommended={opt.id === recommendedId}
              onClick={() => onChange(opt.id)}
              lang={lang}
            />
          </div>
        ))}
      </div>
      {showDetailOnHover && hoveredOption?.promptModifier && (
        <Card className="text-[10px] leading-relaxed text-[var(--gray-10)]">
          {hoveredOption.promptModifier.substring(0, 200)}...
        </Card>
      )}
    </div>
  );
};
