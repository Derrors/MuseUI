
import React from 'react';
import { LangType } from '../../types';
import { Button, DialogShell, Text, TextAreaField } from '../ui';

interface Props {
  batchConfirmation: { resolve: (p: string | null) => void, prompt: string, pageName: string, index: number, total: number } | null;
  setBatchConfirmation: (val: any) => void;
  lang: LangType;
}

const BatchConfirmationModal: React.FC<Props> = ({ batchConfirmation, setBatchConfirmation, lang }) => {
  if (!batchConfirmation) return null;

  return (
    <DialogShell
        open={!!batchConfirmation}
        onOpenChange={(open) => { if (!open) batchConfirmation.resolve(null); }}
        title={lang === 'zh' ? `批量生成确认 (${batchConfirmation.index}/${batchConfirmation.total})` : `Batch Generation (${batchConfirmation.index}/${batchConfirmation.total})`}
        description={(
            <>
                {lang === 'zh' ? '即将生成页面：' : 'Next page: '}
                <Text as="span" weight="bold" color="ruby">{batchConfirmation.pageName}</Text>
            </>
        )}
        size="sm"
        closeLabel={lang === 'zh' ? '关闭批量确认' : 'Close batch confirmation'}
        footer={(
            <>
                <Button onClick={() => batchConfirmation.resolve(null)} variant="soft" color="red">
                    {lang === 'zh' ? '停止批量' : 'Stop Batch'}
                </Button>
                <Button onClick={() => batchConfirmation.resolve(batchConfirmation.prompt)} color="ruby" iconName="magic-wand">
                    {lang === 'zh' ? '生成' : 'Generate'}
                </Button>
            </>
        )}
    >
            <TextAreaField
                label="Prompt Preview"
                rows={12}
                className="min-h-[260px] font-mono text-xs"
                value={batchConfirmation.prompt}
                onValueChange={(value) => setBatchConfirmation({ ...batchConfirmation, prompt: value })}
            />
    </DialogShell>
  );
};

export default BatchConfirmationModal;
